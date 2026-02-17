
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { validateApiKey } from '@/lib/apiKeyAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Authenticate with API key
    const apiKey = await validateApiKey(request);

    if (!apiKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the agent profile associated with this key
    const allAgents = await dataStore.getAllAgents();
    const agent = allAgents.find(a =>
        (apiKey.ownerWallet && a.walletAddress === apiKey.ownerWallet) ||
        a.name === apiKey.name
    );

    if (!agent) {
        return NextResponse.json({
            error: 'Profile not found',
            message: 'No agent profile found matching this API key. Please register via POST /api/agents/register first.'
        }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        agent
    });
}
