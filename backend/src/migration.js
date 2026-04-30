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

        // [New] Add performance indexes automatically
        console.log('🚀 Checking performance indexes...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_status_schedule ON posts(status, schedule_time)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_fb_id ON posts(fb_post_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_templates_page_id ON templates(page_id)`);

        // [New] Add share_to_group_enabled column if not exists
        await db.query(`
            ALTER TABLE templates
            ADD COLUMN IF NOT EXISTS share_to_group_enabled BOOLEAN DEFAULT false;
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_pages_page_id ON pages(page_id)`);
        console.log('✅ Performance indexes verified.');
    } catch (err) {
        // We log but don't crash the server, in case some tables don't exist yet
        console.error('⚠️ Database migration warning:', err.message);
    }
}

module.exports = { runMigrations };
