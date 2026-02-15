import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('[DB] DATABASE_URL not set - database operations will fail. Set DATABASE_URL in your environment.');
}

export const sql = neon(DATABASE_URL || '');

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        skills TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'idle',
        registered_at BIGINT NOT NULL,
        tasks_completed INTEGER NOT NULL DEFAULT 0,
        total_earned DOUBLE PRECISION NOT NULL DEFAULT 0,
        wallet_address TEXT,
        last_heartbeat BIGINT,
        health TEXT DEFAULT 'healthy',
        cost_per_task DOUBLE PRECISION,
        job_offerings JSONB,
        capabilities JSONB
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        required_skills TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending',
        assigned_to TEXT,
        created_at BIGINT NOT NULL,
        completed_at BIGINT,
        reward DOUBLE PRECISION NOT NULL DEFAULT 10,
        priority INTEGER DEFAULT 3,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_attempt_at BIGINT,
        created_by TEXT,
        payment_method TEXT,
        payment_received BOOLEAN DEFAULT false,
        x402_payment JSONB
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        timestamp BIGINT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        transaction_hash TEXT,
        payment_method TEXT,
        chain_id INTEGER,
        currency TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        required_skills TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL,
        assigned_to TEXT,
        created_at BIGINT NOT NULL,
        completed_at BIGINT,
        reward DOUBLE PRECISION NOT NULL DEFAULT 10,
        priority INTEGER DEFAULT 3,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_attempt_at BIGINT,
        created_by TEXT,
        payment_method TEXT,
        payment_received BOOLEAN DEFAULT false,
        x402_payment JSONB
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        submitted_at BIGINT NOT NULL,
        total_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
        task_ids TEXT[] NOT NULL DEFAULT '{}',
        agent_ids TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'submitted',
        task_count INTEGER NOT NULL DEFAULT 0,
        agent_count INTEGER NOT NULL DEFAULT 0,
        description TEXT DEFAULT ''
      )
    `;

    initialized = true;
    console.log('[DB] Database tables initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}
