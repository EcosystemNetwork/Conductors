import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
    try {
        await sql`DELETE FROM agents`;
        await sql`DELETE FROM tasks`;
        await sql`DELETE FROM payouts`;
        await sql`DELETE FROM task_history`;
        await sql`DELETE FROM submissions`;
        await sql`DELETE FROM job_requests`;
        return NextResponse.json({ success: true, message: 'All data cleared' });
    } catch (error) {
        console.error('[Admin] Reset failed:', error);
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }
}
