import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

/**
 * API endpoint for bots to advertise their capabilities
 * POST /api/bots/advertise
 * 
 * This endpoint allows bots to register or update their advertised capabilities
 * 
 * Body:
 * {
 *   name: string,
 *   skills: string[],
 *   walletAddress?: string,
 *   costPerTask?: number,
 *   availability?: 'available' | 'busy' | 'offline',
 *   jobOfferings?: Array<{
 *     name: string,
 *     description: string,
 *     price: number,
 *     skills: string[]
 *   }>,
 *   capabilities?: {
 *     maxConcurrentTasks?: number,
 *     supportedPaymentMethods?: ('ethereum' | 'x402')[],
 *     description?: string
 *   }
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { 
      name, 
      skills, 
      walletAddress, 
      costPerTask,
      availability,
      jobOfferings,
      capabilities 
    } = req.body;

    // Validate input
    if (!name || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input. Required: name (string), skills (array with at least one skill)' 
      });
    }

    // Check if bot already exists
    const existingAgents = await dataStore.getAllAgents();
    const existingBot = existingAgents.find((agent: any) => agent.name === name);

    if (existingBot) {
      // Update existing bot's capabilities
      const updatedAgent = {
        ...existingBot,
        skills,
        walletAddress: walletAddress || existingBot.walletAddress,
        status: availability || existingBot.status || 'idle',
        costPerTask,
        jobOfferings: jobOfferings || existingBot.jobOfferings,
        capabilities: capabilities || existingBot.capabilities,
        lastHeartbeat: Date.now(),
        health: 'healthy' as const
      };

      await dataStore.updateAgent(existingBot.id, updatedAgent);

      return res.status(200).json({ 
        success: true,
        agent: updatedAgent,
        message: 'Bot capabilities updated and advertised successfully'
      });
    } else {
      // Register new bot
      const id = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const agent = {
        id,
        name,
        skills,
        status: availability || 'idle' as const,
        registeredAt: Date.now(),
        tasksCompleted: 0,
        totalEarned: 0,
        walletAddress,
        lastHeartbeat: Date.now(),
        health: 'healthy' as const,
        costPerTask,
        jobOfferings,
        capabilities
      };

      await dataStore.addAgent(agent);

      return res.status(201).json({ 
        success: true,
        agent,
        message: 'Bot registered and advertised successfully'
      });
    }
  } else if (req.method === 'GET') {
    // Get all advertised bots
    const agents = await dataStore.getAllAgents();
    
    // Filter for only available bots
    const { available } = req.query;
    const filteredAgents = available === 'true' 
      ? agents.filter((agent: any) => agent.status === 'idle')
      : agents;

    return res.status(200).json({ 
      bots: filteredAgents,
      count: filteredAgents.length
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
