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

    // Log the event type for basic visual confirmation in Render logs
    if (body.object) {
        console.log(`📡 Incoming Webhook Event: ${body.object}`);
    }

    // Check if this is an event from a page subscription
    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            const pageId = entry.id;

            entry.changes.forEach(async (change) => {
                // We only care about new comments on the feed
                if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                    const commentValue = change.value;
                    const commentId = commentValue.comment_id;
                    const postId = commentValue.post_id; // Usually "pageId_postId" or just "postId"
                    const message = commentValue.message;
                    const senderId = commentValue.from.id;

                    console.log(`📩 [${pageId}] New comment on ${postId}: "${message.substring(0, 20)}..." from ${senderId}`);

                    // 1. Avoid self-reply
                    if (senderId === pageId) {
                        console.log('⏭️ Skipping self-reply (Comment is from the page itself)');
                        return;
                    }

                    try {
                        // 2. Resolve Post ID Variations
                        // Facebook sends postId in formats like "123456789_987654321" (pageId_postId)
                        // But we might store it as just "987654321" or the full string.
                        const postIdParts = postId ? postId.split('_') : [];
                        const rawPostId = postIdParts.length > 1 ? postIdParts[postIdParts.length - 1] : postId;
                        const fullPostId = postId;

                        console.log(`🔍 Searching for Post Match: [Full: ${fullPostId}] [Raw: ${rawPostId}]`);

                        const result = await db.query(
                            `SELECT t.auto_reply_enabled, t.auto_reply_text as template_reply, ps.auto_reply_text as post_reply, p.page_access_token
                             FROM posts ps
                             JOIN templates t ON ps.template_id = t.id
                             JOIN pages p ON t.page_id = p.page_id
                             WHERE (ps.fb_post_id = $1 OR ps.fb_post_id = $2 OR ps.fb_post_id LIKE $3)
                               AND p.page_id = $4`,
                            [fullPostId, rawPostId, `%${rawPostId}`, pageId]
                        );

                        if (result.rows.length > 0) {
                            const post = result.rows[0];

                            // 3. Check if auto-reply is enabled for this template
                            if (post.auto_reply_enabled) {
                                // Prefer post-specific text, fall back to template text
                                const replyText = post.post_reply || post.template_reply;

                                if (replyText) {
                                    console.log(`🤖 Auto-replying to ${commentId} with: "${replyText.substring(0, 20)}..."`);
                                    await facebook.replyToComment(commentId, post.page_access_token, replyText);
                                    console.log('✅ Auto-reply successful!');
                                } else {
                                    console.log('⏹️ Match found, but no reply text is configured.');
                                }
                            } else {
                                console.log('⏹️ Match found, but Auto-Reply is DISABLED for this template.');
                            }
                        } else {
                            console.log(`❓ No matching post found in database for ID: ${postId}`);
                            // Optional: Log a few existing IDs to help debug
                            const debugIds = await db.query('SELECT fb_post_id FROM posts WHERE fb_post_id IS NOT NULL LIMIT 3');
                            console.log('💡 Database has IDs like:', debugIds.rows.map(r => r.fb_post_id));
                        }
                    } catch (err) {
                        console.error('❌ Auto-reply error:', err.message);
                    }
                }
            });
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
