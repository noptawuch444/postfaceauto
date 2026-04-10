require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const compression = require('compression');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(compression());

// ⚡ CRITICAL: Webhook route MUST be BEFORE cors() middleware!
// Facebook sends server-to-server POST requests that get blocked by restrictive CORS.
app.use('/api/webhook', express.json(), require('./routes/webhook'));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/facebook', require('./routes/facebook'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/public', require('./routes/public'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Start scheduler & Run Migration
const { runMigrations } = require('./migration');
const { startScheduler } = require('./services/scheduler');
const axios = require('axios');

const startKeepAlive = () => {
    const interval = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
        try {
            // Self-ping to keep Render instance active
            const url = `http://localhost:${PORT}/api/health`;
            await axios.get(url);
            console.log(`⏰ [KEEP-ALIVE] Heartbeat sent to ${url}`);
        } catch (err) {
            console.error('❌ [KEEP-ALIVE] Heartbeat failed:', err.message);
        }
    }, interval);
};

app.listen(PORT, async () => {
    console.log(`\n🚀 AutoPost Backend running on http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);

    // Auto-migrate database on start
    await runMigrations();

    startScheduler();
    startKeepAlive();
});
