const express = require('express');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const dbHelper = require('../db');
const facebook = require('../services/facebook');
const router = express.Router();

const bucket = admin.storage().bucket();

// GET /api/public/:slug/info
router.get('/:slug/info', async (req, res) => {
    try {
        const templates = await dbHelper.query(dbHelper.collections.TEMPLATES, [['slug', '==', req.params.slug]]);
        if (templates.length === 0) return res.status(404).json({ error: 'ไม่พบลิงก์นี้ในระบบ' });

        const template = templates[0];
        const pages = await dbHelper.query(dbHelper.collections.PAGES, [['page_id', '==', template.page_id]]);
        const page = pages[0] || {};

        res.json({
            template_name: template.template_name,
            page_name: page.page_name,
            page_id: template.page_id,
            page_picture: page.page_picture,
            auto_reply_enabled: template.auto_reply_enabled
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/public/:slug/verify
router.post('/:slug/verify', async (req, res) => {
    try {
        const { password } = req.body;
        const templates = await dbHelper.query(dbHelper.collections.TEMPLATES, [['slug', '==', req.params.slug]]);
        if (templates.length === 0) return res.status(404).json({ error: 'ไม่พบลิงก์นี้ในระบบ' });

        const template = templates[0];
        if (new Date(template.expire_date) < new Date()) {
            return res.status(403).json({ error: 'ลิงก์นี้หมดอายุแล้ว' });
        }
        if (template.password !== password) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        const pages = await dbHelper.query(dbHelper.collections.PAGES, [['page_id', '==', template.page_id]]);
        const page = pages[0] || {};

        res.json({
            success: true,
            template: {
                id: template.id,
                template_name: template.template_name,
                page_name: page.page_name,
                page_id: template.page_id,
                slug: template.slug,
                expire_date: template.expire_date,
                page_picture: page.page_picture,
                auto_reply_enabled: template.auto_reply_enabled
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/public/:slug/history
router.post('/:slug/history', async (req, res) => {
    try {
        const { password } = req.body;
        const templates = await dbHelper.query(dbHelper.collections.TEMPLATES, [['slug', '==', req.params.slug]]);
        if (templates.length === 0) return res.status(404).json({ error: 'ไม่พบลิงก์นี้ในระบบ' });

        const template = templates[0];
        if (template.password !== password) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

        const history = await dbHelper.query(dbHelper.collections.POSTS, [['template_id', '==', template.id]]);

        // Sort DESC locally
        history.sort((a, b) => {
            const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
            const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
            return dateB - dateA;
        });

        res.json(history.slice(0, 50));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { parseMultipart } = require('../utils/parser');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');

// POST /api/public/:slug/post - Create a post via public link
router.post('/:slug/post', async (req, res) => {
    try {
        const { fields, files } = await parseMultipart(req);
        const { password, message, schedule_time, post_now, auto_reply_text } = fields;

        // Lookup template
        const templates = await dbHelper.query(dbHelper.collections.TEMPLATES, [['slug', '==', req.params.slug]]);
        if (templates.length === 0) return res.status(404).json({ error: 'ไม่พบเทมเพลตนี้' });

        const template = templates[0];
        const pages = await dbHelper.query(dbHelper.collections.PAGES, [['page_id', '==', template.page_id]]);
        const page = pages[0] || {};

        // Security checks
        if (template.password !== password) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        if (new Date(template.expire_date) < new Date()) return res.status(403).json({ error: 'ลิงก์นี้หมดอายุแล้ว' });

        // Blacklist Check
        const settings = await dbHelper.query(dbHelper.collections.SETTINGS, [['key', '==', 'blacklist']]);
        if (settings.length > 0) {
            const blacklist = settings[0].value.split(',').map(k => k.trim()).filter(k => k);
            const lowerMessage = (message || '').toLowerCase();
            const hitWord = blacklist.find(word => lowerMessage.includes(word.toLowerCase()));
            if (hitWord) return res.status(400).json({ error: `ไม่สามารถโพสต์ได้ เนื่องจากข้อความมีคำที่ไม่อนุญาต: "${hitWord}"` });
        }

        const imageUrls = files.map(f => f.url);
        const imageUrlData = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;

        // Post immediately
        if (post_now === 'true' || post_now === true) {
            try {
                let fbResult;
                const tempFiles = [];

                // Helper to download from Storage to /tmp for Facebook upload
                const downloadToTmp = async (url) => {
                    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${path.basename(url)}`);
                    const response = await axios({ url, responseType: 'stream' });
                    const writer = fs.createWriteStream(tempPath);
                    response.data.pipe(writer);
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
                    tempFiles.push(tempPath);
                    return tempPath;
                };

                if (files.length > 1) {
                    const photoIds = [];
                    for (const f of files) {
                        const tmpPath = await downloadToTmp(f.url);
                        const id = await facebook.uploadPhotoToPage(template.page_id, page.page_access_token, tmpPath);
                        photoIds.push(id);
                    }
                    fbResult = await facebook.postMultiPhotoFeed(template.page_id, page.page_access_token, message || '', photoIds);
                } else if (files.length === 1) {
                    const tmpPath = await downloadToTmp(files[0].url);
                    fbResult = await facebook.postPhotoToPage(template.page_id, page.page_access_token, message || '', tmpPath);
                } else {
                    fbResult = await facebook.postToPage(template.page_id, page.page_access_token, message);
                }

                // Cleanup temp files
                tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

                await dbHelper.add(dbHelper.collections.POSTS, {
                    template_id: template.id,
                    message,
                    image_url: imageUrlData,
                    status: 'success',
                    fb_post_id: fbResult.id || fbResult.post_id,
                    auto_reply_text: auto_reply_text || null
                });

                return res.json({ success: true, message: 'โพสต์สำเร็จ! 🎉', fb_post_id: fbResult.id || fbResult.post_id });
            } catch (fbErr) {
                console.error('FB API Error:', fbErr);
                await dbHelper.add(dbHelper.collections.POSTS, {
                    template_id: template.id,
                    message,
                    image_url: imageUrlData,
                    status: 'failed',
                    error_message: fbErr.message
                });
                return res.status(500).json({ error: `โพสต์ไม่สำเร็จ: ${fbErr.message}` });
            }
        }

        // Schedule post
        if (!schedule_time) return res.status(400).json({ error: 'กรุณาตั้งเวลาโพสต์หรือเลือกโพสต์ทันที' });

        await dbHelper.add(dbHelper.collections.POSTS, {
            template_id: template.id,
            message,
            image_url: imageUrlData,
            schedule_time,
            status: 'pending',
            auto_reply_text: auto_reply_text || null
        });

        res.json({ success: true, message: 'ตั้งเวลาโพสต์เรียบร้อย! ⏰' });
    } catch (error) {
        console.error('Public Post Route Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
    }
});

// POST /api/public/:slug/history/delete
router.post('/:slug/history/delete', async (req, res) => {
    try {
        const { password, postId } = req.body;
        const templates = await dbHelper.query(dbHelper.collections.TEMPLATES, [['slug', '==', req.params.slug]]);
        if (templates.length === 0) return res.status(404).json({ error: 'ไม่พบเทมเพลตนี้' });

        const template = templates[0];
        if (template.password !== password) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

        const post = await dbHelper.get(dbHelper.collections.POSTS, postId);
        if (!post || post.template_id !== template.id || post.status !== 'pending') {
            return res.status(400).json({ error: 'ไม่สามารถลบรายการนี้ได้ (อาจถูกส่งไปแล้ว หรือไม่พบข้อมูล)' });
        }

        await dbHelper.delete(dbHelper.collections.POSTS, postId);
        res.json({ success: true, message: 'ลบรายการเรียบร้อยแล้ว' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
