import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';
import { TaskDispatcher } from '../../../lib/taskDispatcher';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { agentId } = req.query;

  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({ 
      error: 'agentId query parameter is required' 
    });
  }

  // Get the next available task for this agent
  const task = TaskDispatcher.getNextTaskForAgent(agentId);

  if (!task) {
    return res.status(200).json({ 
      task: null,
      message: 'No available tasks for this agent'
    });
  }

  return res.status(200).json({ 
    task,
    message: 'Task assigned successfully'
  });
}
