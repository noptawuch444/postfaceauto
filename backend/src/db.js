const { Pool } = require('pg');
require('dotenv').config();

const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
const isProd = process.env.NODE_ENV === 'production';

// Only use SSL in production when not on localhost
const connectionString = isProd && !isLocal
    ? process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=verify-full'
    : process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: isProd && !isLocal ? { rejectUnauthorized: false } : false
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
