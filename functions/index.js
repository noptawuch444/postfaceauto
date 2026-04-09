const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const pagesRoutes = require('./routes/pages');
const templateRoutes = require('./routes/templates');
const publicRoutes = require('./routes/public');
const webhookRoutes = require('./routes/webhook');
const { processScheduledPosts } = require('./services/scheduler');

// Map Routes
app.use('/auth', authRoutes);
app.use('/pages', pagesRoutes);
app.use('/templates', templateRoutes);
app.use('/public', publicRoutes);
app.use('/webhook', webhookRoutes);

// Export Express app as a single Cloud Function
exports.api = functions.https.onRequest(app);

// Export Scheduled Function
exports.scheduledPostTask = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    await processScheduledPosts();
    return null;
});
