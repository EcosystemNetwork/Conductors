import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { name, skills, walletAddress, costPerTask, jobOfferings } = body;

    if (!name || !skills || !Array.isArray(skills)) {
        return NextResponse.json(
            { error: 'Invalid input. Required: name (string), skills (array of strings)' },
            { status: 400 }
        );
    }

    const id = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const bot = {
        id,
        name,
        skills: skills.map((s: string) => s.trim()),
        status: 'idle' as const,
        tasksCompleted: 0,
        totalEarned: 0,
        walletAddress: walletAddress || '',
        costPerTask: costPerTask ? parseFloat(costPerTask) : undefined,
        registeredAt: Date.now(),
        lastHeartbeat: Date.now(),
        health: 'healthy' as const,
        jobOfferings: jobOfferings || []
    };

    await dataStore.addAgent(bot);

    return NextResponse.json(
        {
            success: true,
            bot,
            message: 'Bot advertised successfully',
            endpoints: {
                createJob: '/api/bots/create-job',
                purchaseJob: '/api/bots/purchase-job',
                listings: '/api/bots/listings',
                heartbeat: '/api/agents/heartbeat'
            }
        },
        { status: 201 }
    );
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const available = searchParams.get('available');

    const agents = await dataStore.getAllAgents();
    const bots = available === 'true'
        ? agents.filter(a => a.status !== 'offline')
        : agents;

    return NextResponse.json({
        bots,
        count: bots.length
    });
}
