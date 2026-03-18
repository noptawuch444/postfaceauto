const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const facebook = require('../services/facebook');
const router = express.Router();

// Multer for public post image/video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const fileFilter = (req, file, cb) => {
    const allowed = /^(image|video)\//;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพและวิดีโอ (.jpg, .png, .mp4) เท่านั้น'), false);
    }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB for videos

// GET /api/public/:slug/info - Get basic info about a template (public)
router.get('/:slug/info', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.template_name, t.page_id, t.auto_reply_enabled, pg.page_name, pg.page_picture 
             FROM templates t
             JOIN pages pg ON t.page_id = pg.page_id
             WHERE t.slug = $1`,
            [req.params.slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบลิงก์นี้ในระบบ' });
        }

        res.json({
            template_name: result.rows[0].template_name,
            page_name: result.rows[0].page_name,
            page_id: result.rows[0].page_id,
            page_picture: result.rows[0].page_picture,
            auto_reply_enabled: result.rows[0].auto_reply_enabled
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/public/:slug/verify - Verify password for a template
router.post('/:slug/verify', async (req, res) => {
    try {
        const { password } = req.body;
        const result = await db.query(
            `SELECT t.id, t.template_name, t.password, t.expire_date, t.slug, t.page_id, t.auto_reply_enabled, pg.page_name, pg.page_picture 
             FROM templates t
             JOIN pages pg ON t.page_id = pg.page_id
             WHERE t.slug = $1`,
            [req.params.slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบลิงก์นี้ในระบบ' });
        }

        const template = result.rows[0];

        // Check expiry
        if (new Date(template.expire_date) < new Date()) {
            return res.status(403).json({ error: 'ลิงก์นี้หมดอายุแล้ว' });
        }

        // Check password
        if (template.password !== password) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        res.json({
            success: true,
            template: {
                id: template.id,
                template_name: template.template_name,
                page_name: template.page_name,
                page_id: template.page_id,
                slug: template.slug,
                expire_date: template.expire_date,
                page_picture: template.page_picture,
                auto_reply_enabled: template.auto_reply_enabled
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/public/:slug/post - Create a post via public link
router.post('/:slug/post', upload.array('images', 80), async (req, res) => {
    try {
        const { password, message, schedule_time, post_now, auto_reply_text } = req.body;

        // Lookup template
        const tResult = await db.query(
            `SELECT t.id, t.password, t.expire_date, t.page_id, pg.page_access_token
             FROM templates t
             JOIN pages pg ON t.page_id = pg.page_id
             WHERE t.slug = $1`,
            [req.params.slug]
        );

        if (tResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบเทมเพลตนี้' });
        }

        const template = tResult.rows[0];

        // Security checks
        if (template.password !== password) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }
        if (new Date(template.expire_date) < new Date()) {
            return res.status(403).json({ error: 'ลิงก์นี้หมดอายุแล้ว' });
        }

        // Blacklist Check
        const settingsRes = await db.query("SELECT value FROM settings WHERE key = 'blacklist'");
        if (settingsRes.rows.length > 0) {
            const blacklist = settingsRes.rows[0].value.split(',').map(k => k.trim()).filter(k => k);
            const lowerMessage = (message || '').toLowerCase();
            const hitWord = blacklist.find(word => lowerMessage.includes(word.toLowerCase()));
            if (hitWord) {
                return res.status(400).json({ error: `ไม่สามารถโพสต์ได้ เนื่องจากข้อความมีคำที่ไม่อนุญาต: "${hitWord}"` });
            }
        }

        // Build image URLs if uploaded
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
        }
        // Store as JSON string or comma-separated. JSON is better for flexibility.
        const imageUrlData = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;

        // Post immediately
        if (post_now === 'true' || post_now === true) {
            try {
                let fbResult;

                if (req.files && req.files.length > 1) {
                    // Multi-photo post
                    const photoIds = [];
                    for (const file of req.files) {
                        const id = await facebook.uploadPhotoToPage(template.page_id, template.page_access_token, file.path);
                        photoIds.push(id);
                    }
                    fbResult = await facebook.postMultiPhotoFeed(template.page_id, template.page_access_token, message || '', photoIds);
                } else if (req.files && req.files.length === 1) {
                    // Single photo post
                    fbResult = await facebook.postPhotoToPage(template.page_id, template.page_access_token, message || '', req.files[0].path);
                } else {
                    // Text only post
                    fbResult = await facebook.postToPage(template.page_id, template.page_access_token, message);
                }

                // Save to DB as success
                await db.query(
                    `INSERT INTO posts (template_id, message, image_url, status, fb_post_id, auto_reply_text)
                     VALUES ($1, $2, $3, 'success', $4, $5)`,
                    [template.id, message, imageUrlData, fbResult.id || fbResult.post_id, auto_reply_text || null]
                );

                return res.json({ success: true, message: 'โพสต์สำเร็จ! 🎉', fb_post_id: fbResult.id || fbResult.post_id });
            } catch (fbErr) {
                console.error('FB API Error:', fbErr);
                await db.query(
                    `INSERT INTO posts (template_id, message, image_url, status, error_message)
                     VALUES ($1, $2, $3, 'failed', $4)`,
                    [template.id, message, imageUrlData, fbErr.message]
                );
                return res.status(500).json({ error: `โพสต์ไม่สำเร็จ: ${fbErr.message}` });
            }
        }

        // Schedule post
        if (!schedule_time) {
            return res.status(400).json({ error: 'กรุณาตั้งเวลาโพสต์หรือเลือกโพสต์ทันที' });
        }

        await db.query(
            `INSERT INTO posts (template_id, message, image_url, schedule_time, status, auto_reply_text)
             VALUES ($1, $2, $3, $4, 'pending', $5)`,
            [template.id, message, imageUrlData, schedule_time, auto_reply_text || null]
        );

        res.json({ success: true, message: 'ตั้งเวลาโพสต์เรียบร้อย! ⏰' });
    } catch (error) {
        console.error('Public Post Route Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
    }
});

// GET /api/public/:slug/history - Get post history for a template
router.post('/:slug/history', async (req, res) => {
    try {
        const { password } = req.body;

        // Lookup template
        const tResult = await db.query(
            'SELECT id, password FROM templates WHERE slug = $1',
            [req.params.slug]
        );

        if (tResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบเทมเพลตนี้' });
        const template = tResult.rows[0];

        // Check password
        if (template.password !== password) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        const hResult = await db.query(
            `SELECT id, message, image_url, schedule_time, status, created_at, fb_post_id
             FROM posts
             WHERE template_id = $1
             ORDER BY created_at DESC LIMIT 50`,
            [template.id]
        );

        res.json(hResult.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/public/debug-users
router.get('/debug-users', async (req, res) => {
    try {
        const result = await db.query('SELECT email, role FROM users');
        res.json({ users: result.rows });
    } catch (e) {
        res.json({ error: e.message });
    }
});

// POST /api/public/:slug/history/delete - Delete a pending post via public link
router.post('/:slug/history/delete', async (req, res) => {
    try {
        const { password, postId } = req.body;
        console.log(`🗑️ [DELETE] Request for Post: ${postId} (Template Slug: ${req.params.slug})`);

        // Lookup template
        const tResult = await db.query(
            'SELECT id, password FROM templates WHERE slug = $1',
            [req.params.slug]
        );

        if (tResult.rows.length === 0) {
            console.log('❌ [DELETE] Template not found');
            return res.status(404).json({ error: 'ไม่พบเทมเพลตนี้' });
        }
        const template = tResult.rows[0];

        // Check password
        if (template.password !== password) {
            console.log('❌ [DELETE] Invalid password');
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // Delete only if status is 'pending' and belongs to this template
        const dResult = await db.query(
            "DELETE FROM posts WHERE id = $1 AND template_id = $2 AND status = 'pending' RETURNING id",
            [postId, template.id]
        );

        if (dResult.rows.length === 0) {
            console.log(`❌ [DELETE] Post ${postId} not deleted (Not pending or wrong template)`);
            return res.status(400).json({ error: 'ไม่สามารถลบรายการนี้ได้ (อาจถูกส่งไปแล้ว หรือไม่พบข้อมูล)' });
        }

        console.log(`✅ [DELETE] Post ${postId} successfully deleted`);

        res.json({ success: true, message: 'ลบรายการเรียบร้อยแล้ว' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
