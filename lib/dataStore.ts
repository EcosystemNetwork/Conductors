interface Agent {
  id: string;
  name: string;
  skills: string[];
  status: 'idle' | 'busy';
  registeredAt: number;
  tasksCompleted: number;
  totalEarned: number;
  walletAddress?: string;
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
}

interface Payout {
  id: string;
  agentId: string;
  taskId: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed';
  transactionHash?: string;
}

class DataStore {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private payouts: Map<string, Payout> = new Map();

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
}

// Use a global variable to persist data across API routes in development
// In production (serverless), each invocation gets a fresh instance
const globalForDataStore = globalThis as unknown as { dataStore: DataStore };

export const dataStore = globalForDataStore.dataStore || new DataStore();

globalForDataStore.dataStore = dataStore;
