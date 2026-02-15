import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

/**
 * API endpoint for bots to purchase jobs using x402 protocol
 * POST /api/bots/purchase-job
 * 
 * This endpoint handles job purchases via x402 payment protocol
 * 
 * Body:
 * {
 *   botId: string,
 *   taskId: string,
 *   paymentMethod: 'x402' | 'ethereum',
 *   x402Payment?: {
 *     chainId: number,
 *     amount: string,
 *     currency: string,
 *     transactionHash?: string,
 *     paymentHeader?: string
 *   }
 * }
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { 
      botId, 
      taskId, 
      paymentMethod,
      x402Payment
    } = req.body;

    // Validate input
    if (!botId || !taskId) {
      return res.status(400).json({ 
        error: 'Bot ID and Task ID are required' 
      });
    }

    // Validate bot exists
    const bot = dataStore.getAgent(botId);
    if (!bot) {
      return res.status(404).json({ 
        error: 'Bot not found. Please register the bot first at /api/bots/advertise' 
      });
    }

    // Validate task exists
    const task = dataStore.getTask(taskId);
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check if task is available
    if (task.status !== 'pending') {
      return res.status(400).json({ 
        error: `Task is not available. Current status: ${task.status}` 
      });
    }

    // Validate payment method
    if (!paymentMethod || !['x402', 'ethereum'].includes(paymentMethod)) {
      return res.status(400).json({
        error: 'Payment method must be either "x402" or "ethereum"'
      });
    }

    // Handle x402 payment
    if (paymentMethod === 'x402') {
      if (!x402Payment) {
        return res.status(402).json({
          error: 'x402 payment details required',
          x402Version: 1,
          accepts: [{
            chainId: task.x402Payment?.chainId || 1,
            amount: task.x402Payment?.amount || task.reward.toString(),
            currency: task.x402Payment?.currency || 'ETH',
            description: `Payment for task: ${task.description}`,
            taskId: task.id
          }]
        });
      }

      // Validate x402 payment details
      if (!x402Payment.chainId || !x402Payment.amount || !x402Payment.currency) {
        return res.status(400).json({
          error: 'x402 payment requires chainId, amount, and currency'
        });
      }

      // In a real implementation, you would:
      // 1. Verify the payment header using x402 protocol
      // 2. Validate the payment amount matches the task reward
      // 3. Process the payment through the x402 facilitator
      // For now, we'll simulate successful payment validation

      // Create payment record
      const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const payout = {
        id: payoutId,
        agentId: botId,
        taskId: task.id,
        amount: parseFloat(x402Payment.amount),
        timestamp: Date.now(),
        status: 'completed' as const,
        transactionHash: x402Payment.transactionHash || `x402-${Date.now()}`,
        paymentMethod: 'x402',
        chainId: x402Payment.chainId,
        currency: x402Payment.currency
      };

      dataStore.addPayout(payout);

      // Assign task to bot
      const updatedTask = {
        ...task,
        status: 'assigned' as const,
        assignedTo: botId,
        paymentReceived: true,
        paymentMethod: 'x402'
      };
      
      dataStore.updateTask(taskId, updatedTask);

      // Update bot status
      const updatedBot = {
        ...bot,
        status: 'busy' as const,
        lastHeartbeat: Date.now()
      };
      dataStore.updateAgent(botId, updatedBot);

      return res.status(200).json({ 
        success: true,
        task: updatedTask,
        payout,
        message: 'Job purchased successfully using x402',
        paymentResponse: {
          transactionHash: payout.transactionHash,
          status: 'confirmed'
        }
      });
    } else {
      // Handle standard Ethereum payment
      // Assign task to bot (assuming payment will be handled on completion)
      const updatedTask = {
        ...task,
        status: 'assigned' as const,
        assignedTo: botId,
        paymentMethod: 'ethereum'
      };
      
      dataStore.updateTask(taskId, updatedTask);

      // Update bot status
      const updatedBot = {
        ...bot,
        status: 'busy' as const,
        lastHeartbeat: Date.now()
      };
      dataStore.updateAgent(botId, updatedBot);

      return res.status(200).json({ 
        success: true,
        task: updatedTask,
        message: 'Job purchased successfully. Payment will be processed on completion.',
        paymentInfo: {
          method: 'ethereum',
          walletAddress: bot.walletAddress,
          reward: task.reward
        }
      });
    }
  } else if (req.method === 'GET') {
    // Get purchase history for a bot
    const { botId } = req.query;
    
    if (!botId) {
      return res.status(400).json({ 
        error: 'Bot ID is required as query parameter' 
      });
    }

    const allPayouts = dataStore.getAllPayouts();
    const botPayouts = allPayouts.filter((payout: any) => payout.agentId === botId);

    return res.status(200).json({ 
      purchases: botPayouts,
      count: botPayouts.length,
      totalSpent: botPayouts.reduce((sum: number, p: any) => sum + p.amount, 0)
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
