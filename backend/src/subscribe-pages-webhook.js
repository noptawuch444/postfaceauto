/**
 * สคริปต์สมัคร Page ทั้งหมดในระบบ เข้ากับ Webhook ของแอป
 * รันด้วย: node src/subscribe-pages-webhook.js
 */
const fetch = require('node-fetch');
const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/nopta/Desktop/postautoface/backend/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function subscribeAllPages() {
    try {
        const result = await pool.query('SELECT page_id, page_name, page_access_token FROM pages');
        const pages = result.rows;

        if (pages.length === 0) {
            console.log('❌ ไม่พบเพจในระบบ');
            return;
        }

        console.log(`📋 พบเพจทั้งหมด ${pages.length} เพจ\n`);

        for (const page of pages) {
            console.log(`🔗 กำลังสมัคร: ${page.page_name} (${page.page_id})...`);
            const res = await fetch(
                `https://graph.facebook.com/v18.0/${page.page_id}/subscribed_apps`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscribed_fields: 'feed',
                        access_token: page.page_access_token
                    })
                }
            );
            const data = await res.json();
            if (data.success) {
                console.log(`  ✅ สมัครสำเร็จ!`);
            } else {
                console.log(`  ❌ สมัครไม่สำเร็จ:`, data.error?.message || JSON.stringify(data));
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

subscribeAllPages();
