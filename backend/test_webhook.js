const fetch = require('node-fetch');

const webhookUrl = 'https://hook.eu1.make.com/4f6zqj1868rfxwm1e3qi3ajvfv22k6ra';

async function testWebhook() {
    // Test 1: Text-only post
    console.log('--- Test 1: Text-only post ---');
    try {
        const res1 = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Test from debug script - text only - ' + new Date().toISOString(),
                page_id: '120608804337693',
                has_photo: false
            }),
        });
        console.log('Status:', res1.status);
        const text1 = await res1.text();
        console.log('Response:', text1.substring(0, 500));
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Test 2: Photo post
    console.log('\n--- Test 2: Photo post ---');
    try {
        const res2 = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Test from debug script - with photo - ' + new Date().toISOString(),
                page_id: '120608804337693',
                photo_url_1: 'https://picsum.photos/800/600',
                has_photo: true
            }),
        });
        console.log('Status:', res2.status);
        const text2 = await res2.text();
        console.log('Response:', text2.substring(0, 500));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testWebhook();
