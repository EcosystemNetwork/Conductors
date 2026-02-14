import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const agents = dataStore.getAllAgents();
  const tasks = dataStore.getAllTasks();
  const payouts = dataStore.getAllPayouts();
  const history = dataStore.getTaskHistory();

  // Calculate network statistics
  const stats = {
    agents: {
      total: agents.length,
      idle: agents.filter(a => a.status === 'idle').length,
      busy: agents.filter(a => a.status === 'busy').length,
      offline: agents.filter(a => a.status === 'offline').length,
      healthy: agents.filter(a => a.health === 'healthy').length,
      degraded: agents.filter(a => a.health === 'degraded').length,
      unhealthy: agents.filter(a => a.health === 'unhealthy').length,
    },
    tasks: {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      assigned: tasks.filter(t => t.status === 'assigned').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      byPriority: {
        high: tasks.filter(t => t.priority === 1 || t.priority === 2).length,
        medium: tasks.filter(t => t.priority === 3).length,
        low: tasks.filter(t => t.priority === 4 || t.priority === 5).length,
      }
    },
    payouts: {
      total: payouts.length,
      pending: payouts.filter(p => p.status === 'pending').length,
      completed: payouts.filter(p => p.status === 'completed').length,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
    },
    history: {
      total: history.length,
      completedTasks: history.filter(h => h.status === 'completed').length,
      failedTasks: history.filter(h => h.status === 'failed').length,
    },
    network: {
      uptime: process.uptime(),
      timestamp: Date.now(),
    }
  };

  return res.status(200).json({ 
    success: true,
    stats,
    agents: agents.slice(0, 10), // Return first 10 agents
    recentTasks: tasks.slice(-10).reverse(), // Return last 10 tasks
  });
}
