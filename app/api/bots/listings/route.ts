import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill');
    const botId = searchParams.get('botId');
    const agents = await dataStore.getAllAgents();

    const listings: Array<{
        botId: string;
        botName: string;
        botStatus: string;
        skills: string[];
        walletAddress?: string;
        offering: {
            name: string;
            description: string;
            price: number;
            skills: string[];
        };
    }> = [];

    const skillStr = skill ? skill.toLowerCase() : null;

    for (const agent of agents) {
        if (botId && agent.id !== botId) continue;

        const offerings = agent.jobOfferings || [];
        for (const offering of offerings) {
            if (skillStr) {
                const hasSkill = offering.skills.some(
                    (s: string) => s.toLowerCase() === skillStr
                ) || agent.skills.some(
                    (s: string) => s.toLowerCase() === skillStr
                );
                if (!hasSkill) continue;
            }

            listings.push({
                botId: agent.id,
                botName: agent.name,
                botStatus: agent.status,
                skills: agent.skills,
                walletAddress: agent.walletAddress,
                offering,
            });
        }

        if (offerings.length === 0 && agent.costPerTask) {
            if (skillStr) {
                const hasSkill = agent.skills.some(
                    (s: string) => s.toLowerCase() === skillStr
                );
                if (!hasSkill) continue;
            }

            listings.push({
                botId: agent.id,
                botName: agent.name,
                botStatus: agent.status,
                skills: agent.skills,
                walletAddress: agent.walletAddress,
                offering: {
                    name: `${agent.name} - General Tasks`,
                    description: `General task execution by ${agent.name}`,
                    price: agent.costPerTask,
                    skills: agent.skills,
                },
            });
        }
    }

    return NextResponse.json({ listings, count: listings.length });
}
