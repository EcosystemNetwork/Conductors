import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { TaskDispatcher } from '@/lib/taskDispatcher';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { description, requiredSkills, reward, priority, maxRetries } = body;

    if (!description || !requiredSkills || !Array.isArray(requiredSkills)) {
        return NextResponse.json(
            { error: 'Invalid input. Required: description (string), requiredSkills (array)' },
            { status: 400 }
        );
    }

    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const task = {
        id,
        description,
        requiredSkills,
        status: 'pending' as const,
        createdAt: Date.now(),
        reward: reward || 10,
        priority: priority || 3,
        maxRetries: maxRetries || 3,
        retryCount: 0
    };

    await dataStore.addTask(task);

    const assignedAgent = await TaskDispatcher.matchTaskToAgent(task);
    if (assignedAgent) {
        await TaskDispatcher.assignTask(task.id, assignedAgent.id);
    }

    return NextResponse.json(
        {
            success: true,
            task: await dataStore.getTask(id),
            assigned: !!assignedAgent,
            assignedTo: assignedAgent?.name
        },
        { status: 201 }
    );
}

export async function GET() {
    const tasks = await dataStore.getAllTasks();
    return NextResponse.json({ tasks });
}
