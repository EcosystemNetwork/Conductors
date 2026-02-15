import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
    const history = await dataStore.getTaskHistory();
    return NextResponse.json({ history, total: history.length });
}
