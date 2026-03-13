const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function inspect() {
    try {
        console.log('--- USERS ---');
        const users = await pool.query('SELECT id, email, role FROM users');
        console.table(users.rows);

        console.log('--- TEMPLATES ---');
        const templates = await pool.query('SELECT id, name, slug, password FROM templates');
        console.table(templates.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
