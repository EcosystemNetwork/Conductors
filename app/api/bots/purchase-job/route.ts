import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { botId, taskId, paymentMethod, x402Payment } = body;

    if (!botId || !taskId) {
        return NextResponse.json(
            { error: 'Bot ID and Task ID are required' },
            { status: 400 }
        );
    }

    const bot = await dataStore.getAgent(botId);
    if (!bot) {
        return NextResponse.json(
            { error: 'Bot not found. Please register the bot first at /api/bots/advertise' },
            { status: 404 }
        );
    }

    const task = await dataStore.getTask(taskId);
    if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 'pending') {
        return NextResponse.json(
            { error: `Task is not available. Current status: ${task.status}` },
            { status: 400 }
        );
    }

    if (!paymentMethod || !['x402', 'ethereum'].includes(paymentMethod)) {
        return NextResponse.json(
            { error: 'Payment method must be either "x402" or "ethereum"' },
            { status: 400 }
        );
    }

    if (paymentMethod === 'x402') {
        if (!x402Payment) {
            return NextResponse.json(
                {
                    error: 'x402 payment details required',
                    x402Version: 1,
                    accepts: [{
                        chainId: task.x402Payment?.chainId || 1,
                        amount: task.x402Payment?.amount || task.reward.toString(),
                        currency: task.x402Payment?.currency || 'ETH',
                        description: `Payment for task: ${task.description}`,
                        taskId: task.id
                    }]
                },
                { status: 402 }
            );
        }

        if (!x402Payment.chainId || !x402Payment.amount || !x402Payment.currency) {
            return NextResponse.json(
                { error: 'x402 payment requires chainId, amount, and currency' },
                { status: 400 }
            );
        }

        const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const payout = {
            id: payoutId,
            agentId: botId,
            taskId: task.id,
            amount: parseFloat(x402Payment.amount),
            timestamp: Date.now(),
            status: 'completed' as const,
            transactionHash: x402Payment.transactionHash || `x402-${Date.now()}`,
            paymentMethod: 'x402' as const,
            chainId: x402Payment.chainId,
            currency: x402Payment.currency
        };

        await dataStore.addPayout(payout);

        const updatedTask = {
            ...task,
            status: 'assigned' as const,
            assignedTo: botId,
            paymentReceived: true,
            paymentMethod: 'x402' as const
        };

        await dataStore.updateTask(taskId, updatedTask);

        const updatedBot = {
            ...bot,
            status: 'busy' as const,
            lastHeartbeat: Date.now()
        };
        await dataStore.updateAgent(botId, updatedBot);

        return NextResponse.json({
            success: true,
            task: updatedTask,
            payout,
            message: 'Job purchased successfully using x402',
            paymentResponse: {
                transactionHash: payout.transactionHash,
                status: 'confirmed'
            }
        });
    } else {
        const updatedTask = {
            ...task,
            status: 'assigned' as const,
            assignedTo: botId,
            paymentMethod: 'ethereum' as const
        };

        await dataStore.updateTask(taskId, updatedTask);

        const updatedBot = {
            ...bot,
            status: 'busy' as const,
            lastHeartbeat: Date.now()
        };
        await dataStore.updateAgent(botId, updatedBot);

        return NextResponse.json({
            success: true,
            task: updatedTask,
            message: 'Job purchased successfully. Payment will be processed on completion.',
            paymentInfo: {
                method: 'ethereum',
                walletAddress: bot.walletAddress,
                reward: task.reward
            }
        });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
        return NextResponse.json(
            { error: 'Bot ID is required as query parameter' },
            { status: 400 }
        );
    }

    const allPayouts = await dataStore.getAllPayouts();
    const botPayouts = allPayouts.filter((payout: any) => payout.agentId === botId);

    return NextResponse.json({
        purchases: botPayouts,
        count: botPayouts.length,
        totalSpent: botPayouts.reduce((sum: number, p: any) => sum + p.amount, 0)
    });
}
