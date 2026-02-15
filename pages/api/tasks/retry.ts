import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';
import { TaskDispatcher } from '../../../lib/taskDispatcher';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const task = await dataStore.getTask(taskId);
  if (!task) {
    return res.status(404).json({ 
      error: 'Task not found' 
    });
  }

  const retried = await TaskDispatcher.retryTask(taskId);
  const updatedTask = await dataStore.getTask(taskId);

  if (retried) {
    // Try to auto-assign to an available agent
    const assignedAgent = await TaskDispatcher.matchTaskToAgent(updatedTask!);
    if (assignedAgent) {
      await TaskDispatcher.assignTask(taskId, assignedAgent.id);
    }

    return res.status(200).json({
      success: true,
      task: await dataStore.getTask(taskId),
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
