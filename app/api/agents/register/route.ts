import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { name, skills, walletAddress, costPerTask, jobOfferings } = body;

    if (!name || !skills || !Array.isArray(skills)) {
        return NextResponse.json(
            { error: 'Invalid input. Required: name (string), skills (array)' },
            { status: 400 }
        );
    }

    const id = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const agent = {
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

    await dataStore.addAgent(agent);

    return NextResponse.json({ success: true, agent }, { status: 201 });
}

export async function GET() {
    const agents = await dataStore.getAllAgents();
    return NextResponse.json({ agents });
}
