import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { TaskDispatcher } from '@/lib/taskDispatcher';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
        return NextResponse.json(
            { error: 'taskId is required' },
            { status: 400 }
        );
    }

    const task = await dataStore.getTask(taskId);
    if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const retried = await TaskDispatcher.retryTask(taskId);
    const updatedTask = await dataStore.getTask(taskId);

    if (retried) {
        const assignedAgent = await TaskDispatcher.matchTaskToAgent(updatedTask!);
        if (assignedAgent) {
            await TaskDispatcher.assignTask(taskId, assignedAgent.id);
        }

        return NextResponse.json({
            success: true,
            task: await dataStore.getTask(taskId),
            message: 'Task retry initiated',
            assigned: !!assignedAgent,
            assignedTo: assignedAgent?.name
        });
    } else {
        return NextResponse.json(
            {
                success: false,
                task: updatedTask,
                message: 'Max retries reached'
            },
            { status: 400 }
        );
    }
}
