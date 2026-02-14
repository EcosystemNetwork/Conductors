import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Update health status for all agents
  dataStore.checkAgentHealth();

  const agents = dataStore.getAllAgents();
  const healthStats = {
    total: agents.length,
    healthy: agents.filter(a => a.health === 'healthy').length,
    degraded: agents.filter(a => a.health === 'degraded').length,
    unhealthy: agents.filter(a => a.health === 'unhealthy').length,
    offline: agents.filter(a => a.status === 'offline').length
  };

  return res.status(200).json({ 
    agents,
    stats: healthStats
  });
}
