import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { hashApiKey, generateRawApiKey } from '@/lib/apiKeyAuth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, owner_wallet } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Missing required field: name (string)' },
                { status: 400 }
            );
        }

        const rawKey = generateRawApiKey();
        const keyHash = await hashApiKey(rawKey);
        const id = `key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const createdAt = Date.now();

        await dataStore.addApiKey({
            id,
            keyHash,
            name: name.trim(),
            ownerWallet: owner_wallet || undefined,
            createdAt,
            isActive: true,
            permissions: ['jobs.create', 'jobs.read'],
        });

        return NextResponse.json(
            {
                success: true,
                key: rawKey, // Shown ONCE — cannot be retrieved again
                id,
                name: name.trim(),
                owner_wallet: owner_wallet || null,
                created_at: createdAt,
                permissions: ['jobs.create', 'jobs.read'],
                message: '⚠️ Save this key now — it cannot be retrieved again.',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[API Keys] Error creating key:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const keys = await dataStore.getAllApiKeys();

        // Return keys without the hash — just metadata
        const masked = keys.map(k => ({
            id: k.id,
            name: k.name,
            owner_wallet: k.ownerWallet || null,
            created_at: k.createdAt,
            last_used_at: k.lastUsedAt || null,
            is_active: k.isActive,
            permissions: k.permissions,
        }));

        return NextResponse.json({ keys: masked, count: masked.length });
    } catch (error) {
        console.error('[API Keys] Error listing keys:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
