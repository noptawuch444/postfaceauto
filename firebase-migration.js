/**
 * DATA MIGRATION SCRIPT: PostgreSQL to Firestore
 * 
 * Usage:
 * 1. Place your Firebase Service Account JSON as 'serviceAccount.json' in this folder.
 * 2. Ensure .env has your PostgreSQL DATABASE_URL.
 * 3. Run: node firebase-migration.js
 */

const { Client } = require('pg');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// 1. Initialize Firebase
const serviceAccountPath = path.join(__dirname, 'serviceAccount.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccount.json not found! Please download it from Firebase Console -> Project Settings -> Service Accounts.');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const dbFirestore = admin.firestore();

// 2. Initialize PostgreSQL
const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function migrate() {
    try {
        await pgClient.connect();
        console.log('✅ Connected to PostgreSQL');

        const collections = {
            USERS: 'users',
            PAGES: 'pages',
            TEMPLATES: 'templates',
            POSTS: 'posts',
            SETTINGS: 'settings'
        };

        // --- Migrate USERS ---
        console.log('👤 Migrating Users...');
        const usersRes = await pgClient.query('SELECT * FROM users');
        for (const user of usersRes.rows) {
            await dbFirestore.collection(collections.USERS).doc(user.id.toString()).set({
                email: user.email,
                password: user.password,
                role: user.role,
                created_at: new Date(user.created_at)
            });
        }
        console.log(`✅ Migrated ${usersRes.rows.length} users.`);

        // --- Migrate PAGES ---
        console.log('📄 Migrating Pages...');
        const pagesRes = await pgClient.query('SELECT * FROM pages');
        for (const page of pagesRes.rows) {
            await dbFirestore.collection(collections.PAGES).doc(page.id.toString()).set({
                page_id: page.page_id,
                page_name: page.page_name,
                page_access_token: page.page_access_token,
                page_picture: page.page_picture,
                created_at: new Date(page.created_at),
                updated_at: new Date(page.updated_at)
            });
        }
        console.log(`✅ Migrated ${pagesRes.rows.length} pages.`);

        // --- Migrate TEMPLATES ---
        console.log('📝 Migrating Templates...');
        const tempRes = await pgClient.query('SELECT * FROM templates');
        for (const t of tempRes.rows) {
            await dbFirestore.collection(collections.TEMPLATES).doc(t.id.toString()).set({
                page_id: t.page_id,
                template_name: t.template_name,
                password: t.password,
                expire_date: new Date(t.expire_date),
                slug: t.slug,
                auto_reply_enabled: t.auto_reply_enabled,
                auto_reply_text: t.auto_reply_text,
                created_at: new Date(t.created_at)
            });
        }
        console.log(`✅ Migrated ${tempRes.rows.length} templates.`);

        // --- Migrate SETTINGS ---
        console.log('⚙️ Migrating Settings...');
        const setRes = await pgClient.query('SELECT * FROM settings');
        for (const s of setRes.rows) {
            await dbFirestore.collection(collections.SETTINGS).doc(s.key).set({
                key: s.key,
                value: s.value
            });
        }
        console.log(`✅ Migrated ${setRes.rows.length} settings.`);

        // --- Migrate POSTS ---
        console.log('📮 Migrating Posts (Recent 200)...');
        const postsRes = await pgClient.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 200');
        for (const p of postsRes.rows) {
            await dbFirestore.collection(collections.POSTS).doc(p.id.toString()).set({
                template_id: p.template_id.toString(),
                message: p.message,
                image_url: p.image_url,
                status: p.status,
                fb_post_id: p.fb_post_id,
                schedule_time: p.schedule_time ? new Date(p.schedule_time) : null,
                error_message: p.error_message,
                auto_reply_text: p.auto_reply_text,
                created_at: new Date(p.created_at)
            });
        }
        console.log(`✅ Migrated ${postsRes.rows.length} recent posts.`);

        console.log('\n🎉 ALL DATA MIGRATED SUCCESSFULLY!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
