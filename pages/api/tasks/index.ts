import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';
import { TaskDispatcher } from '../../../lib/taskDispatcher';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create a new task
    const { description, requiredSkills, reward } = req.body;

    // Validate input
    if (!description || !requiredSkills || !Array.isArray(requiredSkills)) {
      return res.status(400).json({ 
        error: 'Invalid input. Required: description (string), requiredSkills (array)' 
      });
    }

    // Generate unique ID
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const task = {
      id,
      description,
      requiredSkills,
      status: 'pending' as const,
      createdAt: Date.now(),
      reward: reward || 10 // Default reward
    };

    dataStore.addTask(task);

    // Try to auto-assign to an available agent
    const assignedAgent = TaskDispatcher.matchTaskToAgent(task);
    if (assignedAgent) {
      TaskDispatcher.assignTask(task.id, assignedAgent.id);
    }

    return res.status(201).json({ 
      success: true,
      task: dataStore.getTask(id),
      assigned: !!assignedAgent,
      assignedTo: assignedAgent?.name
    });
  } else if (req.method === 'GET') {
    // Get all tasks
    const tasks = dataStore.getAllTasks();
    return res.status(200).json({ tasks });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
