interface Agent {
  id: string;
  name: string;
  skills: string[];
  status: 'idle' | 'busy' | 'offline';
  registeredAt: number;
  tasksCompleted: number;
  totalEarned: number;
  walletAddress?: string;
  lastHeartbeat?: number;
  health?: 'healthy' | 'degraded' | 'unhealthy';
  costPerTask?: number;
  capabilities?: {
    maxConcurrentTasks?: number;
    supportedPaymentMethods?: ('ethereum' | 'x402')[];
    description?: string;
  };
}

interface Task {
  id: string;
  description: string;
  requiredSkills: string[];
  status: 'pending' | 'assigned' | 'completed' | 'failed';
  assignedTo?: string;
  createdAt: number;
  completedAt?: number;
  reward: number;
  priority?: number; // 1 (highest) to 5 (lowest), default 3
  retryCount?: number;
  maxRetries?: number;
  lastAttemptAt?: number;
  createdBy?: string; // Bot ID that created this task
  paymentMethod?: 'ethereum' | 'x402';
  paymentReceived?: boolean;
  x402Payment?: {
    chainId: number;
    amount: string;
    currency: string;
  };
}

interface Payout {
  id: string;
  agentId: string;
  taskId: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed';
  transactionHash?: string;
  paymentMethod?: 'ethereum' | 'x402';
  chainId?: number;
  currency?: string;
}

class DataStore {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private payouts: Map<string, Payout> = new Map();
  private taskHistory: Map<string, Task> = new Map();

  // Agent methods
  addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  updateAgent(id: string, updates: Partial<Agent>): void {
    const agent = this.agents.get(id);
    if (agent) {
      this.agents.set(id, { ...agent, ...updates });
    }
  }

  // Task methods
  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const task = this.tasks.get(id);
    if (task) {
      this.tasks.set(id, { ...task, ...updates });
    }
  }

  // Payout methods
  addPayout(payout: Payout): void {
    this.payouts.set(payout.id, payout);
  }

  getAllPayouts(): Payout[] {
    return Array.from(this.payouts.values());
  }

  updatePayout(id: string, updates: Partial<Payout>): void {
    const payout = this.payouts.get(id);
    if (payout) {
      this.payouts.set(id, { ...payout, ...updates });
    }
  }

  // Task history methods
  addToTaskHistory(task: Task): void {
    this.taskHistory.set(task.id, { ...task });
  }

  getTaskHistory(): Task[] {
    return Array.from(this.taskHistory.values()).sort((a, b) => 
      (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt)
    );
  }

  // Health monitoring methods
  updateAgentHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      const now = Date.now();
      this.agents.set(agentId, { 
        ...agent, 
        lastHeartbeat: now,
        health: 'healthy'
      });
    }
  }

  checkAgentHealth(): void {
    const now = Date.now();
    const healthTimeout = 30000; // 30 seconds
    const degradedTimeout = 15000; // 15 seconds

    this.agents.forEach((agent, id) => {
      if (!agent.lastHeartbeat) return;
      
      const timeSinceHeartbeat = now - agent.lastHeartbeat;
      let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let status = agent.status;

      if (timeSinceHeartbeat > healthTimeout) {
        health = 'unhealthy';
        status = 'offline';
      } else if (timeSinceHeartbeat > degradedTimeout) {
        health = 'degraded';
      }

      if (health !== agent.health || status !== agent.status) {
        this.agents.set(id, { ...agent, health, status });
      }
    });
  }

  // Task retry methods
  incrementTaskRetry(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const retryCount = (task.retryCount || 0) + 1;
    const maxRetries = task.maxRetries || 3;

    if (retryCount > maxRetries) {
      this.updateTask(taskId, { 
        status: 'failed', 
        retryCount,
        lastAttemptAt: Date.now()
      });
      return false;
    }

    this.updateTask(taskId, { 
      status: 'pending', 
      assignedTo: undefined,
      retryCount,
      lastAttemptAt: Date.now()
    });
    return true;
  }
}

// Use a global variable to persist data across API routes in development
// In production (serverless), each invocation gets a fresh instance
const globalForDataStore = globalThis as unknown as { dataStore: DataStore };

export const dataStore = globalForDataStore.dataStore || new DataStore();

globalForDataStore.dataStore = dataStore;
