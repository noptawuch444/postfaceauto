const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkRecentPosts() {
    try {
        const res = await pool.query(`
            SELECT p.id, p.status, p.error_message, p.fb_post_id, p.created_at, t.template_name, pg.page_name 
            FROM posts p
            JOIN templates t ON p.template_id = t.id
            JOIN pages pg ON t.page_id = pg.page_id
            ORDER BY p.created_at DESC LIMIT 5
        `);
        console.log("Recent Posts Status:");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("DB Error:", e.message);
    } finally {
        await pool.end();
    }
}

checkRecentPosts();
