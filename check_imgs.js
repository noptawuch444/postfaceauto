const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function checkImages() {
    try {
        const res = await pool.query('SELECT id, message, image_url, created_at FROM posts WHERE image_url IS NOT NULL ORDER BY created_at DESC LIMIT 5');
        console.log('RECENT POSTS WITH IMAGES:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

checkImages();
