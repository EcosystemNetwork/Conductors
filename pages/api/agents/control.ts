import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';
import { TaskDispatcher } from '../../../lib/taskDispatcher';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { agentId, command, parameters } = req.body;

  if (!agentId || !command) {
    return res.status(400).json({ 
      error: 'agentId and command are required' 
    });
  }

  const agent = await dataStore.getAgent(agentId);
  if (!agent) {
    return res.status(404).json({ 
      error: 'Agent not found' 
    });
  }

  switch (command) {
    case 'start':
      // Start the agent (set to idle)
      await dataStore.updateAgent(agentId, { status: 'idle' });
      return res.status(200).json({
        success: true,
        message: 'Agent started',
        agent: await dataStore.getAgent(agentId)
      });

    case 'stop':
      // Stop the agent (set to offline)
      await dataStore.updateAgent(agentId, { status: 'offline' });
      return res.status(200).json({
        success: true,
        message: 'Agent stopped',
        agent: await dataStore.getAgent(agentId)
      });

    case 'assign_task':
      // Manually assign a specific task to the agent
      const { taskId } = parameters || {};
      if (!taskId) {
        return res.status(400).json({ error: 'taskId required for assign_task command' });
      }

      const task = await dataStore.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.status !== 'pending') {
        return res.status(400).json({ error: 'Task is not in pending status' });
      }

      const assigned = await TaskDispatcher.assignTask(taskId, agentId);
      if (!assigned) {
        return res.status(400).json({ error: 'Failed to assign task' });
      }

      return res.status(200).json({
        success: true,
        message: 'Task assigned to agent',
        task: await dataStore.getTask(taskId),
        agent: await dataStore.getAgent(agentId)
      });

    case 'update_skills':
      // Update agent skills
      const { skills } = parameters || {};
      if (!skills || !Array.isArray(skills)) {
        return res.status(400).json({ error: 'skills array required for update_skills command' });
      }

      await dataStore.updateAgent(agentId, { skills });
      return res.status(200).json({
        success: true,
        message: 'Agent skills updated',
        agent: await dataStore.getAgent(agentId)
      });

    case 'get_status':
      // Get current agent status
      return res.status(200).json({
        success: true,
        agent: await dataStore.getAgent(agentId)
      });

    default:
      return res.status(400).json({ 
        error: `Unknown command: ${command}`,
        supportedCommands: ['start', 'stop', 'assign_task', 'update_skills', 'get_status']
      });
  }
}
