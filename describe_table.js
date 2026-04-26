const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function describeTable() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'templates'
        `);
        console.log('COLUMNS:', res.rows);

        const data = await pool.query('SELECT * FROM templates LIMIT 1');
        console.log('SAMPLE_DATA:', data.rows[0]);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

describeTable();
