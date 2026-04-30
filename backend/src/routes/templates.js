const express = require('express');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/templates - List all templates
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, p.page_name
            FROM templates t
            JOIN pages p ON t.page_id = p.page_id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/templates - Create template
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { page_id, template_name, password, expire_date, slug } = req.body;
        if (!page_id || !template_name || !password || !expire_date || !slug) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
        }

        // Check page exists
        const pageCheck = await db.query('SELECT page_id FROM pages WHERE page_id = $1', [page_id]);
        if (pageCheck.rows.length === 0) {
            return res.status(400).json({ error: 'ไม่พบเพจนี้ในระบบ' });
        }

        // Check slug uniqueness
        const slugCheck = await db.query('SELECT id FROM templates WHERE slug = $1', [slug]);
        if (slugCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Slug นี้ถูกใช้แล้ว กรุณาเปลี่ยน' });
        }

        const result = await db.query(
            `INSERT INTO templates (page_id, template_name, password, expire_date, slug, auto_reply_enabled, auto_reply_text, share_to_group_enabled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [page_id, template_name, password, expire_date, slug, req.body.auto_reply_enabled || false, req.body.auto_reply_text || '', req.body.share_to_group_enabled || false]
        );

        res.json({ message: 'สร้างเทมเพลตสำเร็จ!', template: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/templates/:id - Update template
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { template_name, password, expire_date, slug, auto_reply_enabled, auto_reply_text, share_to_group_enabled } = req.body;
        const result = await db.query(
            `UPDATE templates SET template_name = COALESCE($1, template_name),
             password = COALESCE($2, password),
             expire_date = COALESCE($3, expire_date),
             slug = COALESCE($4, slug),
             auto_reply_enabled = COALESCE($5, auto_reply_enabled),
             auto_reply_text = COALESCE($6, auto_reply_text),
             share_to_group_enabled = COALESCE($7, share_to_group_enabled)
             WHERE id = $8 RETURNING *`,
            [template_name, password, expire_date, slug, auto_reply_enabled, auto_reply_text, share_to_group_enabled, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบเทมเพลต' });
        res.json({ message: 'อัปเดตสำเร็จ', template: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
        res.json({ message: 'ลบเทมเพลตสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
