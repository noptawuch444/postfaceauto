const express = require('express');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM settings');
        const settings = {};
        result.rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/settings - Update settings
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'Missing key' });

        await db.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
            [key, value]
        );
        res.json({ success: true, message: `Updated setting: ${key}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---- Facebook Groups Management ----
// Helpers
const GROUPS_KEY = 'facebook_groups';
const loadGroups = async () => {
    const r = await db.query("SELECT value FROM settings WHERE key = $1", [GROUPS_KEY]);
    if (r.rows.length === 0) return [];
    try { return JSON.parse(r.rows[0].value); } catch { return []; }
};
const saveGroups = async (groups) => {
    await db.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [GROUPS_KEY, JSON.stringify(groups)]
    );
};

// GET /api/settings/groups - List all configured groups (admin)
router.get('/groups', authMiddleware, adminOnly, async (req, res) => {
    try {
        res.json(await loadGroups());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/settings/groups/public - Public endpoint (no auth - for share modal)
router.get('/groups/public', async (req, res) => {
    try {
        res.json(await loadGroups());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/settings/groups - Add a group
router.post('/groups', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, url } = req.body;
        if (!name || !url) return res.status(400).json({ error: 'กรุณากรอกชื่อกลุ่มและ URL' });

        // Extract group ID from URL
        const m = url.match(/facebook\.com\/groups\/([^/?#\s]+)/);
        const gid = m ? m[1] : url.trim();

        const groups = await loadGroups();
        // Check duplicate
        if (groups.find(g => g.gid === gid)) {
            return res.status(400).json({ error: 'กลุ่มนี้มีอยู่ในรายการแล้ว' });
        }

        const newGroup = {
            id: Date.now().toString(),
            gid,
            name: name.trim(),
            url: `https://www.facebook.com/groups/${gid}`,
            createdAt: new Date().toISOString()
        };
        groups.push(newGroup);
        await saveGroups(groups);
        res.json({ success: true, group: newGroup });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/settings/groups/:id - Remove a group
router.delete('/groups/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const groups = await loadGroups();
        const updated = groups.filter(g => g.id !== req.params.id);
        await saveGroups(updated);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
