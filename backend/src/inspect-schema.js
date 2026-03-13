const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function inspect() {
    try {
        console.log('--- TEMPLATES SCHEMA ---');
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'templates'");
        console.table(res.rows);

        console.log('--- PAGES ---');
        const pages = await pool.query('SELECT * FROM pages');
        console.table(pages.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
