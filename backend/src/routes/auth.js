const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

        // Check if user exists
        const check = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });

        const hash = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, hash, 'user']
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/auth/setup-admin (Temporary setup route)
router.get('/setup-admin', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('admin123', 10);

        // Ensure the tables exist first
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schema);

        // Force UPSERT the admin user with the CORRECT dynamically generated hash
        await db.query(`
            INSERT INTO users (email, password, role) 
            VALUES ('admin@autopost.com', $1, 'admin')
            ON CONFLICT (email) DO UPDATE SET password = $1;
        `, [hash]);

        // MIGRATION: Ensure page_picture exists on the live database
        await db.query(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS page_picture TEXT;`);

        // MIGRATION: Ensure auto-reply columns exist on the live database
        await db.query(`ALTER TABLE templates ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT FALSE;`);
        await db.query(`ALTER TABLE templates ADD COLUMN IF NOT EXISTS auto_reply_text TEXT;`);

        // MIGRATION: Ensure settings table and blacklist security exists
        await db.query(`CREATE TABLE IF NOT EXISTS settings (key VARCHAR(255) PRIMARY KEY, value TEXT);`);
        await db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS auto_reply_text TEXT;`);

        // MIGRATION: fb_photo_ids for persistent image storage via Facebook
        await db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS fb_photo_ids TEXT;`);

        res.send('<h1>✅ Admin account ready & Database migrated!</h1><p>You can now log in with <b>admin@autopost.com</b> and <b>admin123</b></p>');
    } catch (error) {
        res.status(500).send(`<h1>❌ Error</h1><p>${error.message}</p>`);
    }
});

module.exports = router;
