const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function inspect() {
    try {
        console.log('--- PAGES ---');
        const pages = await pool.query('SELECT page_id, page_name, LEFT(page_access_token, 15) as token FROM pages');
        console.table(pages.rows);

        console.log('\n--- RECENT POSTS ---');
        const posts = await pool.query(`
      SELECT ps.fb_post_id, SUBSTRING(ps.auto_reply_text FROM 1 FOR 30) as reply, pg.page_name, ps.created_at 
      FROM posts ps 
      JOIN templates t ON ps.template_id = t.id 
      JOIN pages pg ON t.page_id = pg.page_id 
      WHERE ps.fb_post_id IS NOT NULL 
      ORDER BY ps.created_at DESC 
      LIMIT 10
    `);
        console.table(posts.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

inspect();
