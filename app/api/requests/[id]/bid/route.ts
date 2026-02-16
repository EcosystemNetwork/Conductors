import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { agentId, amount, message } = body;

        if (!agentId || !amount || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const bid = {
            agentId,
            amount: Number(amount),
            message,
            timestamp: Date.now()
        };

        await dataStore.addBidToRequest(id, bid);
        return NextResponse.json({ success: true, bid });

    } catch (error) {
        console.error('Error submitting bid:', error);
        return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 });
    }
}
