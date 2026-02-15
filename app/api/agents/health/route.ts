import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
    await dataStore.checkAgentHealth();

    const agents = await dataStore.getAllAgents();
    const healthStats = {
        total: agents.length,
        healthy: agents.filter(a => a.health === 'healthy').length,
        degraded: agents.filter(a => a.health === 'degraded').length,
        unhealthy: agents.filter(a => a.health === 'unhealthy').length,
        offline: agents.filter(a => a.status === 'offline').length
    };

    return NextResponse.json({ agents, stats: healthStats });
}
