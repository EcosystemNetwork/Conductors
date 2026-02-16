import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { validateApiKey, hasPermission } from '@/lib/apiKeyAuth';
import { TaskDispatcher } from '@/lib/taskDispatcher';

export async function POST(request: NextRequest) {
    // Authenticate with API key
    const apiKey = await validateApiKey(request);
    if (!apiKey) {
        return NextResponse.json(
            {
                error: 'Unauthorized. Provide a valid API key via the X-API-Key header.',
                hint: 'Generate a key at POST /api/v1/keys',
            },
            { status: 401 }
        );
    }

    if (!hasPermission(apiKey, 'jobs.create')) {
        return NextResponse.json(
            { error: 'Forbidden. This API key does not have jobs.create permission.' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const {
            title,
            description,
            reward_wallet,
            amount,
            skills,
            priority,
            max_retries,
            payment_method,
        } = body;

        // Validate required fields
        if (!title || typeof title !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: title (string)' },
                { status: 400 }
            );
        }

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return NextResponse.json(
                { error: 'Missing required field: skills (non-empty array of strings)' },
                { status: 400 }
            );
        }

        if (priority !== undefined && (priority < 1 || priority > 5)) {
            return NextResponse.json(
                { error: 'Priority must be between 1 (highest) and 5 (lowest)' },
                { status: 400 }
            );
        }

        const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        const task = {
            id,
            description: description || title,
            requiredSkills: skills.map((s: string) => s.trim()),
            status: 'pending' as const,
            createdAt: Date.now(),
            createdBy: `apikey:${apiKey.id}`,
            reward: amount || 10,
            priority: priority || 3,
            maxRetries: max_retries || 3,
            retryCount: 0,
            paymentMethod: payment_method || 'ethereum',
        };

        await dataStore.addTask(task);

        // Try to auto-assign to a matching agent
        const assignedAgent = await TaskDispatcher.matchTaskToAgent(task);
        if (assignedAgent) {
            await TaskDispatcher.assignTask(task.id, assignedAgent.id);
        }

        return NextResponse.json(
            {
                success: true,
                job: {
                    id: task.id,
                    title,
                    description: task.description,
                    skills: task.requiredSkills,
                    amount: task.reward,
                    priority: task.priority,
                    reward_wallet: reward_wallet || null,
                    status: assignedAgent ? 'assigned' : 'pending',
                    created_at: task.createdAt,
                    created_by: apiKey.name,
                },
                assigned: !!assignedAgent,
                assigned_to: assignedAgent?.name || null,
                message: assignedAgent
                    ? `Job created and assigned to ${assignedAgent.name}`
                    : 'Job created and advertised to all available agents',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[V1 Jobs] Error creating job:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    // Optional auth — if key provided, filter to that key's jobs
    const apiKey = await validateApiKey(request);

    try {
        const allTasks = await dataStore.getAllTasks();

        let jobs;
        if (apiKey) {
            // Filter to jobs created by this API key
            jobs = allTasks.filter((t: any) => t.createdBy === `apikey:${apiKey.id}`);
        } else {
            // Return all pending jobs (public listing)
            jobs = allTasks.filter((t: any) => t.status === 'pending');
        }

        return NextResponse.json({
            jobs: jobs.map((t: any) => ({
                id: t.id,
                description: t.description,
                skills: t.requiredSkills,
                amount: t.reward,
                priority: t.priority,
                status: t.status,
                assigned_to: t.assignedTo || null,
                created_at: t.createdAt,
            })),
            count: jobs.length,
            authenticated: !!apiKey,
        });
    } catch (error) {
        console.error('[V1 Jobs] Error listing jobs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
