import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

/**
 * API endpoint to list all bot job offerings with prices
 * GET /api/bots/listings
 * 
 * Query params:
 *   skill?: string - Filter listings by skill (e.g., "claw", "trade")
 *   botId?: string - Filter listings by specific bot
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { skill, botId } = req.query;
    const agents = dataStore.getAllAgents();

    // Build listings from all bots that have job offerings
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

    for (const agent of agents) {
      // Filter by botId if provided
      if (botId && agent.id !== botId) continue;

      const offerings = agent.jobOfferings || [];
      for (const offering of offerings) {
        // Filter by skill if provided
        if (skill) {
          const skillStr = Array.isArray(skill) ? skill[0] : skill;
          const hasSkill = offering.skills.some(
            (s: string) => s.toLowerCase() === skillStr.toLowerCase()
          ) || agent.skills.some(
            (s: string) => s.toLowerCase() === skillStr.toLowerCase()
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

      // If bot has no jobOfferings but has costPerTask, create a default listing
      if (offerings.length === 0 && agent.costPerTask) {
        if (skill) {
          const skillStr = Array.isArray(skill) ? skill[0] : skill;
          const hasSkill = agent.skills.some(
            (s: string) => s.toLowerCase() === skillStr.toLowerCase()
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

    return res.status(200).json({
      listings,
      count: listings.length,
    });
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
