require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
    .then(() => client.query('SELECT slug, password FROM templates LIMIT 1'))
    .then(res => {
        console.log(JSON.stringify(res.rows[0]));
        client.end();
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
