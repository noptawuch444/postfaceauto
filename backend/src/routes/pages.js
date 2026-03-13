const express = require('express');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/pages - List all connected pages (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, page_id, page_name, page_picture, created_at, updated_at FROM pages ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/pages/:id - Remove a page
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM pages WHERE id = $1', [req.params.id]);
        res.json({ message: 'ลบเพจสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
