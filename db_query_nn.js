require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function run() {
    try {
        const res = await pool.query('SELECT id, message, image_url, created_at FROM posts WHERE image_url IS NOT NULL ORDER BY created_at DESC');
        console.log("POSTS WITH IMAGES:", res.rows.length);
        if (res.rows.length > 0) {
            console.log(JSON.stringify(res.rows, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
