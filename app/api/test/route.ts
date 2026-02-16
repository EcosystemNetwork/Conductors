import { NextResponse } from 'next/server';

export async function GET() {
    console.log('Testing route hit. DB URL present:', !!process.env.DATABASE_URL);
    return NextResponse.json({
        status: 'ok',
        hasDbUrl: !!process.env.DATABASE_URL
    });
}
