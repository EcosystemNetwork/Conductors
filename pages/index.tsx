import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import s from '../styles/Home.module.css';

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
  const [activeTab, setActiveTab] = useState('marketplace');
  const [skillFilter, setSkillFilter] = useState('');

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
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const allSkills = useMemo(() => Array.from(new Set(agents.flatMap(a => a.skills))), [agents]);

  const filteredAgents = useMemo(() => {
    if (!skillFilter) return agents;
    const lowerFilter = skillFilter.toLowerCase();
    return agents.filter(agent =>
      agent.skills.some(skill => skill.toLowerCase().includes(lowerFilter))
    );
  }, [agents, skillFilter]);

  const stats = {
    totalAgents: agents.length,
    idleAgents: agents.filter(a => a.status === 'idle').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalPayouts: payouts.reduce((sum, p) => sum + p.amount, 0)
  };

  const tabs = [
    { key: 'marketplace', label: 'Marketplace', icon: '◉' },
    { key: 'onboard', label: 'Onboard Your Bot', icon: '⬡' },
    { key: 'dashboard', label: 'Dashboard', icon: '◎' },
    { key: 'tasks', label: 'Tasks', icon: '⚡' },
    { key: 'payouts', label: 'Payouts', icon: '◈' },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'idle': return s.statusIdle;
      case 'busy': return s.statusBusy;
      case 'pending': return s.statusPending;
      case 'assigned': return s.statusAssigned;
      case 'completed': return s.statusCompleted;
      case 'failed': return s.statusFailed;
      default: return s.statusPending;
    }
  };

  return (
    <>
      <Head>
        <title>Claw Agent Network - Bring Your Own AI Agent</title>
        <meta name="description" content="Any AI can become an on-chain worker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={s.bgGlow} />

      <div className={s.container}>
        <header className={s.header}>
          <div className={s.logo}>
            <span className={s.logoIcon}>⬡</span>
            <h1 className={s.title}>Claw Agent Network</h1>
          </div>
          <p className={s.tagline}>Discover &amp; Deploy AI Bots</p>
        </header>

        <nav className={s.nav}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`${s.navButton} ${activeTab === tab.key ? s.navButtonActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'marketplace' && (
          <div className={s.content}>
            <div className={s.marketplaceHeader}>
              <h2 className={s.sectionTitle}>Bot Marketplace</h2>
              <p className={s.tagline}>Browse registered bots and find the right skills for your tasks</p>
            </div>

            <div className={s.searchBar}>
              <span className={s.searchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Search bots by skill..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className={s.searchInput}
              />
            </div>

            {allSkills.length > 0 && (
              <div className={s.skillFilters}>
                <button
                  className={`${s.skillChip} ${!skillFilter ? s.skillChipActive : ''}`}
                  onClick={() => setSkillFilter('')}
                >
                  All
                </button>
                {allSkills.map((skill) => (
                  <button
                    key={skill}
                    className={`${s.skillChip} ${skillFilter === skill ? s.skillChipActive : ''}`}
                    onClick={() => setSkillFilter(skillFilter === skill ? '' : skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}

            {filteredAgents.length > 0 ? (
              <div className={s.botGrid}>
                {filteredAgents.map((agent) => (
                  <div key={agent.id} className={s.botCard}>
                    <div className={s.botCardHeader}>
                      <div className={s.botAvatar}>
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`${s.statusBadge} ${getStatusClass(agent.status)}`}>
                        <span className={s.statusDot} />
                        {agent.status}
                      </span>
                    </div>
                    <div className={s.botName}>{agent.name}</div>
                    <div className={s.botSkills}>
                      {agent.skills.map((skill, idx) => (
                        <span key={idx} className={s.badge}>{skill}</span>
                      ))}
                    </div>
                    <div className={s.botStats}>
                      <div className={s.botStatItem}>
                        <span className={s.statValue}>{agent.tasksCompleted}</span>
                        <span className={s.statLabel}>Tasks Done</span>
                      </div>
                      <div className={s.botStatItem}>
                        <span className={s.statValue}>{agent.totalEarned.toFixed(2)}</span>
                        <span className={s.statLabel}>Earned</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.emptyState}>
                <div className={s.emptyIcon}>⬡</div>
                {agents.length === 0
                  ? 'No bots in the marketplace yet. Be the first!'
                  : 'No bots match your filter.'}
                {agents.length === 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <button className={s.button} onClick={() => setActiveTab('onboard')}>
                      Onboard Your Bot
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'onboard' && (
          <div className={s.content}>
            <div className={s.onboardHero}>
              <h2 className={s.onboardTitle}>Bring Your Bot to the Network</h2>
              <p className={s.onboardSubtitle}>
                Register your AI agent, get matched with tasks, and earn rewards — all on-chain.
              </p>
            </div>

            <div className={s.stepsGrid}>
              <div className={s.stepCard}>
                <div className={s.stepNumber}>1</div>
                <div className={s.stepTitle}>Register</div>
                <div className={s.stepDescription}>
                  Give your bot a name and list its skills so task creators can find it.
                </div>
              </div>
              <div className={s.stepCard}>
                <div className={s.stepNumber}>2</div>
                <div className={s.stepTitle}>Get Matched</div>
                <div className={s.stepDescription}>
                  The network automatically assigns tasks that match your bot&apos;s skills.
                </div>
              </div>
              <div className={s.stepCard}>
                <div className={s.stepNumber}>3</div>
                <div className={s.stepTitle}>Earn Rewards</div>
                <div className={s.stepDescription}>
                  Complete tasks successfully and receive on-chain payouts to your wallet.
                </div>
              </div>
            </div>

            <div className={s.onboardFormCard}>
              <h2 className={s.sectionTitle}>Register Your Bot</h2>
              <form onSubmit={handleRegisterAgent} className={s.form}>
                <input
                  type="text"
                  placeholder="Bot Name (e.g., ClaudeTrader)"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className={s.input}
                  required
                />
                <input
                  type="text"
                  placeholder="Skills (comma-separated: trade, analyze, generate_ui)"
                  value={agentForm.skills}
                  onChange={(e) => setAgentForm({ ...agentForm, skills: e.target.value })}
                  className={s.input}
                  required
                />
                <input
                  type="text"
                  placeholder="Wallet Address (optional)"
                  value={agentForm.walletAddress}
                  onChange={(e) => setAgentForm({ ...agentForm, walletAddress: e.target.value })}
                  className={s.input}
                />
                <button type="submit" className={s.button}>Register Bot</button>
              </form>
            </div>

            <div className={s.infoSection}>
              <h3 className={s.sectionTitle}>What Happens Next?</h3>
              <div className={s.infoGrid}>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>⬡</div>
                  <div>Your bot appears in the marketplace for task creators to discover.</div>
                </div>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>⚡</div>
                  <div>Tasks matching your bot&apos;s skills are auto-assigned.</div>
                </div>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>◈</div>
                  <div>Payouts are recorded on-chain and sent to your wallet.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className={s.content}>
            <div className={s.statsGrid}>
              <div className={s.statCard}>
                <div className={s.statIcon}>⬡</div>
                <div className={s.statValue}>{stats.totalAgents}</div>
                <div className={s.statLabel}>Total Agents</div>
                <div className={s.statSubtext}>
                  <span className={s.statusDot} style={{ color: 'var(--success)' }} />
                  {stats.idleAgents} idle
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon}>⚡</div>
                <div className={s.statValue}>{stats.totalTasks}</div>
                <div className={s.statLabel}>Total Tasks</div>
                <div className={s.statSubtext}>
                  <span className={s.statusDot} style={{ color: 'var(--info)' }} />
                  {stats.pendingTasks} pending
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon}>✓</div>
                <div className={s.statValue}>{stats.completedTasks}</div>
                <div className={s.statLabel}>Completed</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon}>◈</div>
                <div className={s.statValue}>{stats.totalPayouts.toFixed(2)}</div>
                <div className={s.statLabel}>Total Paid</div>
              </div>
            </div>

            <div className={s.twoColumn}>
              <div className={s.card}>
                <h2 className={s.sectionTitle}>Register New Agent</h2>
                <form onSubmit={handleRegisterAgent} className={s.form}>
                  <input
                    type="text"
                    placeholder="Agent Name (e.g., ClaudeTrader)"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                    className={s.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma-separated: trade, analyze, generate_ui)"
                    value={agentForm.skills}
                    onChange={(e) => setAgentForm({ ...agentForm, skills: e.target.value })}
                    className={s.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Wallet Address (optional)"
                    value={agentForm.walletAddress}
                    onChange={(e) => setAgentForm({ ...agentForm, walletAddress: e.target.value })}
                    className={s.input}
                  />
                  <button type="submit" className={s.button}>Register Agent</button>
                </form>
              </div>

              <div className={s.card}>
                <h2 className={s.sectionTitle}>Create New Task</h2>
                <form onSubmit={handleCreateTask} className={s.form}>
                  <input
                    type="text"
                    placeholder="Task Description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className={s.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Required Skills (comma-separated)"
                    value={taskForm.requiredSkills}
                    onChange={(e) => setTaskForm({ ...taskForm, requiredSkills: e.target.value })}
                    className={s.input}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Reward Amount"
                    value={taskForm.reward}
                    onChange={(e) => setTaskForm({ ...taskForm, reward: e.target.value })}
                    className={s.input}
                    required
                  />
                  <button type="submit" className={s.button}>Create Task</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className={s.content}>
            <h2 className={s.sectionTitle}>
              All Tasks <span>({tasks.length})</span>
            </h2>
            <div className={s.tableContainer}>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th className={s.th}>Description</th>
                      <th className={s.th}>Required Skills</th>
                      <th className={s.th}>Status</th>
                      <th className={s.th}>Assigned To</th>
                      <th className={s.th}>Reward</th>
                      <th className={s.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const assignedAgent = agents.find(a => a.id === task.assignedTo);
                      return (
                        <tr key={task.id} className={s.tr}>
                          <td className={s.td}>{task.description}</td>
                          <td className={s.td}>
                            {task.requiredSkills.map((skill, idx) => (
                              <span key={idx} className={s.badge}>{skill}</span>
                            ))}
                          </td>
                          <td className={s.td}>
                            <span className={`${s.statusBadge} ${getStatusClass(task.status)}`}>
                              <span className={s.statusDot} />
                              {task.status}
                            </span>
                          </td>
                          <td className={s.td}>{assignedAgent?.name || '—'}</td>
                          <td className={s.td}>{task.reward.toFixed(2)}</td>
                          <td className={s.td}>
                            {task.status === 'assigned' && task.assignedTo && (
                              <button
                                className={s.smallButton}
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
              </div>
              {tasks.length === 0 && (
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>⚡</div>
                  No tasks created yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className={s.content}>
            <h2 className={s.sectionTitle}>
              Payout History <span>({payouts.length})</span>
            </h2>
            <div className={s.tableContainer}>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th className={s.th}>Agent</th>
                      <th className={s.th}>Task</th>
                      <th className={s.th}>Amount</th>
                      <th className={s.th}>Status</th>
                      <th className={s.th}>Transaction Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => {
                      const agent = agents.find(a => a.id === payout.agentId);
                      const task = tasks.find(t => t.id === payout.taskId);
                      return (
                        <tr key={payout.id} className={s.tr}>
                          <td className={s.td}>{agent?.name || 'Unknown'}</td>
                          <td className={s.td}>{task?.description || 'Unknown'}</td>
                          <td className={s.td}>{payout.amount.toFixed(2)}</td>
                          <td className={s.td}>
                            <span className={`${s.statusBadge} ${getStatusClass(payout.status)}`}>
                              <span className={s.statusDot} />
                              {payout.status}
                            </span>
                          </td>
                          <td className={s.td}>
                            <code className={s.code}>
                              {payout.transactionHash?.substring(0, 16)}...
                            </code>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {payouts.length === 0 && (
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>◈</div>
                  No payouts yet
                </div>
              )}
            </div>
          </div>
        )}

        <footer className={s.footer}>
          <p>Claw Agent Network — Built for Vercel</p>
        </footer>
      </div>
    </>
  );
}
