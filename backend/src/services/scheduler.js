const cron = require('node-cron');
const db = require('../db');
const facebook = require('./facebook');

function startScheduler() {
    console.log('⏰ Scheduler started - checking every 1 minute');

    cron.schedule('* * * * *', async () => {
        try {
            // Find pending posts whose schedule_time has passed
            const result = await db.query(`
                SELECT p.*, t.page_id, pg.page_access_token
                FROM posts p
                JOIN templates t ON p.template_id = t.id
                JOIN pages pg ON t.page_id = pg.page_id
                WHERE p.status = 'pending' AND t.expire_date > NOW()
                  AND p.schedule_time IS NOT NULL
                  AND p.schedule_time <= NOW()
            `);

            if (result.rows.length === 0) return;

            // Fetch blacklist ONCE for the entire batch
            const settingsRes = await db.query("SELECT value FROM settings WHERE key = 'blacklist'");
            const blacklist = settingsRes.rows.length > 0
                ? settingsRes.rows[0].value.split(',').map(k => k.trim().toLowerCase()).filter(k => k)
                : [];

            for (const post of result.rows) {
                try {
                    // Optimized Blacklist Check
                    if (blacklist.length > 0) {
                        const lowerMessage = (post.message || '').toLowerCase();
                        const hitWord = blacklist.find(word => lowerMessage.includes(word));
                        if (hitWord) {
                            throw new Error(`ข้อความมีคำที่ไม่อนุญาต: "${hitWord}"`);
                        }
                    }

                    let fbResult;

                    // Send to Make.com Webhook if configured, else fallback to hardcoded
                    const webhookUrl = process.env.MAKE_WEBHOOK_URL || 'https://hook.eu1.make.com/4f6zqj1868rfxwm1e3qi3ajvfv22k6ra';
                    const fetch = require('node-fetch');

                    let photoUrls = [];
                    if (post.image_url) {
                        try {
                            photoUrls = post.image_url.startsWith('[') ? JSON.parse(post.image_url) : [post.image_url];
                        } catch (e) {
                            photoUrls = [post.image_url];
                        }
                    }

                    const payload = {
                        message: post.message || '',
                        photo_url_1: photoUrls.length > 0 ? photoUrls[0] : null,
                        photo_urls: photoUrls.length > 0 ? photoUrls : null
                    };

                    const res = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    const text = await res.text();
                    console.log(`✅ [SCHEDULER] Post ${post.id} sent to Make.com Webhook:`, text);
                    fbResult = { id: 'make_' + Date.now() };

                    await db.query(
                        `UPDATE posts SET status = 'success', fb_post_id = $1 WHERE id = $2`,
                        [fbResult.id || fbResult.post_id, post.id]
                    );
                    console.log(`✅ Post ${post.id} published successfully`);
                } catch (err) {
                    await db.query(
                        `UPDATE posts SET status = 'failed', error_message = $1 WHERE id = $2`,
                        [err.message, post.id]
                    );
                    console.error(`❌ Post ${post.id} failed:`, err.message);
                }
            }
        } catch (err) {
            console.error('Scheduler error:', err.message);
        }
    });
}

module.exports = { startScheduler };
