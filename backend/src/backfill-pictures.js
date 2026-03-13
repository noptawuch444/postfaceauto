const { Pool } = require('pg');
const fetch = require('node-fetch');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMaintenance() {
    try {
        // 1. Ensure column exists
        console.log('Verifying database schema...');
        await pool.query('ALTER TABLE pages ADD COLUMN IF NOT EXISTS page_picture TEXT;');
        console.log('✅ Schema verified.');

        // 2. Fetch pages
        const { rows: pages } = await pool.query('SELECT page_id FROM pages');
        console.log(`Found ${pages.length} pages to process...`);

        for (const page of pages) {
            try {
                console.log(`Processing page ${page.page_id}...`);
                // Use public picture endpoint
                const res = await fetch(`https://graph.facebook.com/v18.0/${page.page_id}/picture?type=large&redirect=false`);
                const data = await res.json();

                if (data.data?.url) {
                    const url = data.data.url;
                    await pool.query('UPDATE pages SET page_picture = $1 WHERE page_id = $2', [url, page.page_id]);
                    console.log(`✅ Updated picture for ${page.page_id}`);
                } else {
                    console.log(`⚠️ No picture found for ${page.page_id}:`, data.error?.message || 'Unknown error');
                }
            } catch (err) {
                console.error(`❌ Error processing page ${page.page_id}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await pool.end();
    }
}

runMaintenance();
