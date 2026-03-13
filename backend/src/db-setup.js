const fs = require('fs');
const path = require('path');
const db = require('./db');

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database...');
        const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schema);
        console.log('✅ Database setup complete!');
        console.log('   Default admin: admin@autopost.com / admin123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
}

setupDatabase();
