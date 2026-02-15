import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
        return NextResponse.json(
            { error: 'agentId is required' },
            { status: 400 }
        );
    }

    const agent = await dataStore.getAgent(agentId);
    if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await dataStore.updateAgentHeartbeat(agentId);

    return NextResponse.json({
        success: true,
        agent: await dataStore.getAgent(agentId),
        message: 'Heartbeat recorded'
    });
}
