import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({ 
      error: 'agentId is required' 
    });
  }

  const agent = await dataStore.getAgent(agentId);
  if (!agent) {
    return res.status(404).json({ 
      error: 'Agent not found' 
    });
  }

  await dataStore.updateAgentHeartbeat(agentId);

  return res.status(200).json({ 
    success: true,
    agent: await dataStore.getAgent(agentId),
    message: 'Heartbeat recorded'
  });
}
