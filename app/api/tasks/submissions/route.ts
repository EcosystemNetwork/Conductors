import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { type, source, totalCost, taskIds, agentIds, description } = body;

    if (!type || !source) {
        return NextResponse.json(
            { error: 'type and source are required' },
            { status: 400 }
        );
    }

    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const submission = {
        id,
        type: type as 'job' | 'swarm',
        source: source as 'dashboard' | 'planner' | 'bot-api',
        submittedAt: Date.now(),
        totalCost: totalCost || 0,
        taskIds: taskIds || [],
        agentIds: agentIds || [],
        status: 'submitted' as const,
        taskCount: (taskIds || []).length,
        agentCount: (agentIds || []).length,
        description: description || ''
    };

    await dataStore.addSubmission(submission);

    return NextResponse.json({ success: true, submission }, { status: 201 });
}

export async function GET() {
    const submissions = await dataStore.getAllSubmissions();

    const allTasks = await dataStore.getAllTasks();
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    const enriched = await Promise.all(submissions.map(async sub => {
        const tasks = sub.taskIds.map((id: string) => taskMap.get(id)).filter(Boolean);
        const completedCount = tasks.filter(t => t?.status === 'completed').length;
        const failedCount = tasks.filter(t => t?.status === 'failed').length;
        const pendingCount = tasks.filter(t => t?.status === 'pending').length;
        const assignedCount = tasks.filter(t => t?.status === 'assigned').length;

        let currentStatus = sub.status;
        if (sub.taskCount > 0) {
            if (completedCount + failedCount === sub.taskCount) {
                currentStatus = failedCount > 0 && completedCount === 0 ? 'failed' : 'completed';
            } else if (assignedCount > 0 || completedCount > 0) {
                currentStatus = 'in-progress';
            }
        }

        if (currentStatus !== sub.status) {
            await dataStore.updateSubmission(sub.id, { status: currentStatus });
        }

        return {
            ...sub,
            status: currentStatus,
            progress: {
                completed: completedCount,
                failed: failedCount,
                pending: pendingCount,
                assigned: assignedCount,
                total: sub.taskCount
            }
        };
    }));

    return NextResponse.json({ submissions: enriched, total: enriched.length });
}
