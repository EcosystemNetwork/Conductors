import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';
import { TaskDispatcher } from '../../../lib/taskDispatcher';

/**
 * API endpoint for bots to create and advertise jobs
 * POST /api/bots/create-job
 * 
 * Body:
 * {
 *   botId: string,
 *   description: string,
 *   requiredSkills: string[],
 *   reward: number,
 *   priority?: number (1-5),
 *   maxRetries?: number,
 *   paymentMethod?: 'x402' | 'ethereum',
 *   x402Payment?: {
 *     chainId: number,
 *     amount: string,
 *     currency: string
 *   }
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { 
      botId, 
      description, 
      requiredSkills, 
      reward, 
      priority, 
      maxRetries,
      paymentMethod,
      x402Payment
    } = req.body;

    // Validate bot exists
    if (!botId) {
      return res.status(400).json({ 
        error: 'Bot ID is required' 
      });
    }

    const bot = await dataStore.getAgent(botId);
    if (!bot) {
      return res.status(404).json({ 
        error: 'Bot not found. Please register the bot first at /api/agents/register' 
      });
    }

    // Validate input
    if (!description || !requiredSkills || !Array.isArray(requiredSkills)) {
      return res.status(400).json({ 
        error: 'Invalid input. Required: description (string), requiredSkills (array)' 
      });
    }

    // Validate priority if provided
    if (priority !== undefined && (priority < 1 || priority > 5)) {
      return res.status(400).json({
        error: 'Priority must be between 1 (highest) and 5 (lowest)'
      });
    }

    // Validate payment method
    if (paymentMethod && !['x402', 'ethereum'].includes(paymentMethod)) {
      return res.status(400).json({
        error: 'Payment method must be either "x402" or "ethereum"'
      });
    }

    // Validate x402 payment details if using x402
    if (paymentMethod === 'x402' && x402Payment) {
      if (!x402Payment.chainId || !x402Payment.amount || !x402Payment.currency) {
        return res.status(400).json({
          error: 'x402 payment requires chainId, amount, and currency'
        });
      }
    }

    // Generate unique ID
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const task = {
      id,
      description,
      requiredSkills,
      status: 'pending' as const,
      createdAt: Date.now(),
      createdBy: botId,
      reward: reward || 10,
      priority: priority || 3,
      maxRetries: maxRetries || 3,
      retryCount: 0,
      paymentMethod: paymentMethod || 'ethereum',
      x402Payment: paymentMethod === 'x402' ? x402Payment : undefined
    };

    await dataStore.addTask(task);

    // Try to auto-assign to an available agent
    const assignedAgent = await TaskDispatcher.matchTaskToAgent(task);
    if (assignedAgent) {
      await TaskDispatcher.assignTask(task.id, assignedAgent.id);
    }

    return res.status(201).json({ 
      success: true,
      task: await dataStore.getTask(id),
      assigned: !!assignedAgent,
      assignedTo: assignedAgent?.name,
      message: 'Job created and advertised successfully',
      advertisedTo: assignedAgent ? [assignedAgent.name] : 'all available bots'
    });
  } else if (req.method === 'GET') {
    // Get all jobs created by bots
    const { botId } = req.query;
    
    const allTasks = await dataStore.getAllTasks();
    const botTasks = botId 
      ? allTasks.filter((task: any) => task.createdBy === botId)
      : allTasks;
    
    return res.status(200).json({ 
      tasks: botTasks,
      count: botTasks.length 
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
