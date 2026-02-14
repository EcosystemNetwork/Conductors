import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { taskId, agentId, success } = req.body;

  if (!taskId || !agentId) {
    return res.status(400).json({ 
      error: 'taskId and agentId are required' 
    });
  }

  const task = dataStore.getTask(taskId);
  const agent = dataStore.getAgent(agentId);

  if (!task || !agent) {
    return res.status(404).json({ 
      error: 'Task or agent not found' 
    });
  }

  if (task.assignedTo !== agentId) {
    return res.status(403).json({ 
      error: 'Task is not assigned to this agent' 
    });
  }

  // Update task status
  const newStatus = success !== false ? 'completed' : 'failed';
  dataStore.updateTask(taskId, {
    status: newStatus,
    completedAt: Date.now()
  });

  // Add completed/failed task to history
  const updatedTask = dataStore.getTask(taskId);
  if (updatedTask) {
    dataStore.addToTaskHistory(updatedTask);
  }

  // Update agent
  if (success !== false) {
    dataStore.updateAgent(agentId, {
      status: 'idle',
      tasksCompleted: agent.tasksCompleted + 1,
      totalEarned: agent.totalEarned + task.reward
    });

    // Create payout
    const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const payout = {
      id: payoutId,
      agentId,
      taskId,
      amount: task.reward,
      timestamp: Date.now(),
      status: 'pending' as const,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}` // Simulated tx hash
    };

    dataStore.addPayout(payout);

    // Simulate payout completion
    setTimeout(() => {
      dataStore.updatePayout(payoutId, { status: 'completed' });
    }, 1000);

    return res.status(200).json({ 
      success: true,
      task: dataStore.getTask(taskId),
      agent: dataStore.getAgent(agentId),
      payout
    });
  } else {
    // Task failed - attempt retry if within retry limit
    dataStore.updateAgent(agentId, { status: 'idle' });
    
    const retried = dataStore.incrementTaskRetry(taskId);
    const retriedTask = dataStore.getTask(taskId);
    
    return res.status(200).json({ 
      success: true,
      task: retriedTask,
      agent: dataStore.getAgent(agentId),
      retried,
      message: retried ? 'Task will be retried' : 'Task failed - max retries reached'
    });
  }
}
