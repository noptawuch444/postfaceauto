const db = require('./db');

async function optimizeDb() {
    console.log('🚀 Starting Database Optimization...');

    try {
        // [1] Index for post status and schedule time (Crucial for Scheduler)
        console.log('--- Applying index on posts(status, schedule_time)...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_status_schedule ON posts(status, schedule_time)`);

        // [2] Index for post ID matching (Crucial for Webhook)
        console.log('--- Applying index on posts(fb_post_id)...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_fb_id ON posts(fb_post_id)`);

        // [3] Index for Template Slug (Crucial for Public Links)
        console.log('--- Applying index on templates(slug)...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug)`);

        // [4] Index for Template Page ID (Crucial for lookups)
        console.log('--- Applying index on templates(page_id)...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_templates_page_id ON templates(page_id)`);

        // [5] Index for Page ID (Primary lookup)
        console.log('--- Applying index on pages(page_id)...');
        await db.query(`CREATE INDEX IF NOT EXISTS idx_pages_page_id ON pages(page_id)`);

        console.log('\n✅ Database Optimization Complete!');
    } catch (err) {
        console.error('❌ Optimization Failed:', err.message);
    } finally {
        process.exit();
    }
}

optimizeDb();
