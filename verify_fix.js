
const API_KEY = 'cnd_live_test_key_' + Date.now();
const KEY_NAME = 'TestRunner_' + Date.now();
let agentId;

async function test() {
    console.log('--- 1. Create API Key ---');
    const keyRes = await fetch('http://localhost:3000/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: KEY_NAME })
    });
    const keyData = await keyRes.json();
    console.log('Key Created:', keyData.key);
    const validKey = keyData.key;

    console.log('\n--- 2. Try to Post Job WITHOUT Agent Profile (Should Fail) ---');
    const failJob = await fetch('http://localhost:3000/api/v1/jobs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': validKey
        },
        body: JSON.stringify({
            title: 'Illegal Job',
            skills: ['none']
        })
    });
    console.log('Job Post Status (Expect 403):', failJob.status);
    console.log('Response:', await failJob.text());

    console.log('\n--- 3. Register Agent (With Key) ---');
    const regRes = await fetch('http://localhost:3000/api/agents/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': validKey
        },
        // We use the same name as the key to pass the loose check
        body: JSON.stringify({
            name: KEY_NAME,
            skills: ['test', 'debug'],
            walletAddress: '0x123'
        })
    });
    const regData = await regRes.json();
    console.log('Agent Registered:', regRes.status, regData.agent?.id);
    agentId = regData.agent?.id;

    console.log('\n--- 4. Try to Post Job WITH Agent Profile (Should Success) ---');
    const successJob = await fetch('http://localhost:3000/api/v1/jobs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': validKey
        },
        body: JSON.stringify({
            title: 'Legal Job',
            skills: ['test']
        })
    });
    console.log('Job Post Status (Expect 201):', successJob.status);
    console.log('Response:', await successJob.text());
}

test();
