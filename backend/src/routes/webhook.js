const express = require('express');
const db = require('../db');
const facebook = require('../services/facebook');
const router = express.Router();

// Ensure webhook_logs table exists (auto-create on startup)
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS webhook_logs (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50),
                msg TEXT,
                data JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ webhook_logs table ready');
    } catch (e) {
        console.error('⚠️ Could not create webhook_logs table:', e.message);
    }
})();

// Persistent log function - stores in DB
async function addLog(type, msg, data = null) {
    console.log(`[${type}] ${msg}`, data ? JSON.stringify(data).substring(0, 200) : '');
    try {
        await db.query(
            'INSERT INTO webhook_logs (type, msg, data) VALUES ($1, $2, $3)',
            [type, msg, data ? JSON.stringify(data) : null]
        );
    } catch (e) {
        console.error('Log DB error:', e.message);
    }
}

// GET /api/webhook/logs - View recent webhook events (persistent from DB)
router.get('/logs', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 50');
        res.json({ total: result.rows.length, logs: result.rows });
    } catch (e) {
        res.json({ total: 0, logs: [], error: e.message });
    }
});

// GET /api/webhook/poller-status - Debug: Show what the poller sees
router.get('/poller-status', async (req, res) => {
    try {
        const templates = await db.query(`
            SELECT t.id, t.template_name, t.auto_reply_enabled, t.auto_reply_text, p.page_id, p.page_name
            FROM templates t
            JOIN pages p ON t.page_id = p.page_id
            WHERE t.auto_reply_enabled = true
        `);
        const posts = await db.query(`
            SELECT ps.id, ps.fb_post_id, LEFT(ps.message, 50) as content, p.page_name, p.page_id
            FROM posts ps
            JOIN templates t ON ps.template_id = t.id
            JOIN pages p ON t.page_id = p.page_id
            WHERE ps.fb_post_id IS NOT NULL
            ORDER BY ps.created_at DESC LIMIT 10
        `);
        const allTemplates = await db.query('SELECT id, template_name, auto_reply_enabled, auto_reply_text FROM templates');
        const allPages = await db.query('SELECT id, page_id, page_name FROM pages');
        let repliedCount = 0;
        try { repliedCount = (await db.query('SELECT COUNT(*) as cnt FROM replied_comments')).rows[0].cnt; } catch (e) { }
        res.json({
            auto_reply_templates: templates.rows,
            all_templates: allTemplates.rows,
            all_pages: allPages.rows,
            recent_posts: posts.rows,
            replied_count: repliedCount
        });
    } catch (e) {
        res.json({ error: e.message, stack: e.stack?.substring(0, 200) });
    }
});

// GET /api/webhook/inspect-schema - Debug: Show actual column types
router.get('/inspect-schema', async (req, res) => {
    try {
        const tables = ['templates', 'pages', 'posts', 'replied_comments'];
        const results = {};
        for (const table of tables) {
            const res = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            results[table] = res.rows;
        }
        res.json(results);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// GET /api/webhook/poll-now - Force a poll check immediately
router.get('/poll-now', async (req, res) => {
    try {
        const { pollAllPages } = require('../services/commentPoller');
        await pollAllPages();
        res.json({ success: true, message: 'Poll cycle triggered. Check /api/webhook/logs for results.' });
    } catch (e) {
        res.json({ error: e.message });
    }
});

// CATCH-ALL: Log EVERY request to /api/webhook (any method)
router.use('/', (req, res, next) => {
    addLog('ANY_REQUEST', `${req.method} /api/webhook${req.url}`, {
        method: req.method,
        url: req.url,
        origin: req.headers.origin || 'none',
        userAgent: (req.headers['user-agent'] || '').substring(0, 100),
        contentType: req.headers['content-type'] || 'none',
        bodyPresent: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body).join(',') : 'none'
    });
    next();
});

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
    if (body.object !== 'page') {
        addLog('SKIP', 'Not a page event', { object: body.object });
        return;
    }

    for (const entry of body.entry) {
        const pageId = entry.id;
        if (!entry.changes) {
            addLog('SKIP', 'No changes in entry', { pageId });
            continue;
        }

        for (const change of entry.changes) {
            addLog('EVENT', `Field: ${change.field}, item: ${change.value?.item}, verb: ${change.value?.verb}`, { pageId });

            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                const val = change.value;
                const commentId = val.id || val.comment_id;
                const postId = val.post_id || val.parent_id;
                const commentText = val.message || '';
                const senderId = val.from?.id;
                const senderName = val.from?.name || 'Unknown';

                addLog('COMMENT', `New comment on Post: ${postId} from: ${senderName} (${senderId})`, { commentId, commentText });

                if (senderId === pageId) {
                    addLog('SKIP', 'Self-reply detected', { senderId, pageId });
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
    // BULLETPROOF: Log raw request info FIRST, before any processing
    addLog('RAW_POST', `Body type: ${typeof req.body}, keys: ${req.body ? Object.keys(req.body).join(',') : 'NONE'}`,
        { rawBody: JSON.stringify(req.body || {}).substring(0, 500) });

    try {
        addLog('INCOMING', 'Processing webhook', { object: req.body?.object, entries: req.body?.entry?.length || 0 });
        await processEvents(req.body);
        res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
        addLog('ERROR', 'Webhook processing error', { error: err.message });
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
