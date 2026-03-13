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

module.exports = router;
