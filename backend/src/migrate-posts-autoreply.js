const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/nopta/Desktop/postautoface/backend/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log('🚀 Adding auto_reply_text to posts table...');
        await pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS auto_reply_text TEXT;');
        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
