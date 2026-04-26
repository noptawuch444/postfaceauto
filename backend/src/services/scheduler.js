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

                    // Post directly to Facebook Graph API (no Make.com)
                    let photoUrls = [];
                    let photoIds = [];
                    if (post.image_url) {
                        try {
                            photoUrls = post.image_url.startsWith('[') ? JSON.parse(post.image_url) : [post.image_url];
                        } catch (e) {
                            photoUrls = [post.image_url];
                        }
                    }
                    if (post.fb_photo_ids) {
                        try {
                            photoIds = typeof post.fb_photo_ids === 'string' ? JSON.parse(post.fb_photo_ids) : post.fb_photo_ids;
                        } catch (e) {
                            photoIds = [];
                        }
                    }

                    if (photoIds.length > 1) {
                        // Multi-photo post using pre-uploaded photo IDs
                        fbResult = await facebook.postMultiPhotoFeed(
                            post.page_id, post.page_access_token,
                            post.message || '', photoIds
                        );
                        console.log(`✅ [SCHEDULER] Multi-photo post ${post.id} published:`, fbResult);
                    } else if (photoUrls.length > 0) {
                        // Single photo post using CDN URL
                        fbResult = await facebook.postPhotoToPageByUrl(
                            post.page_id, post.page_access_token,
                            post.message || '', photoUrls[0]
                        );
                        console.log(`✅ [SCHEDULER] Photo post ${post.id} published:`, fbResult);
                    } else {
                        // Text-only post
                        fbResult = await facebook.postToPage(
                            post.page_id, post.page_access_token,
                            post.message || ''
                        );
                        console.log(`✅ [SCHEDULER] Text post ${post.id} published:`, fbResult);
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
