const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function inspect() {
    try {
        const tables = ['templates', 'pages', 'posts'];
        for (const table of tables) {
            console.log(`--- ${table.toUpperCase()} SCHEMA ---`);
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            console.table(res.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
