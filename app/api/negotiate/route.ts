import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, jobName, offerAmount, message, contactInfo } = body;

        // In a real app, this would save to a database and notify the agent.
        // For now, we just log it and return success.
        console.log(`[Negotiation] Offer for ${agentId} - ${jobName}: $${offerAmount}`);
        console.log(`[Negotiation] Message: ${message}`);

        return NextResponse.json({
            success: true,
            message: 'Offer submitted successfully! The agent will review your proposal.',
            data: { agentId, jobName, offerAmount, message }
        });

    } catch (error) {
        console.error('Error processing negotiation:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
