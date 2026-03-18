const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

async function triggerAllTokens() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT page_id, page_name, page_access_token FROM pages');

        console.log(`Found ${res.rows.length} pages. Attempting calls for each...`);

        for (const row of res.rows) {
            const { page_id, page_name, page_access_token } = row;
            console.log(`--- Testing Page: ${page_name} (${page_id}) ---`);

            // Check pages_show_list / pages_read_engagement
            try {
                await axios.get(`https://graph.facebook.com/v18.0/${page_id}?fields=id,name&access_token=${page_access_token}`);
                console.log(`✅ [${page_name}] Basic hit success`);

                await axios.get(`https://graph.facebook.com/v18.0/${page_id}/feed?limit=1&access_token=${page_access_token}`);
                console.log(`✅ [${page_name}] pages_read_engagement success`);

                await axios.post(`https://graph.facebook.com/v18.0/${page_id}/subscribed_apps`, {
                    subscribed_fields: ['feed', 'messages'],
                    access_token: page_access_token
                });
                console.log(`✅ [${page_name}] pages_manage_metadata success`);
            } catch (e) {
                console.log(`❌ [${page_name}] Failed: ${e.response?.data?.error?.message || e.message}`);
            }
        }

    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await client.end();
    }
}

triggerAllTokens();
