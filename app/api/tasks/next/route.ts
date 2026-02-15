import { NextRequest, NextResponse } from 'next/server';
import { TaskDispatcher } from '@/lib/taskDispatcher';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
        return NextResponse.json(
            { error: 'agentId query parameter is required' },
            { status: 400 }
        );
    }

    const task = await TaskDispatcher.getNextTaskForAgent(agentId);

    if (!task) {
        return NextResponse.json({
            task: null,
            message: 'No available tasks for this agent'
        });
    }

    return NextResponse.json({ task, message: 'Task assigned successfully' });
}
