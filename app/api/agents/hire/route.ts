import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, serviceName, description, price, paymentMethod, x402Payment } = body;

        if (!agentId || !serviceName || !paymentMethod) {
            return NextResponse.json(
                { error: 'Missing required fields: agentId, serviceName, paymentMethod' },
                { status: 400 }
            );
        }

        const agent = await dataStore.getAgent(agentId);
        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        if (paymentMethod !== 'x402') {
            return NextResponse.json(
                { error: 'Only x402 payment method is supported for this endpoint' },
                { status: 400 }
            );
        }

        // Validate x402 payment
        if (!x402Payment || !x402Payment.transactionHash || !x402Payment.amount) {
            return NextResponse.json(
                {
                    error: 'Payment Required',
                    x402: {
                        chainId: 1, // Default to Mainnet for now
                        amount: price.toString(),
                        currency: 'ETH', // Assume ETH for simplicity
                        recipient: agent.walletAddress
                    }
                },
                { status: 402 }
            );
        }

        // Create Task
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const task = {
            id: taskId,
            description: `Hired for: ${serviceName} - ${description || 'No additional details'}`,
            requiredSkills: [], // Could derive from service
            status: 'assigned' as const,
            assignedTo: agentId,
            createdAt: Date.now(),
            reward: parseFloat(price),
            priority: 1,
            paymentMethod: 'x402' as const,
            paymentReceived: true,
            x402Payment: {
                chainId: x402Payment.chainId || 1,
                amount: x402Payment.amount,
                currency: x402Payment.currency || 'ETH'
            }
        };

        await dataStore.addTask(task);

        // Record Payout
        const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const payout = {
            id: payoutId,
            agentId: agentId,
            taskId: taskId,
            amount: parseFloat(price),
            timestamp: Date.now(),
            status: 'completed' as const,
            transactionHash: x402Payment.transactionHash,
            paymentMethod: 'x402' as const,
            chainId: x402Payment.chainId || 1,
            currency: x402Payment.currency || 'ETH'
        };

        await dataStore.addPayout(payout);

        // Update Agent Status
        await dataStore.updateAgent(agentId, {
            status: 'busy',
            tasksCompleted: (agent.tasksCompleted || 0), // Don't increment yet, wait for completion?
            // Actually, 'busy' implies working.
            totalEarned: (agent.totalEarned || 0) + parseFloat(price) // Instant payout for x402?
            // Let's assume escrow/instant for now.
        });

        // Add to history immediately for visibility
        await dataStore.addToTaskHistory(task);

        return NextResponse.json({
            success: true,
            task,
            payout,
            message: 'Agent hired successfully via x402'
        });

    } catch (error) {
        console.error('Error in hire agent:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
