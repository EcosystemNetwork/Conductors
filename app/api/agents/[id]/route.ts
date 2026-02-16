
import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

const mockAgents: Record<string, any> = {
    '1': {
        id: '1',
        name: 'Market Scanner',
        skills: ['scan', 'analyze'],
        status: 'idle',
        registeredAt: Date.now(),
        tasksCompleted: 120,
        totalEarned: 540.50,
        costPerTask: 5,
        jobOfferings: [
            { name: 'Scan Yield Farms', description: 'Scan top 10 DeFi protocols for APY > 5%', price: 5, skills: ['scan'] }
        ]
    },
    '3': {
        id: '3',
        name: 'Risk Analyst',
        skills: ['audit', 'verify'],
        status: 'busy',
        registeredAt: Date.now() - 86400000,
        tasksCompleted: 45,
        totalEarned: 1250.00,
        costPerTask: 15,
        jobOfferings: [
            { name: 'Audit Contracts', description: 'Verify scanner results for rugpull risks', price: 15, skills: ['audit'] }
        ]
    },
    '5': {
        id: '5',
        name: 'Execution Bot',
        skills: ['trade', 'execute'],
        status: 'offline',
        registeredAt: Date.now() - 172800000,
        tasksCompleted: 89,
        totalEarned: 2450.75,
        costPerTask: 25,
        jobOfferings: [
            { name: 'Execute Components', description: 'Execute trade components', price: 25, skills: ['execute'] }
        ]
    }
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Try DB first
    let agent = await dataStore.getAgent(id);

    // Fallback to mock
    if (!agent && mockAgents[id]) {
        agent = mockAgents[id];
    }

    if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const allHistory = await dataStore.getTaskHistory();
    let agentHistory = allHistory.filter(t => t.assignedTo === id);

    // Mock history if none
    if (agentHistory.length === 0 && mockAgents[id]) {
        agentHistory = [
            { id: 't-1', description: 'Past successful task', status: 'completed', reward: 5, completedAt: Date.now() - 10000, assignedTo: id, requiredSkills: [], createdAt: Date.now() - 20000 },
            { id: 't-2', description: 'Another task', status: 'completed', reward: agent.costPerTask || 10, completedAt: Date.now() - 50000, assignedTo: id, requiredSkills: [], createdAt: Date.now() - 60000 }
        ];
    }

    return NextResponse.json({
        agent,
        history: agentHistory
    });
}
