import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { type, source, totalCost, taskIds, agentIds, description } = req.body;

    if (!type || !source) {
      return res.status(400).json({
        error: 'type and source are required'
      });
    }

    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const submission = {
      id,
      type: type as 'job' | 'swarm',
      source: source as 'dashboard' | 'planner' | 'bot-api',
      submittedAt: Date.now(),
      totalCost: totalCost || 0,
      taskIds: taskIds || [],
      agentIds: agentIds || [],
      status: 'submitted' as const,
      taskCount: (taskIds || []).length,
      agentCount: (agentIds || []).length,
      description: description || ''
    };

    dataStore.addSubmission(submission);

    return res.status(201).json({ success: true, submission });
  } else if (req.method === 'GET') {
    const submissions = dataStore.getAllSubmissions();

    // Build a lookup map of all tasks once to avoid N+1 lookups
    const allTasks = dataStore.getAllTasks();
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    // Enrich submissions with current task statuses
    const enriched = submissions.map(sub => {
      const tasks = sub.taskIds.map(id => taskMap.get(id)).filter(Boolean);
      const completedCount = tasks.filter(t => t?.status === 'completed').length;
      const failedCount = tasks.filter(t => t?.status === 'failed').length;
      const pendingCount = tasks.filter(t => t?.status === 'pending').length;
      const assignedCount = tasks.filter(t => t?.status === 'assigned').length;

      let currentStatus = sub.status;
      if (sub.taskCount > 0) {
        if (completedCount + failedCount === sub.taskCount) {
          currentStatus = failedCount > 0 && completedCount === 0 ? 'failed' : 'completed';
        } else if (assignedCount > 0 || completedCount > 0) {
          currentStatus = 'in-progress';
        }
      }

      if (currentStatus !== sub.status) {
        dataStore.updateSubmission(sub.id, { status: currentStatus });
      }

      return {
        ...sub,
        status: currentStatus,
        progress: {
          completed: completedCount,
          failed: failedCount,
          pending: pendingCount,
          assigned: assignedCount,
          total: sub.taskCount
        }
      };
    });

    return res.status(200).json({ submissions: enriched, total: enriched.length });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
