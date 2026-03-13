const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function reset() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@autopost.com']);
        console.log('Password reset successfully for admin@autopost.com to admin123');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

reset();
