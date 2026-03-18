const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkPostIds() {
    try {
        console.log('--- RECENT POSTS WITH FB IDs ---');
        const res = await pool.query(`
            SELECT id, fb_post_id, status, created_at 
            FROM posts 
            WHERE status = 'success' 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkPostIds();
