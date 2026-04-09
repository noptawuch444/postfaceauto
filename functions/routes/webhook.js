const express = require('express');
const dbHelper = require('../db');
const facebook = require('../services/facebook');
const functions = require('firebase-functions');
const router = express.Router();

// GET /api/webhook - Facebook Webhook Verification
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN || functions.config().facebook?.verify_token || 'gs_webhook_token_2025';

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

// Main Webhook Processing Logic
async function processEvents(body) {
    if (body.object !== 'page') return;

    for (const entry of body.entry) {
        const pageId = entry.id;
        if (!entry.changes) continue;

        for (const change of entry.changes) {
            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                const val = change.value;
                const commentId = val.id || val.comment_id;
                const postId = val.post_id || val.parent_id;
                const senderId = val.from?.id;
                const senderName = val.from?.name || 'Unknown';

                console.log(`📩 [WEBHOOK] [Page: ${pageId}] New comment on Post: ${postId} from: ${senderName}`);

                if (senderId === pageId) {
                    console.log('⏭️ [WEBHOOK] Skipping self-reply');
                    continue;
                }

                try {
                    const postIdParts = postId ? postId.split('_') : [];
                    const rawPostId = postIdParts.length > 1 ? postIdParts[postIdParts.length - 1] : postId;

                    // Query Firestore for matching post
                    // We check for exact match only as Firestore doesn't support OR across fields or LIKE easily
                    let posts = await dbHelper.query(dbHelper.collections.POSTS, [['fb_post_id', '==', postId]]);
                    if (posts.length === 0 && rawPostId !== postId) {
                        posts = await dbHelper.query(dbHelper.collections.POSTS, [['fb_post_id', '==', rawPostId]]);
                    }

                    if (posts.length > 0) {
                        const post = posts[0];
                        const templates = await dbHelper.query(dbHelper.collections.TEMPLATES, [['id', '==', post.template_id]]);
                        const template = templates[0] || {};
                        const pages = await dbHelper.query(dbHelper.collections.PAGES, [['page_id', '==', pageId]]);
                        const page = pages[0] || {};

                        if (template.auto_reply_enabled) {
                            const replyText = post.auto_reply_text || template.auto_reply_text;
                            if (replyText) {
                                console.log(`🤖 [WEBHOOK] Replying to ${commentId}...`);
                                if (!commentId.startsWith('TEST_ID_')) {
                                    await facebook.replyToComment(commentId, page.page_access_token, replyText);
                                    console.log('✨ [WEBHOOK] Auto-reply successful!');
                                } else {
                                    console.log('✨ [WEBHOOK] [TEST-SUCCESS] Diagnostic match found! (Skip actual FB call for mock ID)');
                                }
                            }
                        }
                    } else {
                        // Fallback logic
                        const latestTemplates = await dbHelper.query(dbHelper.collections.TEMPLATES, [
                            ['page_id', '==', pageId],
                            ['auto_reply_enabled', '==', true]
                        ]);

                        if (latestTemplates.length > 0) {
                            // Sort locally to get latest
                            latestTemplates.sort((a, b) => (b.created_at?.toDate() || 0) - (a.created_at?.toDate() || 0));
                            const fallback = latestTemplates[0];
                            const pages = await dbHelper.query(dbHelper.collections.PAGES, [['page_id', '==', pageId]]);
                            const page = pages[0] || {};

                            console.log(`🤖 [WEBHOOK] Fallback reply to ${commentId}...`);
                            if (!commentId.startsWith('TEST_ID_')) {
                                await facebook.replyToComment(commentId, page.page_access_token, fallback.auto_reply_text);
                                console.log('✨ [WEBHOOK] Fallback auto-reply successful!');
                            } else {
                                console.log('✨ [WEBHOOK] [TEST-SUCCESS] Diagnostic fallback found!');
                            }
                        } else {
                            console.log(`❌ [WEBHOOK] No match for Page: ${pageId}`);
                        }
                    }
                } catch (err) {
                    console.error('❌ [WEBHOOK] Error:', err.message);
                }
            }
        }
    }
}

// POST /api/webhook - Handle incoming events
router.post('/', async (req, res) => {
    try {
        await processEvents(req.body);
        res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
        console.error('Webhook Error:', err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
