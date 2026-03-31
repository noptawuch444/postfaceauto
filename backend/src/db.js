const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL || '';
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const isProd = process.env.NODE_ENV === 'production';

// Only use SSL in production when not on localhost
const connectionString = isProd && !isLocal && dbUrl
    ? dbUrl + (dbUrl.includes('?') ? '&' : '?') + 'sslmode=verify-full'
    : dbUrl;

const pool = new Pool({
    connectionString,
    ssl: isProd && !isLocal ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
