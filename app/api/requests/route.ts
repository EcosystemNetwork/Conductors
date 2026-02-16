import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
    try {
        const requests = await dataStore.getAllJobRequests();
        return NextResponse.json({ requests });
    } catch (error) {
        console.error('Error fetching job requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, budget, createdBy } = body;

        if (!title || !description || !budget || !createdBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newRequest = {
            id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            title,
            description,
            budget: Number(budget),
            status: 'open' as const,
            createdAt: Date.now(),
            createdBy,
            bids: []
        };

        await dataStore.addJobRequest(newRequest);
        return NextResponse.json({ request: newRequest });

    } catch (error: any) {
        console.error('Error creating job request:', error);
        return NextResponse.json({ error: 'Failed to create request', details: error.message }, { status: 500 });
    }
}
