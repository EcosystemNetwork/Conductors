import { sql, initializeDatabase } from './db';

interface JobOffering {
  name: string;
  description: string;
  price: number;
  skills: string[];
}

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
  jobOfferings?: JobOffering[];
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

interface JobRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'open' | 'closed';
  createdAt: number;
  createdBy: string;
  bids: Array<{ agentId: string, amount: number, message: string, timestamp: number }>;
}

interface Submission {
  id: string;
  type: 'job' | 'swarm';
  source: 'dashboard' | 'planner' | 'bot-api';
  submittedAt: number;
  totalCost: number;
  taskIds: string[];
  agentIds: string[];
  status: 'submitted' | 'in-progress' | 'completed' | 'failed';
  taskCount: number;
  agentCount: number;
  description: string;
}

// Helper to convert a database row to an Agent object
function rowToAgent(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    skills: row.skills || [],
    status: row.status,
    registeredAt: Number(row.registered_at),
    tasksCompleted: row.tasks_completed,
    totalEarned: row.total_earned,
    walletAddress: row.wallet_address || undefined,
    lastHeartbeat: row.last_heartbeat ? Number(row.last_heartbeat) : undefined,
    health: row.health || undefined,
    costPerTask: row.cost_per_task || undefined,
    jobOfferings: row.job_offerings || undefined,
    capabilities: row.capabilities || undefined,
  };
}

// Helper to convert a database row to a Task object
function rowToTask(row: any): Task {
  return {
    id: row.id,
    description: row.description,
    requiredSkills: row.required_skills || [],
    status: row.status,
    assignedTo: row.assigned_to || undefined,
    createdAt: Number(row.created_at),
    completedAt: row.completed_at ? Number(row.completed_at) : undefined,
    reward: row.reward,
    priority: row.priority || undefined,
    retryCount: row.retry_count || undefined,
    maxRetries: row.max_retries || undefined,
    lastAttemptAt: row.last_attempt_at ? Number(row.last_attempt_at) : undefined,
    createdBy: row.created_by || undefined,
    paymentMethod: row.payment_method || undefined,
    paymentReceived: row.payment_received || undefined,
    x402Payment: row.x402_payment || undefined,
  };
}

// Helper to convert a database row to a Payout object
function rowToPayout(row: any): Payout {
  return {
    id: row.id,
    agentId: row.agent_id,
    taskId: row.task_id,
    amount: row.amount,
    timestamp: Number(row.timestamp),
    status: row.status,
    transactionHash: row.transaction_hash || undefined,
    paymentMethod: row.payment_method || undefined,
    chainId: row.chain_id || undefined,
    currency: row.currency || undefined,
  };
}

// Helper to convert a database row to a Submission object
function rowToSubmission(row: any): Submission {
  return {
    id: row.id,
    type: row.type,
    source: row.source,
    submittedAt: Number(row.submitted_at),
    totalCost: row.total_cost,
    taskIds: row.task_ids || [],
    agentIds: row.agent_ids || [],
    status: row.status,
    taskCount: row.task_count,
    agentCount: row.agent_count,
    description: row.description || '',
  };
}

// Helper to convert a database row to a JobRequest object
function rowToJobRequest(row: any): JobRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    budget: row.budget,
    status: row.status,
    createdAt: Number(row.created_at),
    createdBy: row.created_by,
    bids: row.bids || [],
  };
}

class DataStore {
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = initializeDatabase().catch((err) => {
        this.initPromise = null;
        throw err;
      });
    }
    return this.initPromise;
  }

  // Agent methods
  async addAgent(agent: Agent): Promise<void> {
    await this.ensureInitialized();
    await sql`
      INSERT INTO agents (id, name, skills, status, registered_at, tasks_completed, total_earned, wallet_address, last_heartbeat, health, cost_per_task, job_offerings, capabilities)
      VALUES (${agent.id}, ${agent.name}, ${agent.skills}, ${agent.status}, ${agent.registeredAt}, ${agent.tasksCompleted}, ${agent.totalEarned}, ${agent.walletAddress || null}, ${agent.lastHeartbeat || null}, ${agent.health || null}, ${agent.costPerTask || null}, ${agent.jobOfferings ? JSON.stringify(agent.jobOfferings) : null}::jsonb, ${agent.capabilities ? JSON.stringify(agent.capabilities) : null}::jsonb)
    `;
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM agents WHERE id = ${id}`;
    return rows.length > 0 ? rowToAgent(rows[0]) : undefined;
  }

  async getAllAgents(): Promise<Agent[]> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM agents`;
    return rows.map(rowToAgent);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    await this.ensureInitialized();
    const agent = await this.getAgent(id);
    if (!agent) return;
    const merged = { ...agent, ...updates };
    await sql`
      UPDATE agents SET
        name = ${merged.name},
        skills = ${merged.skills},
        status = ${merged.status},
        registered_at = ${merged.registeredAt},
        tasks_completed = ${merged.tasksCompleted},
        total_earned = ${merged.totalEarned},
        wallet_address = ${merged.walletAddress || null},
        last_heartbeat = ${merged.lastHeartbeat || null},
        health = ${merged.health || null},
        cost_per_task = ${merged.costPerTask || null},
        job_offerings = ${merged.jobOfferings ? JSON.stringify(merged.jobOfferings) : null}::jsonb,
        capabilities = ${merged.capabilities ? JSON.stringify(merged.capabilities) : null}::jsonb
      WHERE id = ${id}
    `;
  }

  // Task methods
  async addTask(task: Task): Promise<void> {
    await this.ensureInitialized();
    await sql`
      INSERT INTO tasks (id, description, required_skills, status, assigned_to, created_at, completed_at, reward, priority, retry_count, max_retries, last_attempt_at, created_by, payment_method, payment_received, x402_payment)
      VALUES (${task.id}, ${task.description}, ${task.requiredSkills}, ${task.status}, ${task.assignedTo || null}, ${task.createdAt}, ${task.completedAt || null}, ${task.reward}, ${task.priority || 3}, ${task.retryCount || 0}, ${task.maxRetries || 3}, ${task.lastAttemptAt || null}, ${task.createdBy || null}, ${task.paymentMethod || null}, ${task.paymentReceived || false}, ${task.x402Payment ? JSON.stringify(task.x402Payment) : null}::jsonb)
    `;
  }

  async getTask(id: string): Promise<Task | undefined> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM tasks WHERE id = ${id}`;
    return rows.length > 0 ? rowToTask(rows[0]) : undefined;
  }

  async getAllTasks(): Promise<Task[]> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM tasks`;
    return rows.map(rowToTask);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await this.ensureInitialized();
    const task = await this.getTask(id);
    if (!task) return;
    const merged = { ...task, ...updates };
    await sql`
      UPDATE tasks SET
        description = ${merged.description},
        required_skills = ${merged.requiredSkills},
        status = ${merged.status},
        assigned_to = ${merged.assignedTo || null},
        created_at = ${merged.createdAt},
        completed_at = ${merged.completedAt || null},
        reward = ${merged.reward},
        priority = ${merged.priority || 3},
        retry_count = ${merged.retryCount || 0},
        max_retries = ${merged.maxRetries || 3},
        last_attempt_at = ${merged.lastAttemptAt || null},
        created_by = ${merged.createdBy || null},
        payment_method = ${merged.paymentMethod || null},
        payment_received = ${merged.paymentReceived || false},
        x402_payment = ${merged.x402Payment ? JSON.stringify(merged.x402Payment) : null}::jsonb
      WHERE id = ${id}
    `;
  }

  // Payout methods
  async addPayout(payout: Payout): Promise<void> {
    await this.ensureInitialized();
    await sql`
      INSERT INTO payouts (id, agent_id, task_id, amount, timestamp, status, transaction_hash, payment_method, chain_id, currency)
      VALUES (${payout.id}, ${payout.agentId}, ${payout.taskId}, ${payout.amount}, ${payout.timestamp}, ${payout.status}, ${payout.transactionHash || null}, ${payout.paymentMethod || null}, ${payout.chainId || null}, ${payout.currency || null})
    `;
  }

  async getAllPayouts(): Promise<Payout[]> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM payouts`;
    return rows.map(rowToPayout);
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<void> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM payouts WHERE id = ${id}`;
    if (rows.length === 0) return;
    const payout = rowToPayout(rows[0]);
    const merged = { ...payout, ...updates };
    await sql`
      UPDATE payouts SET
        agent_id = ${merged.agentId},
        task_id = ${merged.taskId},
        amount = ${merged.amount},
        timestamp = ${merged.timestamp},
        status = ${merged.status},
        transaction_hash = ${merged.transactionHash || null},
        payment_method = ${merged.paymentMethod || null},
        chain_id = ${merged.chainId || null},
        currency = ${merged.currency || null}
      WHERE id = ${id}
    `;
  }

  // Task history methods
  async addToTaskHistory(task: Task): Promise<void> {
    await this.ensureInitialized();
    await sql`
      INSERT INTO task_history (id, description, required_skills, status, assigned_to, created_at, completed_at, reward, priority, retry_count, max_retries, last_attempt_at, created_by, payment_method, payment_received, x402_payment)
      VALUES (${task.id}, ${task.description}, ${task.requiredSkills}, ${task.status}, ${task.assignedTo || null}, ${task.createdAt}, ${task.completedAt || null}, ${task.reward}, ${task.priority || 3}, ${task.retryCount || 0}, ${task.maxRetries || 3}, ${task.lastAttemptAt || null}, ${task.createdBy || null}, ${task.paymentMethod || null}, ${task.paymentReceived || false}, ${task.x402Payment ? JSON.stringify(task.x402Payment) : null}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        assigned_to = EXCLUDED.assigned_to,
        completed_at = EXCLUDED.completed_at,
        retry_count = EXCLUDED.retry_count,
        last_attempt_at = EXCLUDED.last_attempt_at,
        payment_received = EXCLUDED.payment_received
    `;
  }

  async getTaskHistory(): Promise<Task[]> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM task_history ORDER BY COALESCE(completed_at, created_at) DESC`;
    return rows.map(rowToTask);
  }

  // Health monitoring methods
  async updateAgentHeartbeat(agentId: string): Promise<void> {
    await this.ensureInitialized();
    const now = Date.now();
    await sql`
      UPDATE agents SET last_heartbeat = ${now}, health = 'healthy'
      WHERE id = ${agentId}
    `;
  }

  async checkAgentHealth(): Promise<void> {
    await this.ensureInitialized();
    const now = Date.now();
    const healthTimeout = 30000; // 30 seconds
    const degradedTimeout = 15000; // 15 seconds

    // Set unhealthy + offline for agents past healthTimeout
    await sql`
      UPDATE agents SET health = 'unhealthy', status = 'offline'
      WHERE last_heartbeat IS NOT NULL
        AND ${now} - last_heartbeat > ${healthTimeout}
        AND (health != 'unhealthy' OR status != 'offline')
    `;

    // Set degraded for agents past degradedTimeout but within healthTimeout
    await sql`
      UPDATE agents SET health = 'degraded'
      WHERE last_heartbeat IS NOT NULL
        AND ${now} - last_heartbeat > ${degradedTimeout}
        AND ${now} - last_heartbeat <= ${healthTimeout}
        AND health != 'degraded'
    `;
  }

  // Task retry methods
  async incrementTaskRetry(taskId: string): Promise<boolean> {
    await this.ensureInitialized();
    const task = await this.getTask(taskId);
    if (!task) return false;

    const retryCount = (task.retryCount || 0) + 1;
    const maxRetries = task.maxRetries || 3;

    if (retryCount > maxRetries) {
      await this.updateTask(taskId, {
        status: 'failed',
        retryCount,
        lastAttemptAt: Date.now()
      });
      return false;
    }

    await this.updateTask(taskId, {
      status: 'pending',
      assignedTo: undefined,
      retryCount,
      lastAttemptAt: Date.now()
    });
    return true;
  }

  // Submission history methods
  async addSubmission(submission: Submission): Promise<void> {
    await this.ensureInitialized();
    await sql`
      INSERT INTO submissions (id, type, source, submitted_at, total_cost, task_ids, agent_ids, status, task_count, agent_count, description)
      VALUES (${submission.id}, ${submission.type}, ${submission.source}, ${submission.submittedAt}, ${submission.totalCost}, ${submission.taskIds}, ${submission.agentIds}, ${submission.status}, ${submission.taskCount}, ${submission.agentCount}, ${submission.description})
    `;
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM submissions WHERE id = ${id}`;
    return rows.length > 0 ? rowToSubmission(rows[0]) : undefined;
  }

  async getAllSubmissions(): Promise<Submission[]> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM submissions ORDER BY submitted_at DESC`;
    return rows.map(rowToSubmission);
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<void> {
    await this.ensureInitialized();
    const submission = await this.getSubmission(id);
    if (!submission) return;
    const merged = { ...submission, ...updates };
    await sql`
      UPDATE submissions SET
        type = ${merged.type},
        source = ${merged.source},
        submitted_at = ${merged.submittedAt},
        total_cost = ${merged.totalCost},
        task_ids = ${merged.taskIds},
        agent_ids = ${merged.agentIds},
        status = ${merged.status},
        task_count = ${merged.taskCount},
        agent_count = ${merged.agentCount},
        description = ${merged.description}
      WHERE id = ${id}
    `;
  }

  // Job Request methods
  async addJobRequest(request: JobRequest): Promise<void> {
    await this.ensureInitialized();
    await sql`
      INSERT INTO job_requests (id, title, description, budget, status, created_at, created_by, bids)
      VALUES (${request.id}, ${request.title}, ${request.description}, ${request.budget}, ${request.status}, ${request.createdAt}, ${request.createdBy}, ${JSON.stringify(request.bids)}::jsonb)
    `;
  }

  async getAllJobRequests(): Promise<JobRequest[]> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM job_requests ORDER BY created_at DESC`;
    return rows.map(rowToJobRequest);
  }

  async getJobRequest(id: string): Promise<JobRequest | undefined> {
    await this.ensureInitialized();
    const rows = await sql`SELECT * FROM job_requests WHERE id = ${id}`;
    return rows.length > 0 ? rowToJobRequest(rows[0]) : undefined;
  }

  async addBidToRequest(requestId: string, bid: { agentId: string, amount: number, message: string, timestamp: number }): Promise<void> {
    await this.ensureInitialized();
    const request = await this.getJobRequest(requestId);
    if (!request) return;
    const newBids = [...request.bids, bid];
    await sql`
      UPDATE job_requests SET bids = ${JSON.stringify(newBids)}::jsonb WHERE id = ${requestId}
    `;
  }
}

// Singleton instance - persists across API routes
const globalForDataStore = globalThis as unknown as { dataStore_v2: DataStore };

export const dataStore = globalForDataStore.dataStore_v2 || new DataStore();

globalForDataStore.dataStore_v2 = dataStore;
