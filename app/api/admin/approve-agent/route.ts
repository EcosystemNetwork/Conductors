
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { validateApiKey, hasPermission } from '@/lib/apiKeyAuth';

export async function POST(request: NextRequest) {
    const apiKey = await validateApiKey(request);

    // In a real app, we'd check for specific 'admin' permission
    // For now, we assume any valid key with 'admin' permission or just valid key for this demo?
    // User didn't specify admin auth mechanism layer.
    // We'll rely on checking if the key has 'admin' permission which we can add to our key schema/logic later,
    // or for now just assume valid key is enough for the demo context if we don't have roles yet.
    // Converting to "Admin only" per user request often implies a specific role.

    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for 'admin' permission
    if (!hasPermission(apiKey, 'admin')) {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { agentId, approved } = body;

    if (!agentId || typeof approved !== 'boolean') {
        return NextResponse.json({ error: 'Invalid input. Required: agentId (string), approved (boolean)' }, { status: 400 });
    }

    const agent = await dataStore.getAgent(agentId);
    if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await dataStore.updateAgent(agentId, {
        verificationStatus: approved ? 'approved' : 'rejected'
    });

    return NextResponse.json({
        success: true,
        message: `Agent ${agent.name} ${approved ? 'approved' : 'rejected'}`,
        agentId,
        status: approved ? 'approved' : 'rejected'
    });
}
