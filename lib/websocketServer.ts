/**
 * WebSocket server for real-time communication with agents and clients
 * This module provides real-time updates for task assignments, completions,
 * and agent health monitoring
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { dataStore } from './dataStore';

interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'task_update' | 'agent_update' | 'heartbeat' | 'ping';
  data?: any;
  agentId?: string;
}

class RealtimeServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();
  private agentSubscriptions: Map<string, Set<WebSocket>> = new Map();

  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] New client connected');
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      ws.on('message', (message: string) => {
        try {
          const data: WSMessage = JSON.parse(message.toString());
          this.handleMessage(ws, clientId, data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.clients.delete(clientId);
        this.cleanupSubscriptions(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'connected',
        data: { clientId, timestamp: Date.now() }
      });
    });

    console.log('[WebSocket] Server initialized on /ws');
  }

  private handleMessage(ws: WebSocket, clientId: string, message: WSMessage) {
    switch (message.type) {
      case 'subscribe':
        if (message.agentId) {
          this.subscribeToAgent(ws, message.agentId);
          this.sendToClient(ws, {
            type: 'subscribed',
            data: { agentId: message.agentId }
          });
        }
        break;

      case 'unsubscribe':
        if (message.agentId) {
          this.unsubscribeFromAgent(ws, message.agentId);
          this.sendToClient(ws, {
            type: 'unsubscribed',
            data: { agentId: message.agentId }
          });
        }
        break;

      case 'heartbeat':
        if (message.agentId) {
          dataStore.updateAgentHeartbeat(message.agentId);
          this.broadcastAgentUpdate(message.agentId);
        }
        break;

      case 'ping':
        this.sendToClient(ws, { type: 'pong', data: { timestamp: Date.now() } });
        break;

      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  }

  private subscribeToAgent(ws: WebSocket, agentId: string) {
    if (!this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.set(agentId, new Set());
    }
    this.agentSubscriptions.get(agentId)!.add(ws);
  }

  private unsubscribeFromAgent(ws: WebSocket, agentId: string) {
    const subscribers = this.agentSubscriptions.get(agentId);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.agentSubscriptions.delete(agentId);
      }
    }
  }

  private cleanupSubscriptions(ws: WebSocket) {
    this.agentSubscriptions.forEach((subscribers, agentId) => {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.agentSubscriptions.delete(agentId);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast methods for real-time updates
  broadcastTaskUpdate(taskId: string) {
    const task = dataStore.getTask(taskId);
    if (!task) return;

    const message = {
      type: 'task_update',
      data: task
    };

    // Broadcast to all connected clients
    this.broadcast(message);

    // Broadcast to agent-specific subscribers
    if (task.assignedTo) {
      this.broadcastToAgent(task.assignedTo, message);
    }
  }

  broadcastAgentUpdate(agentId: string) {
    const agent = dataStore.getAgent(agentId);
    if (!agent) return;

    const message = {
      type: 'agent_update',
      data: agent
    };

    // Broadcast to all connected clients
    this.broadcast(message);

    // Broadcast to agent-specific subscribers
    this.broadcastToAgent(agentId, message);
  }

  broadcastTaskCreated(taskId: string) {
    const task = dataStore.getTask(taskId);
    if (!task) return;

    this.broadcast({
      type: 'task_created',
      data: task
    });
  }

  broadcastTaskCompleted(taskId: string) {
    const task = dataStore.getTask(taskId);
    if (!task) return;

    this.broadcast({
      type: 'task_completed',
      data: task
    });
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  private broadcastToAgent(agentId: string, message: any) {
    const subscribers = this.agentSubscriptions.get(agentId);
    if (!subscribers) return;

    const messageStr = JSON.stringify(message);
    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      agentSubscriptions: this.agentSubscriptions.size
    };
  }
}

// Singleton instance
export const realtimeServer = new RealtimeServer();
