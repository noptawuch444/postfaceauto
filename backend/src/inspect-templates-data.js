const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function inspect() {
    try {
        console.log('--- TEMPLATES DATA ---');
        const templates = await pool.query('SELECT id, template_name, slug, auto_reply_enabled, auto_reply_text FROM templates');
        console.table(templates.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
