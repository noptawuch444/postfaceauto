require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function run() {
    try {
        const res = await pool.query('SELECT id, message, image_url, created_at FROM posts ORDER BY created_at DESC LIMIT 20');
        console.log("LAST 20 POSTS:");
        res.rows.forEach(r => {
            console.log(`ID: ${r.id}, image_url: ${r.image_url} (type: ${typeof r.image_url})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
