
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;

    const agent = await dataStore.getAgent(id);

    if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Also fetch tasks completed by this agent?
    // The dataStore has tasksCompleted count, but maybe not the list?
    // dataStore.getTaskHistory() returns all tasks. Filter by agentId?
    const allHistory = await dataStore.getTaskHistory();
    const agentHistory = allHistory.filter(t => t.assignedTo === id);

    // Also fetch current job offerings?
    // Agent object has jobOfferings.

    return NextResponse.json({
        agent,
        history: agentHistory
    });
}
