const express = require('express');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [pagesR, templatesR, postsR, recentR] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM pages'),
            db.query('SELECT COUNT(*) as count FROM templates'),
            db.query(`SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'success') as success,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'failed') as failed
                FROM posts`),
            db.query(`SELECT p.*, t.template_name, pg.page_name
                FROM posts p
                JOIN templates t ON p.template_id = t.id
                JOIN pages pg ON t.page_id = pg.page_id
                ORDER BY p.created_at DESC LIMIT 10`),
        ]);

        res.json({
            pages: parseInt(pagesR.rows[0].count),
            templates: parseInt(templatesR.rows[0].count),
            posts: {
                total: parseInt(postsR.rows[0].total),
                success: parseInt(postsR.rows[0].success),
                pending: parseInt(postsR.rows[0].pending),
                failed: parseInt(postsR.rows[0].failed),
            },
            recentPosts: recentR.rows,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
