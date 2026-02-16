import { NextRequest } from 'next/server';
import { dataStore } from './dataStore';

export interface ApiKeyRecord {
    id: string;
    keyHash: string;
    name: string;
    ownerWallet?: string;
    createdAt: number;
    lastUsedAt?: number;
    isActive: boolean;
    permissions: string[];
}

async function sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashApiKey(rawKey: string): Promise<string> {
    return sha256(rawKey);
}

export function generateRawApiKey(): string {
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(36).padStart(2, '0'))
        .join('')
        .substring(0, 40);
    return `cnd_live_${randomPart}`;
}

export async function validateApiKey(request: NextRequest): Promise<ApiKeyRecord | null> {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) return null;

    const hash = await hashApiKey(apiKey);
    const keyRecord = await dataStore.getApiKeyByHash(hash);

    if (!keyRecord || !keyRecord.isActive) return null;

    // Update last used timestamp (fire and forget)
    dataStore.updateApiKeyLastUsed(keyRecord.id).catch(() => { });

    return keyRecord;
}

export function hasPermission(key: ApiKeyRecord, permission: string): boolean {
    return key.permissions.includes(permission);
}
