const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkPages() {
    try {
        const res = await pool.query('SELECT page_id, page_name FROM pages');
        console.log("Registered Pages:");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("DB Error:", e.message);
    } finally {
        await pool.end();
    }
}

checkPages();
