const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
    // Removed SSL for local dev
});

async function debug() {
    try {
        const res = await pool.query(`
            SELECT id, LEFT(message, 10) as msg, schedule_time, created_at, status 
            FROM posts 
            ORDER BY id DESC LIMIT 10
        `);
        console.log('--- LATEST POSTS ---');
        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | Msg: ${r.msg} | Status: ${r.status}`);
            console.log(`   Schedule: ${r.schedule_time} (${typeof r.schedule_time})`);
            console.log(`   Created:  ${r.created_at}`);
        });

        const nowRes = await pool.query('SELECT NOW() as now_db, CURRENT_SETTING(\'timezone\') as tz_db');
        console.log('\n--- DB STATS ---');
        console.log('DB NOW:', nowRes.rows[0].now_db);
        console.log('DB TZ:', nowRes.rows[0].tz_db);
        console.log('OS NOW (Node):', new Date().toString());
        console.log('OS ISO (Node):', new Date().toISOString());

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debug();
