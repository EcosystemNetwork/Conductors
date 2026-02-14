import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Register a new agent
    const { name, skills, walletAddress } = req.body;

    // Validate input
    if (!name || !skills || !Array.isArray(skills)) {
      return res.status(400).json({ 
        error: 'Invalid input. Required: name (string), skills (array)' 
      });
    }

    // Generate unique ID
    const id = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const agent = {
      id,
      name,
      skills,
      status: 'idle' as const,
      registeredAt: Date.now(),
      tasksCompleted: 0,
      totalEarned: 0,
      walletAddress
    };

    dataStore.addAgent(agent);

    return res.status(201).json({ 
      success: true,
      agent 
    });
  } else if (req.method === 'GET') {
    // Get all agents
    const agents = dataStore.getAllAgents();
    return res.status(200).json({ agents });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
