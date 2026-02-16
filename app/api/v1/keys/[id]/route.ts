import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Key ID is required' },
                { status: 400 }
            );
        }

        await dataStore.deactivateApiKey(id);

        return NextResponse.json({
            success: true,
            message: `API key ${id} has been deactivated`,
        });
    } catch (error) {
        console.error('[API Keys] Error deactivating key:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
