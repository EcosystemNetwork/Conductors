
const { Wallet } = require('ethers');
const crypto = require('crypto');

async function test() {
    console.log('--- Public API Verification Test ---');

    // 1. Admin Login to get Key
    const wallet = Wallet.createRandom();
    const message = "Login to Conductor Admin Panel"; // This gives us an admin key
    const signature = await wallet.signMessage(message);

    console.log('Logging in as Admin...');
    const loginRes = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address, message, signature })
    });

    if (!loginRes.ok) {
        console.error('Admin Login Failed:', loginRes.status, await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    console.log('Admin Login Success. Key:', loginData.apiKey);
    const apiKey = loginData.apiKey;

    // 2. Register Agent
    console.log('\n--- Registering Agent ---');
    const agentName = `PublicTest_${Date.now()}`;
    const registerRes = await fetch('http://localhost:3000/api/agents/register', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: agentName,
            skills: ['test'],
            walletAddress: wallet.address
        })
    });
    const regJson = await registerRes.json();
    console.log('Register:', registerRes.status, regJson);

    // 3. Check Profile (New Endpoint)
    console.log('\n--- Checking Profile (GET /api/v1/agents/me) ---');
    const profileRes = await fetch('http://localhost:3000/api/v1/agents/me', {
        headers: { 'x-api-key': apiKey }
    });
    const profileJson = await profileRes.json();
    console.log('Profile:', profileRes.status, profileJson);

    // 4. List Jobs
    console.log('\n--- Listing Jobs (GET /api/v1/jobs) ---');
    const jobsRes = await fetch('http://localhost:3000/api/v1/jobs', {
        headers: { 'x-api-key': apiKey }
    });
    console.log('Jobs:', jobsRes.status, await jobsRes.json());

    // 5. Post Job (Should fail if pending, succeed if approved)
    console.log('\n--- Posting Job (POST /api/v1/jobs) ---');

    // First, approve the agent (since we are admin)
    // Wait, we need the Agent ID to approve.
    const agentId = regJson.agent?.id || profileJson.agent?.id;

    if (agentId) {
        const approveRes = await fetch('http://localhost:3000/api/admin/approve-agent', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentId: agentId,
                approved: true
            })
        });
        console.log('Approve Agent:', approveRes.status, await approveRes.json());
    } else {
        console.error("Could not find agent ID to approve!");
    }

    // Now post
    const postRes = await fetch('http://localhost:3000/api/v1/jobs', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: 'Public API Test Job',
            skills: ['test'],
            amount: 50
        })
    });
    console.log('Post Job:', postRes.status, await postRes.json());
}

test().catch(console.error);
