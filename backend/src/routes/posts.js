const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const facebook = require('../services/facebook');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/posts - List all posts (admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, t.template_name, t.page_id, pg.page_name
            FROM posts p
            JOIN templates t ON p.template_id = t.id
            JOIN pages pg ON t.page_id = pg.page_id
            ORDER BY p.created_at DESC
            LIMIT 200
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/posts/:id/post-now - Manually trigger post now (admin)
router.post('/:id/post-now', authMiddleware, adminOnly, async (req, res) => {
    try {
        const postResult = await db.query(`
            SELECT p.*, t.page_id, pg.page_access_token
            FROM posts p
            JOIN templates t ON p.template_id = t.id
            JOIN pages pg ON t.page_id = pg.page_id
            WHERE p.id = $1
        `, [req.params.id]);

        if (postResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบโพสต์' });
        const post = postResult.rows[0];

        let fbResult;
        if (post.image_url) {
            let urls = [];
            try {
                urls = JSON.parse(post.image_url);
            } catch (e) {
                urls = [post.image_url];
            }

            if (Array.isArray(urls) && urls.length > 1) {
                const photoIds = [];
                for (const url of urls) {
                    const filename = url.split('/').pop();
                    const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
                    const id = await facebook.uploadPhotoToPage(post.page_id, post.page_access_token, filePath);
                    photoIds.push(id);
                }
                fbResult = await facebook.postMultiPhotoFeed(post.page_id, post.page_access_token, post.message || '', photoIds);
            } else {
                const url = Array.isArray(urls) ? urls[0] : post.image_url;
                const filename = url.split('/').pop();
                const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
                fbResult = await facebook.postPhotoToPage(post.page_id, post.page_access_token, post.message || '', filePath);
            }
        } else {
            fbResult = await facebook.postToPage(post.page_id, post.page_access_token, post.message);
        }

        await db.query(
            `UPDATE posts SET status = 'success', fb_post_id = $1 WHERE id = $2`,
            [fbResult.id || fbResult.post_id, post.id]
        );

        res.json({ success: true, fb_post_id: fbResult.id || fbResult.post_id });
    } catch (error) {
        await db.query(
            `UPDATE posts SET status = 'failed', error_message = $1 WHERE id = $2`,
            [error.message, req.params.id]
        );
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
        res.json({ message: 'ลบโพสต์สำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
