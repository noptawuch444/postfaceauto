const express = require('express');
const dbHelper = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/pages - List all connected pages (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const pages = await dbHelper.query(dbHelper.collections.PAGES);
        // Sort by created_at DESC locally for now if not indexed yet
        const sortedPages = pages.sort((a, b) => {
            const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
            const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
            return dateB - dateA;
        });

        res.json(sortedPages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/pages/:id - Remove a page
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await dbHelper.delete(dbHelper.collections.PAGES, req.params.id);
        res.json({ message: 'ลบเพจสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
