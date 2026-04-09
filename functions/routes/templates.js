const express = require('express');
const dbHelper = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/templates - List all templates
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const templates = await dbHelper.query(dbHelper.collections.TEMPLATES);
        const pages = await dbHelper.query(dbHelper.collections.PAGES);

        // Map page_name to templates (Manual Join)
        const enrichedTemplates = templates.map(t => {
            const page = pages.find(p => p.page_id === t.page_id);
            return {
                ...t,
                page_name: page ? page.page_name : 'Unknown Page'
            };
        });

        // Sort by created_at DESC
        enrichedTemplates.sort((a, b) => {
            const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
            const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
            return dateB - dateA;
        });

        res.json(enrichedTemplates);
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
        const pages = await dbHelper.query(dbHelper.collections.PAGES, [['page_id', '==', page_id]]);
        if (pages.length === 0) {
            return res.status(400).json({ error: 'ไม่พบเพจนี้ในระบบ' });
        }

        // Check slug uniqueness
        const slugCheck = await dbHelper.query(dbHelper.collections.TEMPLATES, [['slug', '==', slug]]);
        if (slugCheck.length > 0) {
            return res.status(400).json({ error: 'Slug นี้ถูกใช้แล้ว กรุณาเปลี่ยน' });
        }

        const templateData = {
            page_id,
            template_name,
            password,
            expire_date,
            slug,
            auto_reply_enabled: req.body.auto_reply_enabled || false,
            auto_reply_text: req.body.auto_reply_text || ''
        };

        const id = await dbHelper.add(dbHelper.collections.TEMPLATES, templateData);
        res.json({ message: 'สร้างเทมเพลตสำเร็จ!', template: { id, ...templateData } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/templates/:id - Update template
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { template_name, password, expire_date, slug, auto_reply_enabled, auto_reply_text } = req.body;

        // Firestore update only changes provided fields
        const updateData = {};
        if (template_name !== undefined) updateData.template_name = template_name;
        if (password !== undefined) updateData.password = password;
        if (expire_date !== undefined) updateData.expire_date = expire_date;
        if (slug !== undefined) updateData.slug = slug;
        if (auto_reply_enabled !== undefined) updateData.auto_reply_enabled = auto_reply_enabled;
        if (auto_reply_text !== undefined) updateData.auto_reply_text = auto_reply_text;

        await dbHelper.update(dbHelper.collections.TEMPLATES, req.params.id, updateData);

        const updatedTemplate = await dbHelper.get(dbHelper.collections.TEMPLATES, req.params.id);
        res.json({ message: 'อัปเดตสำเร็จ', template: updatedTemplate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await dbHelper.delete(dbHelper.collections.TEMPLATES, req.params.id);
        res.json({ message: 'ลบเทมเพลตสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
