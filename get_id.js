const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function getTemplateId() {
    try {
        const res = await pool.query('SELECT id FROM templates LIMIT 1');
        console.log('TEMPLATE_ID:', res.rows[0]?.id);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

getTemplateId();
