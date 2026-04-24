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

                    // NEW: Check if photos were pre-uploaded to Facebook (fb_photo_ids column)
                    if (post.fb_photo_ids) {
                        const photoIds = JSON.parse(post.fb_photo_ids);
                        console.log(`📸 [SCHEDULER] Post ${post.id}: Using ${photoIds.length} pre-uploaded photo(s)`);
                        fbResult = await facebook.postMultiPhotoFeed(post.page_id, post.page_access_token, post.message || '', photoIds);
                    }
                    // FALLBACK: Old posts that only have image URLs (before fb_photo_ids was added)
                    else if (post.image_url) {
                        let urls = [];
                        if (post.image_url.startsWith('[')) {
                            try { urls = JSON.parse(post.image_url); } catch (e) { urls = [post.image_url]; }
                        } else {
                            urls = [post.image_url];
                        }

                        if (Array.isArray(urls) && urls.length > 1) {
                            const photoIds = [];
                            for (const url of urls) {
                                const id = await facebook.uploadPhotoToPageByUrl(post.page_id, post.page_access_token, url);
                                photoIds.push(id);
                            }
                            fbResult = await facebook.postMultiPhotoFeed(post.page_id, post.page_access_token, post.message || '', photoIds);
                        } else {
                            const url = Array.isArray(urls) ? urls[0] : post.image_url;
                            fbResult = await facebook.postPhotoToPageByUrl(post.page_id, post.page_access_token, post.message || '', url);
                        }
                    }
                    // Text only
                    else {
                        fbResult = await facebook.postToPage(
                            post.page_id,
                            post.page_access_token,
                            post.message
                        );
                    }

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
