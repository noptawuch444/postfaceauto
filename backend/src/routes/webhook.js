const express = require('express');
const db = require('../db');
const facebook = require('../services/facebook');
const router = express.Router();

// GET /api/webhook - Facebook Webhook Verification (Hub Challenge)
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN || 'gs_webhook_token_2025';

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook Verified!');
            res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook Verification Failed (Token Mismatch)');
            res.sendStatus(403);
        }
    }
});

// POST /api/webhook - Handle incoming events
router.post('/', async (req, res) => {
    const body = req.body;

    // Check if this is an event from a page subscription
    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            // entry.changes contains the actual event data
            entry.changes.forEach(async (change) => {
                if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                    const commentValue = change.value;
                    const commentId = commentValue.comment_id;
                    const postId = commentValue.post_id;
                    const pageId = entry.id;
                    const message = commentValue.message;
                    const senderId = commentValue.from.id;

                    console.log(`📩 New comment on post ${postId}: "${message}" from ${senderId}`);

                    // 1. Avoid self-reply (if sender is the page itself)
                    if (senderId === pageId) {
                        console.log('⏭️ Skipping self-comment');
                        return;
                    }

                    try {
                        // 2. Map FB Post ID to Template ID via posts table
                        // Facebook sends post_id as "pageId_postId" format, 
                        // but we may store it as just postId or with a different format
                        const postIdParts = postId ? postId.split('_') : [];
                        const shortPostId = postIdParts.length > 1 ? postIdParts[postIdParts.length - 1] : postId;
                        const fullPostId = postId;
                        const altPostId = `${pageId}_${shortPostId}`;

                        console.log(`🔍 Looking for post: "${fullPostId}" or "${shortPostId}" or "${altPostId}"...`);

                        const result = await db.query(
                            `SELECT t.auto_reply_enabled, t.auto_reply_text as template_reply, ps.auto_reply_text as post_reply, p.page_access_token
                             FROM posts ps
                             JOIN templates t ON ps.template_id = t.id
                             JOIN pages p ON t.page_id = p.page_id
                             WHERE ps.fb_post_id = $1 
                                OR ps.fb_post_id = $2 
                                OR ps.fb_post_id = $3
                                OR ps.fb_post_id LIKE $4
                                OR ps.fb_post_id LIKE $5`,
                            [fullPostId, shortPostId, altPostId, `%_${shortPostId}`, `${pageId}%`]
                        );

                        if (result.rows.length > 0) {
                            const post = result.rows[0];

                            // 3. Check if auto-reply is enabled for this template
                            if (post.auto_reply_enabled) {
                                // Prefer post-specific text, fall back to template text
                                const replyText = post.post_reply || post.template_reply;

                                if (replyText) {
                                    console.log(`🤖 Attempting auto-reply to comment ${commentId}...`);
                                    await facebook.replyToComment(commentId, post.page_access_token, replyText);
                                    console.log('✅ Auto-reply sent!');
                                } else {
                                    console.log('⏹️ No auto-reply text configured.');
                                }
                            } else {
                                console.log('⏹️ Auto-reply is disabled for this template.');
                            }
                        } else {
                            // Debug: show all stored post IDs for this page
                            const debugResult = await db.query(
                                `SELECT ps.fb_post_id FROM posts ps 
                                 JOIN templates t ON ps.template_id = t.id
                                 JOIN pages p ON t.page_id = p.page_id
                                 WHERE p.page_id = $1 AND ps.fb_post_id IS NOT NULL LIMIT 5`,
                                [pageId]
                            );
                            console.log(`❓ Post ID not found. Stored IDs for this page:`, debugResult.rows.map(r => r.fb_post_id));
                        }
                    } catch (err) {
                        console.error('❌ Auto-reply error:', err.message);
                    }
                }
            });
        });

        // Always return 200 OK to Facebook
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
