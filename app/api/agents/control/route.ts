import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { TaskDispatcher } from '@/lib/taskDispatcher';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { agentId, command, parameters } = body;

    if (!agentId || !command) {
        return NextResponse.json(
            { error: 'agentId and command are required' },
            { status: 400 }
        );
    }

    const agent = await dataStore.getAgent(agentId);
    if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    switch (command) {
        case 'start':
            await dataStore.updateAgent(agentId, { status: 'idle' });
            return NextResponse.json({
                success: true,
                message: 'Agent started',
                agent: await dataStore.getAgent(agentId)
            });

        case 'stop':
            await dataStore.updateAgent(agentId, { status: 'offline' });
            return NextResponse.json({
                success: true,
                message: 'Agent stopped',
                agent: await dataStore.getAgent(agentId)
            });

        case 'assign_task': {
            const { taskId } = parameters || {};
            if (!taskId) {
                return NextResponse.json(
                    { error: 'taskId required for assign_task command' },
                    { status: 400 }
                );
            }

            const task = await dataStore.getTask(taskId);
            if (!task) {
                return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            }

            if (task.status !== 'pending') {
                return NextResponse.json(
                    { error: 'Task is not in pending status' },
                    { status: 400 }
                );
            }

            const assigned = await TaskDispatcher.assignTask(taskId, agentId);
            if (!assigned) {
                return NextResponse.json(
                    { error: 'Failed to assign task' },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Task assigned to agent',
                task: await dataStore.getTask(taskId),
                agent: await dataStore.getAgent(agentId)
            });
        }

        case 'update_skills': {
            const { skills } = parameters || {};
            if (!skills || !Array.isArray(skills)) {
                return NextResponse.json(
                    { error: 'skills array required for update_skills command' },
                    { status: 400 }
                );
            }

            await dataStore.updateAgent(agentId, { skills });
            return NextResponse.json({
                success: true,
                message: 'Agent skills updated',
                agent: await dataStore.getAgent(agentId)
            });
        }

        case 'get_status':
            return NextResponse.json({
                success: true,
                agent: await dataStore.getAgent(agentId)
            });

        default:
            return NextResponse.json(
                {
                    error: `Unknown command: ${command}`,
                    supportedCommands: ['start', 'stop', 'assign_task', 'update_skills', 'get_status']
                },
                { status: 400 }
            );
    }
}
