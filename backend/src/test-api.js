const fetch = require('node-fetch');

async function testApi() {
    try {
        const slug = 'pro-mote-warz';
        const res = await fetch(`http://localhost:5000/api/public/${slug}/info`);
        const data = await res.json();
        console.log('API Response (info):', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('API Test Error:', err.message);
    }
}

testApi();
