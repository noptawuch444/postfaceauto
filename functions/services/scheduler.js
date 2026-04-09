const dbHelper = require('../db');
const facebook = require('./facebook');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');

async function processScheduledPosts() {
    console.log('⏰ Running scheduled post task...');
    try {
        const now = new Date();

        // Find pending posts
        const pendingPosts = await dbHelper.query(dbHelper.collections.POSTS, [['status', '==', 'pending']]);

        // Filter those whose schedule_time has passed
        const postsToProcess = pendingPosts.filter(p => {
            const schedTime = new Date(p.schedule_time);
            return schedTime <= now;
        });

        if (postsToProcess.length === 0) return;

        // Fetch blacklist
        const settings = await dbHelper.query(dbHelper.collections.SETTINGS, [['key', '==', 'blacklist']]);
        const blacklist = settings.length > 0
            ? settings[0].value.split(',').map(k => k.trim().toLowerCase()).filter(k => k)
            : [];

        for (const post of postsToProcess) {
            try {
                // Check template expiry
                const templates = await dbHelper.query(dbHelper.collections.TEMPLATES, [['id', '==', post.template_id]]);
                const template = templates[0];
                if (!template || new Date(template.expire_date) < now) {
                    await dbHelper.update(dbHelper.collections.POSTS, post.id, {
                        status: 'failed',
                        error_message: 'Link expired or Template not found'
                    });
                    continue;
                }

                const pages = await dbHelper.query(dbHelper.collections.PAGES, [['page_id', '==', template.page_id]]);
                const page = pages[0];
                if (!page) throw new Error('Connected page not found');

                // Blacklist check
                const lowerMessage = (post.message || '').toLowerCase();
                const hitWord = blacklist.find(word => lowerMessage.includes(word));
                if (hitWord) throw new Error(`ข้อความมีคำที่ไม่อนุญาต: "${hitWord}"`);

                let fbResult;
                const imageUrl = post.image_url;
                const tempFiles = [];

                const downloadToTmp = async (url) => {
                    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${path.basename(url)}`);
                    const response = await axios({ url, responseType: 'stream' });
                    const writer = fs.createWriteStream(tempPath);
                    response.data.pipe(writer);
                    await new Promise((res, rej) => {
                        writer.on('finish', res);
                        writer.on('error', rej);
                    });
                    tempFiles.push(tempPath);
                    return tempPath;
                };

                if (imageUrl) {
                    let urls = [];
                    if (imageUrl.startsWith('[')) {
                        try { urls = JSON.parse(imageUrl); } catch (e) { urls = [imageUrl]; }
                    } else {
                        urls = [imageUrl];
                    }

                    if (Array.isArray(urls) && urls.length > 1) {
                        const photoIds = [];
                        for (const url of urls) {
                            const tmpPath = await downloadToTmp(url);
                            const id = await facebook.uploadPhotoToPage(template.page_id, page.page_access_token, tmpPath);
                            photoIds.push(id);
                        }
                        fbResult = await facebook.postMultiPhotoFeed(template.page_id, page.page_access_token, post.message || '', photoIds);
                    } else {
                        const url = Array.isArray(urls) ? urls[0] : imageUrl;
                        const tmpPath = await downloadToTmp(url);
                        fbResult = await facebook.postPhotoToPage(template.page_id, page.page_access_token, post.message || '', tmpPath);
                    }
                } else {
                    fbResult = await facebook.postToPage(template.page_id, page.page_access_token, post.message);
                }

                // Cleanup
                tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

                await dbHelper.update(dbHelper.collections.POSTS, post.id, {
                    status: 'success',
                    fb_post_id: fbResult.id || fbResult.post_id
                });
                console.log(`✅ Post ${post.id} published via Scheduler`);

            } catch (err) {
                await dbHelper.update(dbHelper.collections.POSTS, post.id, {
                    status: 'failed',
                    error_message: err.message
                });
                console.error(`❌ Post ${post.id} scheduler failure:`, err.message);
            }
        }
    } catch (err) {
        console.error('Scheduler major error:', err.message);
    }
}

module.exports = { processScheduledPosts };
