import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';
import { TaskDispatcher } from '../../../lib/taskDispatcher';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { taskId } = req.body;

  if (!taskId) {
    return res.status(400).json({ 
      error: 'taskId is required' 
    });
  }

  const task = dataStore.getTask(taskId);
  if (!task) {
    return res.status(404).json({ 
      error: 'Task not found' 
    });
  }

  const retried = TaskDispatcher.retryTask(taskId);
  const updatedTask = dataStore.getTask(taskId);

  if (retried) {
    // Try to auto-assign to an available agent
    const assignedAgent = TaskDispatcher.matchTaskToAgent(updatedTask!);
    if (assignedAgent) {
      TaskDispatcher.assignTask(taskId, assignedAgent.id);
    }

    return res.status(200).json({
      success: true,
      task: dataStore.getTask(taskId),
      message: 'Task retry initiated',
      assigned: !!assignedAgent,
      assignedTo: assignedAgent?.name
    });
  } else {
    return res.status(400).json({
      success: false,
      task: updatedTask,
      message: 'Max retries reached'
    });
  }
}
