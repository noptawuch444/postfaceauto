require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
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
app.use('/api/webhook', require('./routes/webhook'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Start scheduler & Run Migration
const { runMigrations } = require('./migration');
const { startScheduler } = require('./services/scheduler');

app.listen(PORT, async () => {
    console.log(`\n🚀 AutoPost Backend running on http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);

    // Auto-migrate database on start
    await runMigrations();

    startScheduler();
});
