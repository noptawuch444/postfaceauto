/**
 * Comment Poller Service
 * 
 * Polls the Facebook Graph API for new comments on posts 
 * and auto-replies based on configured templates.
 * 
 * This bypasses Facebook webhooks entirely, working 100% 
 * even when the app is in Development Mode.
 */

const fetch = require('node-fetch');
const db = require('../db');

const FB_GRAPH = 'https://graph.facebook.com/v18.0';
const POLL_INTERVAL = 30 * 1000; // 30 seconds

// Track which comments we've already replied to (in DB)
async function ensureTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS replied_comments (
            comment_id VARCHAR(255) PRIMARY KEY,
            post_id VARCHAR(255),
            page_id VARCHAR(255),
            reply_text TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);
}

// Fetch comments for a specific post
async function getPostComments(postId, pageAccessToken) {
    try {
        const res = await fetch(
            `${FB_GRAPH}/${postId}/comments?fields=id,message,from,created_time&limit=25&access_token=${pageAccessToken}`
        );
        const data = await res.json();

        // Log the result of the fetch for debugging
        await db.query('INSERT INTO webhook_logs (type, msg, data) VALUES ($1, $2, $3)',
            ['DEBUG_FETCH_COMMENTS', `Fetched ${data.data?.length || 0} comments for ${postId}`, JSON.stringify({
                hasError: !!data.error,
                error: data.error?.message,
                commentCount: data.data?.length || 0,
                firstComment: data.data?.[0]?.message?.substring(0, 50)
            })
            ]).catch(() => { });

        if (data.error) {
            console.error(`❌ [POLLER] Error fetching comments for ${postId}:`, data.error.message);
            return [];
        }
        return data.data || [];
    } catch (err) {
        console.error(`❌ [POLLER] Network error fetching comments:`, err.message);
        return [];
    }
}

// Reply to a comment
async function replyToComment(commentId, pageAccessToken, message) {
    try {
        const res = await fetch(`${FB_GRAPH}/${commentId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, access_token: pageAccessToken }),
        });
        const data = await res.json();
        if (data.error) {
            console.error(`❌ [POLLER] Reply failed for ${commentId}:`, data.error.message);
            await db.query('INSERT INTO webhook_logs (type, msg, data) VALUES ($1, $2, $3)',
                ['POLLER_ERROR', `Reply failed for ${commentId}`, JSON.stringify(data.error)]
            ).catch(() => { });
            return null;
        }
        return data;
    } catch (err) {
        console.error(`❌ [POLLER] Network error replying:`, err.message);
        return null;
    }
}

// Check if we already replied to this comment
async function hasReplied(commentId) {
    const result = await db.query('SELECT 1 FROM replied_comments WHERE comment_id = $1', [commentId]);
    return result.rows.length > 0;
}

// Record that we replied to a comment
async function markReplied(commentId, postId, pageId, replyText) {
    await db.query(
        'INSERT INTO replied_comments (comment_id, post_id, page_id, reply_text) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [commentId, postId, pageId, replyText]
    );
}

// Get the auto-reply text for a page/post
async function getAutoReplyText(pageId, postId) {
    // First try to match specific post
    const postMatch = await db.query(`
        SELECT t.auto_reply_text 
        FROM posts p 
        JOIN templates t ON p.template_id = t.id 
        WHERE p.fb_post_id = $1 AND t.auto_reply_enabled = true AND t.auto_reply_text IS NOT NULL
    `, [postId]);

    if (postMatch.rows.length > 0) {
        return postMatch.rows[0].auto_reply_text;
    }

    // Fallback: get any auto-reply template for this page
    const fallback = await db.query(`
        SELECT t.auto_reply_text, p.page_access_token
        FROM templates t
        JOIN pages p ON t.page_id = p.page_id
        WHERE p.page_id = $1 AND t.auto_reply_enabled = true AND t.auto_reply_text IS NOT NULL
        ORDER BY t.updated_at DESC LIMIT 1
    `, [pageId]);

    if (fallback.rows.length > 0) {
        return fallback.rows[0].auto_reply_text;
    }

    return null;
}

// Main polling function
async function pollAllPages() {
    // Log cycle start
    await db.query('INSERT INTO webhook_logs (type, msg) VALUES ($1, $2)', ['POLLER_CYCLE_START', 'Checking for new comments...']).catch(() => { });

    try {
        // Get all connected pages with auto-reply enabled
        const pagesResult = await db.query(`
            SELECT DISTINCT p.page_id, p.page_name, p.page_access_token
            FROM pages p
            JOIN templates t ON t.page_id = p.page_id
            WHERE t.auto_reply_enabled = true AND t.auto_reply_text IS NOT NULL
        `);

        if (pagesResult.rows.length === 0) {
            return; // No pages with auto-reply enabled
        }

        for (const page of pagesResult.rows) {
            // Get recent posts for this page (posts join with templates join with pages)
            const postsResult = await db.query(`
                SELECT ps.fb_post_id FROM posts ps
                JOIN templates t ON ps.template_id = t.id
                JOIN pages p ON t.page_id = p.page_id
                WHERE p.page_id = $1 AND ps.fb_post_id IS NOT NULL
                ORDER BY ps.created_at DESC LIMIT 10
            `, [page.page_id]);

            for (const post of postsResult.rows) {
                const comments = await getPostComments(post.fb_post_id, page.page_access_token);

                for (const comment of comments) {
                    const debugData = { commentId: comment.id, fromId: comment.from?.id, fromName: comment.from?.name };

                    // Skip if already replied
                    if (await hasReplied(comment.id)) {
                        // Silent skip for already replied
                        continue;
                    }

                    // Skip comments from the page itself
                    if (comment.from && comment.from.id === page.page_id) {
                        console.log(`[POLLER] Skipping self-comment ${comment.id}`);
                        await markReplied(comment.id, post.fb_post_id, page.page_id, '[SELF]');
                        continue;
                    }

                    // Get auto-reply text
                    const replyText = await getAutoReplyText(page.page_id, post.fb_post_id);
                    if (!replyText) {
                        await db.query('INSERT INTO webhook_logs (type, msg, data) VALUES ($1, $2, $3)',
                            ['POLLER_SKIP', `No reply template for ${page.page_name}`, JSON.stringify(debugData)]
                        ).catch(() => { });
                        continue;
                    }

                    // Send reply!
                    console.log(`🤖 [POLLER] Replying to comment ${comment.id} from ${comment.from?.name || 'Unknown'}`);
                    await db.query('INSERT INTO webhook_logs (type, msg, data) VALUES ($1, $2, $3)',
                        ['POLLER_ATTEMPT', `Replying to ${comment.from?.name || 'Unknown'}`, JSON.stringify({ ...debugData, replyText: replyText.substring(0, 50) })]
                    ).catch(() => { });

                    const result = await replyToComment(comment.id, page.page_access_token, replyText);

                    if (result) {
                        await markReplied(comment.id, post.fb_post_id, page.page_id, replyText);
                        console.log(`✅ [POLLER] Successfully replied! FB Reply ID: ${result.id}`);

                        // Log to webhook_logs table for visibility
                        try {
                            await db.query(
                                'INSERT INTO webhook_logs (type, msg, data) VALUES ($1, $2, $3)',
                                ['POLLER_REPLY', `Auto-replied to ${comment.from?.name || 'Unknown'}`, JSON.stringify({
                                    commentId: comment.id,
                                    postId: post.fb_post_id,
                                    pageName: page.page_name,
                                    replyText: replyText.substring(0, 100),
                                    fbReplyId: result.id
                                })]
                            );
                        } catch (e) { /* ignore log errors */ }
                    }
                }
            }
        }
    } catch (err) {
        console.error('❌ [POLLER] Error in poll cycle:', err.message);
    }
}

// Start the polling service
async function startCommentPoller() {
    try {
        await ensureTable();
        console.log('🔄 [POLLER] Comment Poller started (every 30s)');

        // Run immediately on start
        await pollAllPages();

        // Then run every 30 seconds
        setInterval(pollAllPages, POLL_INTERVAL);
    } catch (err) {
        console.error('❌ [POLLER] Failed to start:', err.message);
    }
}

module.exports = { startCommentPoller, pollAllPages };
