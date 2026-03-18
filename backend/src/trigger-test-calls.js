const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

async function triggerApiCalls() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT page_id, page_access_token FROM pages ORDER BY updated_at DESC LIMIT 1');

        if (res.rows.length === 0) {
            console.log('No pages found in database. Manual connection required.');
            return;
        }

        const { page_id, page_access_token } = res.rows[0];
        console.log(`Found page ${page_id}. Triggering permissions checks...`);

        // 1. pages_show_list / pages_read_engagement (Reading feed)
        try {
            const feedRes = await axios.get(`https://graph.facebook.com/v18.0/${page_id}/feed?access_token=${page_access_token}&limit=1`);
            console.log('✅ pages_read_engagement call successful');
        } catch (e) {
            console.log('❌ pages_read_engagement call failed:', e.response?.data || e.message);
        }

        // 2. pages_manage_metadata (Subscribing to webhooks)
        try {
            const subRes = await axios.post(`https://graph.facebook.com/v18.0/${page_id}/subscribed_apps`, {
                subscribed_fields: ['feed', 'messages'],
                access_token: page_access_token
            });
            console.log('✅ pages_manage_metadata call successful');
        } catch (e) {
            console.log('❌ pages_manage_metadata call failed:', e.response?.data || e.message);
        }

        // 3. pages_show_list (Getting full account list)
        try {
            await axios.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${page_access_token}`);
            console.log('✅ pages_show_list (via me/accounts) call successful');
        } catch (e) {
            console.log('❌ pages_show_list call failed:', e.response?.data || e.message);
        }

    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await client.end();
    }
}

triggerApiCalls();
