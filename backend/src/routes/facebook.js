const express = require('express');
const db = require('../db');
const facebook = require('../services/facebook');
const router = express.Router();

// GET /api/facebook/auth-url - Generate Facebook OAuth URL
router.get('/auth-url', (req, res) => {
    const redirectUri = `${process.env.FRONTEND_URL}/facebook/callback`;
    const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,pages_manage_engagement';
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    res.json({ url });
});

// GET /api/facebook/callback - Handle OAuth callback
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ error: 'Missing authorization code' });

        const redirectUri = `${process.env.FRONTEND_URL}/facebook/callback`;
        const accessToken = await facebook.exchangeCodeForToken(code, redirectUri);
        const pages = await facebook.getPageAccounts(accessToken);

        if (pages.length === 0) {
            return res.status(400).json({ error: 'ไม่พบเพจที่สามารถเชื่อมต่อได้' });
        }

        // Save all pages to database
        const savedPages = [];
        for (const page of pages) {
            const pictureUrl = page.picture?.data?.url || null;
            await db.query(
                `INSERT INTO pages (page_id, page_name, page_access_token, page_picture)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (page_id) DO UPDATE SET
                    page_name = EXCLUDED.page_name,
                    page_access_token = EXCLUDED.page_access_token,
                    page_picture = EXCLUDED.page_picture,
                    updated_at = NOW()`,
                [page.id, page.name, page.access_token, pictureUrl]
            );
            // Automatically subscribe this page to the webhook
            try {
                await facebook.subscribePageToWebhook(page.id, page.access_token);
                console.log(`✅ Subscribed page ${page.name} to webhook`);
            } catch (subErr) {
                console.warn(`⚠️ Could not subscribe page ${page.name} to webhook:`, subErr.message);
            }
            savedPages.push({ page_id: page.id, page_name: page.name, page_picture: pictureUrl });
        }

        res.json({ success: true, pages: savedPages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/facebook/manual-connect - Manual connection with Page ID + Token
router.post('/manual-connect', async (req, res) => {
    try {
        const { pageId, pageAccessToken } = req.body;
        if (!pageId || !pageAccessToken) {
            return res.status(400).json({ error: 'Page ID และ Access Token จำเป็น' });
        }

        // Validate the token
        const pageInfo = await facebook.validatePageToken(pageAccessToken);

        const pictureUrl = pageInfo.picture?.data?.url || null;
        await db.query(
            `INSERT INTO pages (page_id, page_name, page_access_token, page_picture)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (page_id) DO UPDATE SET
                page_name = EXCLUDED.page_name,
                page_access_token = EXCLUDED.page_access_token,
                page_picture = EXCLUDED.page_picture,
                updated_at = NOW()`,
            [pageInfo.id || pageId, pageInfo.name || 'Facebook Page', pageAccessToken, pictureUrl]
        );

        res.json({
            success: true,
            page: { page_id: pageInfo.id || pageId, page_name: pageInfo.name }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/facebook/sync-webhooks - Force subscribe all connected pages to the webhook
router.get('/sync-webhooks', async (req, res) => {
    try {
        const result = await db.query('SELECT page_id, page_name, page_access_token FROM pages');
        const summary = [];

        for (const page of result.rows) {
            try {
                await facebook.subscribePageToWebhook(page.page_id, page.page_access_token);
                summary.push({ page: page.page_name, status: '✅ Subscribed' });
            } catch (err) {
                summary.push({ page: page.page_name, status: `❌ Failed: ${err.message}` });
            }
        }

        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
