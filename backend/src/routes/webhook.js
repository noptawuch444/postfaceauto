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
            return res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook Verification Failed (Token Mismatch)');
            return res.sendStatus(403);
        }
    }
    // Always respond — prevents timeout on missing params
    res.status(200).send('Webhook endpoint is active.');
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
                const commentText = val.message || '';
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
                        console.log(`🔍 [WEBHOOK] Match found for Post: ${post.fb_post_id} (Enabled: ${post.auto_reply_enabled})`);
                        if (post.auto_reply_enabled) {
                            const replyText = post.post_reply || post.template_reply;
                            if (replyText) {
                                console.log(`🤖 [WEBHOOK] Attempting reply to ${commentId}...`);
                                if (!commentId.startsWith('TEST_ID_')) {
                                    try {
                                        const fbRes = await facebook.replyToComment(commentId, post.page_access_token, replyText);
                                        console.log('✅ [WEBHOOK] Auto-reply SUCCESS! FB_ID:', fbRes.id);
                                    } catch (fbErr) {
                                        console.error('❌ [WEBHOOK] Auto-reply FAILED at Facebook API:', fbErr.message);
                                        // Specific log for common permission errors
                                        if (fbErr.message.includes('permission') || fbErr.message.includes('manage_engagement')) {
                                            console.error('💡 [HINT] This likely means the page_access_token lacks pages_manage_engagement scope.');
                                        }
                                    }
                                } else {
                                    console.log('✨ [WEBHOOK] [TEST-SUCCESS] Diagnostic match found! (Skip actual FB call for mock ID)');
                                }
                            } else {
                                console.log('⏭️ [WEBHOOK] Skipping: Reply text is empty');
                            }
                        } else {
                            console.log('⏭️ [WEBHOOK] Skipping: Auto-reply DISBLED for this template/post');
                        }
                    } else {
                        console.log(`🔍 [WEBHOOK] No exact post match for ${postId}, checking fallback...`);
                        const fallback = await db.query(
                            `SELECT t.auto_reply_text, p.page_access_token
                             FROM templates t
                             JOIN pages p ON t.page_id = p.page_id
                             WHERE p.page_id = $1 AND t.auto_reply_enabled = true
                             ORDER BY t.created_at DESC LIMIT 1`,
                            [pageId]
                        );
                        if (fallback.rows.length > 0) {
                            console.log(`🤖 [WEBHOOK] Fallback reply to ${commentId} using latest template...`);
                            if (!commentId.startsWith('TEST_ID_')) {
                                try {
                                    const fbRes = await facebook.replyToComment(commentId, fallback.rows[0].page_access_token, fallback.rows[0].auto_reply_text);
                                    console.log('✅ [WEBHOOK] Fallback Auto-reply SUCCESS! FB_ID:', fbRes.id);
                                } catch (fbErr) {
                                    console.error('❌ [WEBHOOK] Fallback Auto-reply FAILED at Facebook API:', fbErr.message);
                                }
                            } else {
                                console.log('✨ [WEBHOOK] [TEST-SUCCESS] Diagnostic fallback found!');
                            }
                        } else {
                            console.log(`❌ [WEBHOOK] No match or fallback enabled for Page: ${pageId}`);
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

// POST /api/webhook/test - Simulate a webhook event for diagnostics
router.post('/test', async (req, res) => {
    try {
        const { page_id } = req.body;
        if (!page_id) return res.status(400).json({ error: 'Missing page_id' });

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
                message: `ไม่พบโพสต์ล่าสุด... (ต้องส่งโพสต์ผ่านระบบอย่างน้อย 1 ครั้งเพื่อทดสอบ)`
            });
        }

        const post = postRes.rows[0];
        console.log(`🧪 [TEST-RUN] Diagnostic for Page: ${post.page_name} on post: ${post.fb_post_id}`);

        const mockEvent = {
            object: 'page',
            entry: [{
                id: page_id,
                changes: [{
                    field: 'feed',
                    value: {
                        item: 'comment',
                        verb: 'add',
                        id: 'TEST_ID_' + Date.now(),
                        post_id: post.fb_post_id,
                        message: 'Diagnostic test comment',
                        from: { id: '12345', name: 'System Tester' }
                    }
                }]
            }]
        };

        // Call the real logic
        await processEvents(mockEvent);

        res.json({
            success: true,
            message: `ส่งคำสั่งทดสอบไปยังเพจ "${post.page_name}" เรียบร้อยแล้ว!`,
            details: 'ผลลัพธ์ปรากฏใน Logs แล้วครับ ลองรีเฟรชหน้า Render Console ดูข้อความ [WEBHOOK] ล่าสุดได้เลย!'
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
