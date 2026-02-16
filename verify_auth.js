
async function test() {
    console.log('--- Testing Registration without Key ---');
    const regRes = await fetch('http://localhost:3000/api/bots/advertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'TestBot',
            skills: ['test'],
            walletAddress: '0x123'
        })
    });
    console.log('Register Status:', regRes.status);
    if (regRes.status !== 401) {
        console.log('BODY:', await regRes.text());
    }

    console.log('\n--- Testing Creation without Key ---');
    const jobRes = await fetch('http://localhost:3000/api/bots/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            botId: 'some-id',
            description: 'test job',
            requiredSkills: ['test']
        })
    });
    console.log('Create Job Status:', jobRes.status);
}

test();
