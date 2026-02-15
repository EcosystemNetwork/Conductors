import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
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

        const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const payout = {
            id: payoutId,
            agentId,
            taskId,
            amount: task.reward,
            timestamp: Date.now(),
            status: 'pending' as const,
            transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
        };

        await dataStore.addPayout(payout);

        setTimeout(async () => {
            try {
                await dataStore.updatePayout(payoutId, { status: 'completed' });
            } catch (err) {
                console.error('[Tasks] Failed to update payout status:', err);
            }
        }, 1000);

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
