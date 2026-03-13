const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function inspect() {
    try {
        console.log('--- POSTS SCHEMA ---');
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'posts'");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
