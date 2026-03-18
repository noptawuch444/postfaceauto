const db = require('./db');

/**
 * Migration script to ensure database columns use TIMESTAMPTZ
 * to handle timezone differences between local dev and Render (UTC).
 */
async function runMigrations() {
    console.log('🔄 Checking database schema for timezone support...');
    try {
        // List of columns to convert to TIMESTAMPTZ
        const migrations = [
            { table: 'posts', column: 'schedule_time' },
            { table: 'posts', column: 'created_at' },
            { table: 'templates', column: 'expire_date' },
            { table: 'templates', column: 'created_at' },
            { table: 'users', column: 'created_at' },
            { table: 'pages', column: 'created_at' },
            { table: 'pages', column: 'updated_at' }
        ];

        for (const m of migrations) {
            await db.query(`
                ALTER TABLE ${m.table} 
                ALTER COLUMN ${m.column} TYPE TIMESTAMPTZ;
            `);
        }

        console.log('✅ Database migration successful: All timestamp columns converted to TIMESTAMPTZ.');
    } catch (err) {
        // We log but don't crash the server, in case some tables don't exist yet
        console.error('⚠️ Database migration warning:', err.message);
    }
}

module.exports = { runMigrations };
