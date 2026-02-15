import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
    const payouts = await dataStore.getAllPayouts();
    return NextResponse.json({ payouts });
}
