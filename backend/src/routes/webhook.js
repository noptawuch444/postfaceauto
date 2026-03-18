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
        console.log(`📡 [WEBHOOK] Incoming Object Type: ${body.object}`);
    }

    // Check if this is an event from a page subscription
    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            const pageId = entry.id;

            if (!entry.changes) {
                console.log(`⚠️ [WEBHOOK] Entry received for ${pageId} but no changes found.`);
                return;
            }

            for (const change of entry.changes) {
                console.log(`🔍 [WEBHOOK] Change detected on field: "${change.field}" (Value Item: "${change.value?.item}", Verb: "${change.value?.verb}")`);

                // We only care about new comments on the feed
                if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                    const commentValue = change.value;
                    const commentId = commentValue.comment_id;
                    const postId = commentValue.post_id;
                    const commentText = commentValue.message;
                    const senderId = commentValue.from.id;
                    const senderName = commentValue.from.name;

                    console.log(`📩 [WEBHOOK] [Page: ${pageId}] New comment "${commentText.substring(0, 30)}..." on Post: ${postId} from: ${senderName} (${senderId})`);

                    // 1. Avoid self-reply
                    if (senderId === pageId) {
                        console.log('⏭️ [WEBHOOK] Skipping self-reply (Comment is from the page itself)');
                        continue;
                    }

                    try {
                        // 2. Resolve Post ID Variations
                        const postIdParts = postId ? postId.split('_') : [];
                        const rawPostId = postIdParts.length > 1 ? postIdParts[postIdParts.length - 1] : postId;
                        const fullPostId = postId;

                        console.log(`🔍 [WEBHOOK] Searching DB for post mapping: [Full: ${fullPostId}] [Raw: ${rawPostId}]`);

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
                            console.log(`✅ [WEBHOOK] specific post match found. Auto-Reply Enabled: ${post.auto_reply_enabled}`);

                            if (post.auto_reply_enabled) {
                                const replyText = post.post_reply || post.template_reply;
                                if (replyText) {
                                    console.log(`🤖 [WEBHOOK] Replying to ${commentId} with: "${replyText.substring(0, 20)}..."`);
                                    await facebook.replyToComment(commentId, post.page_access_token, replyText);
                                    console.log('✨ [WEBHOOK] Auto-reply successful!');
                                } else {
                                    console.log('⏹️ [WEBHOOK] Match found, but reply text is empty.');
                                }
                            }
                        } else {
                            console.log(`❓ [WEBHOOK] No specific post ID match. Trying fallback (Page-wide active template)...`);

                            const fallbackResult = await db.query(
                                `SELECT t.auto_reply_enabled, t.auto_reply_text as template_reply, p.page_access_token
                                 FROM templates t
                                 JOIN pages p ON t.page_id = p.page_id
                                 WHERE p.page_id = $1 AND t.auto_reply_enabled = true
                                 ORDER BY t.created_at DESC LIMIT 1`,
                                [pageId]
                            );

                            if (fallbackResult.rows.length > 0) {
                                const template = fallbackResult.rows[0];
                                const replyText = template.template_reply;

                                if (replyText) {
                                    console.log(`🤖 [WEBHOOK] [FALLBACK] Replying to ${commentId} using template default...`);
                                    await facebook.replyToComment(commentId, template.page_access_token, replyText);
                                    console.log('✨ [WEBHOOK] Fallback auto-reply successful!');
                                }
                            } else {
                                console.log(`❌ [WEBHOOK] No match and no fallback template found for Page: ${pageId}`);
                            }
                        }
                    } catch (err) {
                        console.error('❌ [WEBHOOK] Auto-reply processing error:', err.message);
                    }
                }
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
