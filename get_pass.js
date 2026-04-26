const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function getPassword() {
    try {
        const res = await pool.query('SELECT password FROM templates WHERE id = 6');
        console.log('PASSWORD:', res.rows[0]?.password);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

getPassword();
