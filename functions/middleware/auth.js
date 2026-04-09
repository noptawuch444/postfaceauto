const jwt = require('jsonwebtoken');
const functions = require('firebase-functions');

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });

    try {
        // In Firebase Functions, configuration is retrieved via functions.config()
        // Or via process.env if using Gen 2 / dotenv
        const jwtSecret = process.env.JWT_SECRET || functions.config().app?.jwt_secret || 'autopost-secret-key-change-in-production';
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'เฉพาะแอดมินเท่านั้น' });
    }
    next();
}

module.exports = { authMiddleware, adminOnly };
