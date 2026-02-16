import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { TaskDispatcher } from '@/lib/taskDispatcher';
import { validateApiKey } from '@/lib/apiKeyAuth';

export async function POST(request: NextRequest) {
    // Auth Check
    const auth = await validateApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
        botId,
        description,
        requiredSkills,
        reward,
        priority,
        maxRetries,
        paymentMethod,
        x402Payment
    } = body;

    if (!botId) {
        return NextResponse.json(
            { error: 'Bot ID is required' },
            { status: 400 }
        );
    }

    const bot = await dataStore.getAgent(botId);
    if (!bot) {
        return NextResponse.json(
            { error: 'Bot not found. Please register the bot first at /api/agents/register' },
            { status: 404 }
        );
    }

    if (!description || !requiredSkills || !Array.isArray(requiredSkills)) {
        return NextResponse.json(
            { error: 'Invalid input. Required: description (string), requiredSkills (array)' },
            { status: 400 }
        );
    }

    if (priority !== undefined && (priority < 1 || priority > 5)) {
        return NextResponse.json(
            { error: 'Priority must be between 1 (highest) and 5 (lowest)' },
            { status: 400 }
        );
    }

    if (paymentMethod && !['x402', 'ethereum'].includes(paymentMethod)) {
        return NextResponse.json(
            { error: 'Payment method must be either "x402" or "ethereum"' },
            { status: 400 }
        );
    }

    if (paymentMethod === 'x402' && x402Payment) {
        if (!x402Payment.chainId || !x402Payment.amount || !x402Payment.currency) {
            return NextResponse.json(
                { error: 'x402 payment requires chainId, amount, and currency' },
                { status: 400 }
            );
        }
    }

    const id = crypto.randomUUID();

    const task = {
        id,
        description,
        requiredSkills,
        status: 'pending' as const,
        createdAt: Date.now(),
        createdBy: botId,
        reward: reward || 10,
        priority: priority || 3,
        maxRetries: maxRetries || 3,
        retryCount: 0,
        paymentMethod: paymentMethod || 'ethereum',
        x402Payment: paymentMethod === 'x402' ? x402Payment : undefined
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
            assignedTo: assignedAgent?.name,
            message: 'Job created and advertised successfully',
            advertisedTo: assignedAgent ? [assignedAgent.name] : 'all available bots'
        },
        { status: 201 }
    );
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    const allTasks = await dataStore.getAllTasks();
    const botTasks = botId
        ? allTasks.filter((task: any) => task.createdBy === botId)
        : allTasks;

    return NextResponse.json({ tasks: botTasks, count: botTasks.length });
}
