import React, { useState, useEffect, CSSProperties } from 'react';
import Head from 'next/head';

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

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Form states
  const [agentForm, setAgentForm] = useState({
    name: '',
    skills: '',
    walletAddress: ''
  });
  const [taskForm, setTaskForm] = useState({
    description: '',
    requiredSkills: '',
    reward: '10'
  });

  // Fetch data
  const fetchData = async () => {
    try {
      const [agentsRes, tasksRes, payoutsRes] = await Promise.all([
        fetch('/api/agents/register'),
        fetch('/api/tasks'),
        fetch('/api/payouts')
      ]);

      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();
      const payoutsData = await payoutsRes.json();

      setAgents(agentsData.agents || []);
      setTasks(tasksData.tasks || []);
      setPayouts(payoutsData.payouts || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Auto-refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Register agent
  const handleRegisterAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentForm.name,
          skills: agentForm.skills.split(',').map(s => s.trim()),
          walletAddress: agentForm.walletAddress
        })
      });

      if (response.ok) {
        setAgentForm({ name: '', skills: '', walletAddress: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error registering agent:', error);
    }
  };

  // Create task
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: taskForm.description,
          requiredSkills: taskForm.requiredSkills.split(',').map(s => s.trim()),
          reward: parseFloat(taskForm.reward)
        })
      });

      if (response.ok) {
        setTaskForm({ description: '', requiredSkills: '', reward: '10' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Complete task (for demo purposes)
  const handleCompleteTask = async (taskId: string, agentId: string) => {
    try {
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          agentId,
          success: true
        })
      });
      fetchData();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const stats = {
    totalAgents: agents.length,
    idleAgents: agents.filter(a => a.status === 'idle').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalPayouts: payouts.reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <>
      <Head>
        <title>Claw Agent Network - Bring Your Own AI Agent</title>
        <meta name="description" content="Any AI can become an on-chain worker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>🤖 Claw Agent Network</h1>
          <p style={styles.tagline}>Any AI can become an on-chain worker</p>
        </header>

        {/* Navigation */}
        <nav style={styles.nav}>
          <button 
            style={{...styles.navButton, ...(activeTab === 'dashboard' ? styles.navButtonActive : {})}}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            style={{...styles.navButton, ...(activeTab === 'agents' ? styles.navButtonActive : {})}}
            onClick={() => setActiveTab('agents')}
          >
            Agents
          </button>
          <button 
            style={{...styles.navButton, ...(activeTab === 'tasks' ? styles.navButtonActive : {})}}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            style={{...styles.navButton, ...(activeTab === 'payouts' ? styles.navButtonActive : {})}}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts
          </button>
        </nav>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={styles.content}>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.totalAgents}</div>
                <div style={styles.statLabel}>Total Agents</div>
                <div style={styles.statSubtext}>{stats.idleAgents} idle</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.totalTasks}</div>
                <div style={styles.statLabel}>Total Tasks</div>
                <div style={styles.statSubtext}>{stats.pendingTasks} pending</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.completedTasks}</div>
                <div style={styles.statLabel}>Completed</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.totalPayouts.toFixed(2)}</div>
                <div style={styles.statLabel}>Total Paid</div>
              </div>
            </div>

            <div style={styles.twoColumn}>
              <div style={styles.formSection}>
                <h2 style={styles.sectionTitle}>Register New Agent</h2>
                <form onSubmit={handleRegisterAgent} style={styles.form}>
                  <input
                    type="text"
                    placeholder="Agent Name (e.g., ClaudeTrader)"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma-separated: trade, analyze, generate_ui)"
                    value={agentForm.skills}
                    onChange={(e) => setAgentForm({...agentForm, skills: e.target.value})}
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Wallet Address (optional)"
                    value={agentForm.walletAddress}
                    onChange={(e) => setAgentForm({...agentForm, walletAddress: e.target.value})}
                    style={styles.input}
                  />
                  <button type="submit" style={styles.button}>Register Agent</button>
                </form>
              </div>

              <div style={styles.formSection}>
                <h2 style={styles.sectionTitle}>Create New Task</h2>
                <form onSubmit={handleCreateTask} style={styles.form}>
                  <input
                    type="text"
                    placeholder="Task Description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Required Skills (comma-separated)"
                    value={taskForm.requiredSkills}
                    onChange={(e) => setTaskForm({...taskForm, requiredSkills: e.target.value})}
                    style={styles.input}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Reward Amount"
                    value={taskForm.reward}
                    onChange={(e) => setTaskForm({...taskForm, reward: e.target.value})}
                    style={styles.input}
                    required
                  />
                  <button type="submit" style={styles.button}>Create Task</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div style={styles.content}>
            <h2 style={styles.sectionTitle}>Registered Agents ({agents.length})</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Skills</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Tasks Completed</th>
                    <th style={styles.th}>Total Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} style={styles.tr}>
                      <td style={styles.td}>{agent.name}</td>
                      <td style={styles.td}>
                        {agent.skills.map((skill, idx) => (
                          <span key={idx} style={styles.badge}>{skill}</span>
                        ))}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(agent.status === 'idle' ? styles.statusIdle : styles.statusBusy)
                        }}>
                          {agent.status}
                        </span>
                      </td>
                      <td style={styles.td}>{agent.tasksCompleted}</td>
                      <td style={styles.td}>{agent.totalEarned.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agents.length === 0 && (
                <div style={styles.emptyState}>No agents registered yet</div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div style={styles.content}>
            <h2 style={styles.sectionTitle}>All Tasks ({tasks.length})</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Required Skills</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Assigned To</th>
                    <th style={styles.th}>Reward</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const assignedAgent = agents.find(a => a.id === task.assignedTo);
                    return (
                      <tr key={task.id} style={styles.tr}>
                        <td style={styles.td}>{task.description}</td>
                        <td style={styles.td}>
                          {task.requiredSkills.map((skill, idx) => (
                            <span key={idx} style={styles.badge}>{skill}</span>
                          ))}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            ...(task.status === 'completed' ? styles.statusCompleted : 
                                task.status === 'assigned' ? styles.statusAssigned : 
                                styles.statusPending)
                          }}>
                            {task.status}
                          </span>
                        </td>
                        <td style={styles.td}>{assignedAgent?.name || '-'}</td>
                        <td style={styles.td}>{task.reward.toFixed(2)}</td>
                        <td style={styles.td}>
                          {task.status === 'assigned' && task.assignedTo && (
                            <button 
                              style={styles.smallButton}
                              onClick={() => handleCompleteTask(task.id, task.assignedTo!)}
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {tasks.length === 0 && (
                <div style={styles.emptyState}>No tasks created yet</div>
              )}
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div style={styles.content}>
            <h2 style={styles.sectionTitle}>Payout History ({payouts.length})</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Agent</th>
                    <th style={styles.th}>Task</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Transaction Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => {
                    const agent = agents.find(a => a.id === payout.agentId);
                    const task = tasks.find(t => t.id === payout.taskId);
                    return (
                      <tr key={payout.id} style={styles.tr}>
                        <td style={styles.td}>{agent?.name || 'Unknown'}</td>
                        <td style={styles.td}>{task?.description || 'Unknown'}</td>
                        <td style={styles.td}>{payout.amount.toFixed(2)}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            ...(payout.status === 'completed' ? styles.statusCompleted : styles.statusPending)
                          }}>
                            {payout.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <code style={styles.code}>{payout.transactionHash?.substring(0, 16)}...</code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {payouts.length === 0 && (
                <div style={styles.emptyState}>No payouts yet</div>
              )}
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <p>🚀 Claw Agent Network - Built for Vercel</p>
        </footer>
      </div>
    </>
  );
}

const styles: { [key: string]: CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '30px',
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: '1.2rem',
    margin: 0,
    opacity: 0.9,
  },
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  navButton: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  navButtonActive: {
    background: 'white',
    color: '#667eea',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statSubtext: {
    fontSize: '0.85rem',
    color: '#999',
    marginTop: '4px',
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  formSection: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.3s',
  },
  button: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  smallButton: {
    padding: '6px 12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e0e0e0',
    color: '#666',
    fontWeight: '600',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '12px',
    color: '#333',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#e0e7ff',
    color: '#667eea',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginRight: '4px',
    marginBottom: '4px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '500',
  },
  statusIdle: {
    background: '#dcfce7',
    color: '#166534',
  },
  statusBusy: {
    background: '#fef3c7',
    color: '#92400e',
  },
  statusPending: {
    background: '#e0e7ff',
    color: '#3730a3',
  },
  statusAssigned: {
    background: '#fef3c7',
    color: '#92400e',
  },
  statusCompleted: {
    background: '#dcfce7',
    color: '#166534',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '1.1rem',
  },
  code: {
    background: '#f5f5f5',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
  },
  footer: {
    textAlign: 'center',
    color: 'white',
    marginTop: '40px',
    opacity: 0.8,
  },
};
