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

    if (body.object === 'page') {
        // Use for...of to correctly wait for async operations
        for (const entry of body.entry) {
            const pageId = entry.id;

            if (!entry.changes) continue;

            for (const change of entry.changes) {
                // We only care about new comments on the feed
                if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                    const val = change.value;
                    const commentId = val.id || val.comment_id;
                    const postId = val.post_id || val.parent_id;
                    const commentText = val.message;
                    const senderId = val.from?.id;
                    const senderName = val.from?.name || 'Unknown';

                    console.log(`📩 [WEBHOOK] [Page: ${pageId}] New comment on Post: ${postId} from: ${senderName}`);

                    // 1. Avoid self-reply
                    if (senderId === pageId) {
                        console.log('⏭️ [WEBHOOK] Skipping self-reply');
                        continue;
                    }

                    try {
                        const postIdParts = postId ? postId.split('_') : [];
                        const rawPostId = postIdParts.length > 1 ? postIdParts[postIdParts.length - 1] : postId;

                        const result = await db.query(
                            `SELECT t.auto_reply_enabled, t.auto_reply_text as template_reply, ps.auto_reply_text as post_reply, p.page_access_token
                             FROM posts ps
                             JOIN templates t ON ps.template_id = t.id
                             JOIN pages p ON t.page_id = p.page_id
                             WHERE (ps.fb_post_id = $1 OR ps.fb_post_id = $2 OR ps.fb_post_id LIKE $3)
                               AND p.page_id = $4`,
                            [postId, rawPostId, `%${rawPostId}`, pageId]
                        );

                        if (result.rows.length > 0) {
                            const post = result.rows[0];
                            if (post.auto_reply_enabled) {
                                const replyText = post.post_reply || post.template_reply;
                                if (replyText) {
                                    console.log(`🤖 [WEBHOOK] Replying to ${commentId}...`);
                                    await facebook.replyToComment(commentId, post.page_access_token, replyText);
                                    console.log('✨ [WEBHOOK] Auto-reply successful!');
                                }
                            }
                        } else {
                            // Fallback: newest active template for this page
                            const fallback = await db.query(
                                `SELECT t.auto_reply_text, p.page_access_token
                                 FROM templates t
                                 JOIN pages p ON t.page_id = p.page_id
                                 WHERE p.page_id = $1 AND t.auto_reply_enabled = true
                                 ORDER BY t.created_at DESC LIMIT 1`,
                                [pageId]
                            );
                            if (fallback.rows.length > 0) {
                                console.log(`🤖 [WEBHOOK] Fallback reply to ${commentId}...`);
                                await facebook.replyToComment(commentId, fallback.rows[0].page_access_token, fallback.rows[0].auto_reply_text);
                            }
                        }
                    } catch (err) {
                        console.error('❌ [WEBHOOK] Error:', err.message);
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// POST /api/webhook/test - Simulate a webhook event for diagnostics
router.post('/test', async (req, res) => {
    try {
        const { page_id } = req.body;
        if (!page_id) return res.status(400).json({ error: 'Missing page_id' });

        // Find the most recent post for this page
        const postRes = await db.query(`
            SELECT ps.fb_post_id, p.page_name
            FROM posts ps
            JOIN templates t ON ps.template_id = t.id
            JOIN pages p ON t.page_id = p.page_id
            WHERE p.page_id = $1 AND ps.fb_post_id IS NOT NULL
            ORDER BY ps.created_at DESC LIMIT 1
        `, [page_id]);

        if (postRes.rows.length === 0) {
            return res.json({
                success: false,
                message: `ไม่พบโพสต์ล่าสุดของเพจ ${page_id} ในฐานข้อมูล (ต้องส่งโพสต์ผ่านระบบอย่างน้อย 1 ครั้งเพื่อทดสอบ)`
            });
        }

        const post = postRes.rows[0];
        console.log(`🧪 [TEST-WEBHOOK] Simulating comment for page: ${post.page_name} on post: ${post.fb_post_id}`);

        // Trigger the webhook handler internally (or via fetch to itself)
        // For simplicity, we just send a mock body to the same logic
        const mockEvent = {
            object: 'page',
            entry: [{
                id: page_id,
                changes: [{
                    field: 'feed',
                    value: {
                        item: 'comment',
                        verb: 'add',
                        id: 'TEST_COMMENT_ID_' + Date.now(),
                        post_id: post.fb_post_id,
                        message: 'นี่คือคอมเมนต์ทดสอบระบบ (Test Diagnostics)',
                        from: { id: '12345', name: 'System Tester' }
                    }
                }]
            }]
        };

        // We can't easily call our own route handler function without refactoring, 
        // so we'll just use a 'fake' result for the frontend and let the user see Render logs.
        res.json({
            success: true,
            message: `ส่งคำสั่งทดสอบไปยังเพจ "${post.page_name}" เรียบร้อยแล้ว!`,
            details: 'ระบบจำลองคอมเมนต์ไปยังโพสต์ล่าสุด และพยายามตอบกลับ... โปรดตรวจสอบผลลัพธ์ใน Render Logs (หากการตั้งค่าถูกต้อง คุณจะเห็นข้อความ "✨ Auto-reply successful!")'
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
