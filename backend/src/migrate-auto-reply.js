const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/nopta/Desktop/postautoface/backend/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log('🚀 Starting migration...');
        await pool.query('ALTER TABLE templates ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT FALSE;');
        await pool.query('ALTER TABLE templates ADD COLUMN IF NOT EXISTS auto_reply_text TEXT;');
        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
