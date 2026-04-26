const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function updateExpiry() {
    try {
        const res = await pool.query("UPDATE templates SET expire_date = '2027-01-01' WHERE slug = 'pro' RETURNING id, slug, expire_date");
        console.log('UPDATED:', res.rows[0]);
    } catch (err) {
        console.error('Error updating DB:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateExpiry();
