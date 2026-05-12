const express = require('express');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/pages - List pages (Admin sees all, Users see their own)
router.get('/', authMiddleware, async (req, res) => {
    try {
        let query;
        let params = [];

        if (req.user.role === 'admin') {
            query = `
                SELECT p.*, u.email as owner_email 
                FROM pages p 
                LEFT JOIN users u ON p.user_id = u.id 
                ORDER BY p.created_at DESC
            `;
        } else {
            query = `
                SELECT id, page_id, page_name, page_picture, created_at, updated_at 
                FROM pages 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            `;
            params = [req.user.id];
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/pages/:id - Remove a page
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const pageId = req.params.id;
        
        // If not admin, verify ownership
        if (req.user.role !== 'admin') {
            const check = await db.query('SELECT id FROM pages WHERE id = $1 AND user_id = $2', [pageId, req.user.id]);
            if (check.rows.length === 0) return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบเพจนี้' });
        }

        await db.query('DELETE FROM pages WHERE id = $1', [pageId]);
        res.json({ message: 'ลบเพจสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
