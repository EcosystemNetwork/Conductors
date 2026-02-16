import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { validateApiKey } from '@/lib/apiKeyAuth';

export async function POST(request: NextRequest) {
    // Auth Check
    const auth = await validateApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, agentId, success } = body;

    if (!taskId || !agentId) {
        return NextResponse.json(
            { error: 'taskId and agentId are required' },
            { status: 400 }
        );
    }

    const task = await dataStore.getTask(taskId);
    const agent = await dataStore.getAgent(agentId);

    if (!task || !agent) {
        return NextResponse.json(
            { error: 'Task or agent not found' },
            { status: 404 }
        );
    }

    if (task.assignedTo !== agentId) {
        return NextResponse.json(
            { error: 'Task is not assigned to this agent' },
            { status: 403 }
        );
    }

    const newStatus = success !== false ? 'completed' : 'failed';
    await dataStore.updateTask(taskId, {
        status: newStatus,
        completedAt: Date.now()
    });

    const updatedTask = await dataStore.getTask(taskId);
    if (updatedTask) {
        await dataStore.addToTaskHistory(updatedTask);
    }

    if (success !== false) {
        await dataStore.updateAgent(agentId, {
            status: 'idle',
            tasksCompleted: agent.tasksCompleted + 1,
            totalEarned: agent.totalEarned + task.reward
        });

        const payoutId = crypto.randomUUID();
        const payout = {
            id: payoutId,
            agentId,
            taskId,
            amount: task.reward,
            timestamp: Date.now(),
            status: 'completed' as const, // IMMEDIATELY completed for simulation
            transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
        };

        // Note: In a real system, status would be 'pending' and processed by a worker.
        // For this demo/simulation, we mark it as completed immediately but we should label it as simulated in UI.

        await dataStore.addPayout(payout);

        return NextResponse.json({
            success: true,
            task: await dataStore.getTask(taskId),
            agent: await dataStore.getAgent(agentId),
            payout
        });
    } else {
        await dataStore.updateAgent(agentId, { status: 'idle' });

        const retried = await dataStore.incrementTaskRetry(taskId);
        const retriedTask = await dataStore.getTask(taskId);

        return NextResponse.json({
            success: true,
            task: retriedTask,
            agent: await dataStore.getAgent(agentId),
            retried,
            message: retried ? 'Task will be retried' : 'Task failed - max retries reached'
        });
    }
}
