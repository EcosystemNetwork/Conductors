
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { randomUUID } from 'crypto';

// Minimal signature verification helper if not exists
// We will use thirdweb or ethers to verify. 
// Since we have ethers installed:
import { verifyMessage } from 'ethers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, signature, message } = body;

        if (!address || !signature || !message) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // 1. Verify Signature
        const recoveredAddress = verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. Claim Admin (First user wins)
        const isAdmin = await dataStore.claimAdmin(address);

        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                message: 'Admin access denied. Admin wallet already claimed by another user.'
            }, { status: 403 });
        }

        // 3. Generate Session API Key for Admin
        // In a real app we'd use a session cookie or JWT. 
        // For this demo, we'll return a temporary API key that has 'admin' permissions.

        // Use cnd_live_ prefix so it passes standard validation regex if any
        const sessionKey = `cnd_live_admin_${randomUUID().replace(/-/g, '')}`;
        // We need to hash it.
        // Importing internal helpers is messy if not exported.
        // Let's reuse dataStore.addApiKey directly if we can hash manually.
        const { createHash } = await import('crypto');
        const keyHash = createHash('sha256').update(sessionKey).digest('hex');

        await dataStore.addApiKey({
            id: randomUUID(),
            keyHash,
            name: `Admin Session ${address.slice(0, 6)}`,
            ownerWallet: address,
            createdAt: Date.now(),
            isActive: true,
            permissions: ['admin', 'jobs.create', 'jobs.read']
        });

        return NextResponse.json({
            success: true,
            isAdmin: true,
            apiKey: sessionKey,
            wallet: address
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
