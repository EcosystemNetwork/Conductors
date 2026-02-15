import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '../lib/thirdweb';
import { ethereum } from 'thirdweb/chains';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import s from '../styles/Home.module.css';

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
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  lastAttemptAt?: number;
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

interface AgentNodeData {
  label: string;
  skills: string[];
  costPerTask: number;
}

interface TaskNodeData {
  label: string;
  description: string;
  requiredSkills: string[];
  estimatedCost: number;
}

type NodeData = AgentNodeData | TaskNodeData;

const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'agentNode',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Trading Agent',
      skills: ['trade', 'analyze'],
      costPerTask: 10
    },
  },
  {
    id: '2',
    type: 'agentNode',
    position: { x: 100, y: 250 },
    data: { 
      label: 'UI Generator',
      skills: ['generate_ui', 'design'],
      costPerTask: 15
    },
  },
  {
    id: '3',
    type: 'taskNode',
    position: { x: 450, y: 150 },
    data: { 
      label: 'Analyze Market',
      description: 'Analyze BTC market trends',
      requiredSkills: ['trade', 'analyze'],
      estimatedCost: 10
    },
  },
];

const initialEdges: Edge[] = [];

// Custom Agent Node Component
const AgentNode = ({ data }: { data: AgentNodeData }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      padding: '16px',
      borderRadius: '8px',
      minWidth: '200px',
      color: 'white',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{data.label}</span>
      </div>
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {data.skills.map((skill, idx) => (
            <span key={idx} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500'
            }}>{skill}</span>
          ))}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>💰 ${data.costPerTask}/task</div>
      </div>
    </div>
  );
};

// Custom Task Node Component
const TaskNode = ({ data }: { data: TaskNodeData }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      padding: '16px',
      borderRadius: '8px',
      minWidth: '200px',
      color: 'white',
      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>⚡</span>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{data.label}</span>
      </div>
      <div>
        <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.9 }}>{data.description}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {data.requiredSkills.map((skill, idx) => (
            <span key={idx} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500'
            }}>{skill}</span>
          ))}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>Est. ${data.estimatedCost}</div>
      </div>
    </div>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
  taskNode: TaskNode,
};

export default function Home() {
  const router = useRouter();
  const account = useActiveAccount();
  const address = account?.address;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
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
    reward: '10',
    priority: '3',
    maxRetries: '3'
  });

  // Swarm Planner state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(4);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [plannerAgentForm, setPlannerAgentForm] = useState({
    name: '',
    skills: '',
    cost: '10'
  });
  const [plannerTaskForm, setPlannerTaskForm] = useState({
    name: '',
    description: '',
    skills: '',
    cost: '10'
  });

  const fetchData = async () => {
    try {
      const [agentsRes, tasksRes, payoutsRes, historyRes] = await Promise.all([
        fetch('/api/agents/register'),
        fetch('/api/tasks'),
        fetch('/api/payouts'),
        fetch('/api/tasks/history')
      ]);

      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();
      const payoutsData = await payoutsRes.json();
      const historyData = await historyRes.json();

      setAgents(agentsData.agents || []);
      setTasks(tasksData.tasks || []);
      setPayouts(payoutsData.payouts || []);
      setTaskHistory(historyData.history || []);
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
          reward: parseFloat(taskForm.reward),
          priority: parseInt(taskForm.priority),
          maxRetries: parseInt(taskForm.maxRetries)
        })
      });

      if (response.ok) {
        setTaskForm({ description: '', requiredSkills: '', reward: '10', priority: '3', maxRetries: '3' });
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

  // Swarm Planner callbacks
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addPlannerAgentNode = useCallback(() => {
    if (!plannerAgentForm.name || !plannerAgentForm.skills) {
      alert('Please fill in agent name and skills');
      return;
    }

    const newNode: Node<AgentNodeData> = {
      id: `${nodeIdCounter}`,
      type: 'agentNode',
      position: { x: Math.random() * 300 + 50, y: Math.random() * 300 + 50 },
      data: {
        label: plannerAgentForm.name,
        skills: plannerAgentForm.skills.split(',').map(s => s.trim()),
        costPerTask: parseFloat(plannerAgentForm.cost),
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter(nodeIdCounter + 1);
    setPlannerAgentForm({ name: '', skills: '', cost: '10' });
    setShowAddAgent(false);
  }, [nodeIdCounter, plannerAgentForm, setNodes]);

  const addPlannerTaskNode = useCallback(() => {
    if (!plannerTaskForm.name || !plannerTaskForm.description || !plannerTaskForm.skills) {
      alert('Please fill in all task fields');
      return;
    }

    const newNode: Node<TaskNodeData> = {
      id: `${nodeIdCounter}`,
      type: 'taskNode',
      position: { x: Math.random() * 300 + 400, y: Math.random() * 300 + 50 },
      data: {
        label: plannerTaskForm.name,
        description: plannerTaskForm.description,
        requiredSkills: plannerTaskForm.skills.split(',').map(s => s.trim()),
        estimatedCost: parseFloat(plannerTaskForm.cost),
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter(nodeIdCounter + 1);
    setPlannerTaskForm({ name: '', description: '', skills: '', cost: '10' });
    setShowAddTask(false);
  }, [nodeIdCounter, plannerTaskForm, setNodes]);

  const totalPlannerCost = useMemo(() => {
    let total = 0;
    edges.forEach(edge => {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (targetNode && targetNode.type === 'taskNode') {
        const taskData = targetNode.data as TaskNodeData;
        total += taskData.estimatedCost;
      }
    });
    return total;
  }, [edges, nodes]);

  const connectedTasks = useMemo(() => {
    return edges.length;
  }, [edges]);

  const handlePlannerPurchase = () => {
    if (edges.length === 0) {
      alert('Please connect at least one agent to a task before purchasing');
      return;
    }
    
    const confirmed = window.confirm(
      `You are about to purchase ${connectedTasks} task assignment(s) for a total of $${totalPlannerCost.toFixed(2)}. Continue?`
    );
    
    if (confirmed) {
      alert(`Purchase successful! Your swarm tasks have been queued.`);
      // Reset the planner
      setNodes(initialNodes);
      setEdges(initialEdges);
      setNodeIdCounter(4);
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
    busyAgents: agents.filter(a => a.status === 'busy').length,
    offlineAgents: agents.filter(a => a.status === 'offline').length,
    healthyAgents: agents.filter(a => a.health === 'healthy').length,
    degradedAgents: agents.filter(a => a.health === 'degraded').length,
    unhealthyAgents: agents.filter(a => a.health === 'unhealthy').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    assignedTasks: tasks.filter(t => t.status === 'assigned').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    failedTasks: tasks.filter(t => t.status === 'failed').length,
    highPriorityTasks: tasks.filter(t => (t.priority || 3) <= 2).length,
    totalPayouts: payouts.reduce((sum, p) => sum + p.amount, 0),
    taskHistoryTotal: taskHistory.length
  };

  const tabs = [
    { key: 'marketplace', label: 'Marketplace', icon: '◉' },
    { key: 'planner', label: 'Swarm Planner', icon: '🎯' },
    { key: 'onboard', label: 'Onboard Your Bot', icon: '⬡' },
    { key: 'dashboard', label: 'Dashboard', icon: '◎' },
    { key: 'tasks', label: 'Tasks', icon: '⚡' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'payouts', label: 'Payouts', icon: '◈' },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'idle': return s.statusIdle;
      case 'busy': return s.statusBusy;
      case 'offline': return s.statusOffline;
      case 'pending': return s.statusPending;
      case 'assigned': return s.statusAssigned;
      case 'completed': return s.statusCompleted;
      case 'failed': return s.statusFailed;
      default: return s.statusPending;
    }
  };

  const getHealthBadge = (health?: string) => {
    if (!health) return null;
    const healthColors = {
      healthy: '🟢',
      degraded: '🟡',
      unhealthy: '🔴'
    };
    return healthColors[health as keyof typeof healthColors] || '';
  };

  const getPriorityLabel = (priority?: number) => {
    if (!priority) return 'Medium';
    if (priority <= 2) return 'High';
    if (priority >= 4) return 'Low';
    return 'Medium';
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority) return '#f59e0b';
    if (priority <= 2) return '#ef4444';
    if (priority >= 4) return '#10b981';
    return '#f59e0b';
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      await fetch('/api/tasks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      fetchData();
    } catch (error) {
      console.error('Error retrying task:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Claw Agent Network - Bring Your Own AI Agent</title>
        <meta name="description" content="Any AI can become an on-chain worker" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <div className={s.bgGlow} />

      <div className={s.container}>
        <header className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.logo}>
              <img className={s.logoImage} src="/ConductorLogo.png" alt="Conductor logo" />
              <h1 className={s.title}>Conductor Agent Network</h1>
            </div>
            <p className={s.tagline}>Discover &amp; Deploy AI Bots</p>
          </div>
          <div className={s.headerRight}>
            <ConnectButton 
              client={client}
              chain={ethereum}
              theme="dark"
              connectButton={{
                label: "Connect Wallet",
                style: {
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  boxShadow: 'var(--shadow-glow)',
                }
              }}
              connectModal={{
                title: "Connect your wallet",
                size: "wide",
              }}
            />
          </div>
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
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {agent.health && (
                          <span title={`Health: ${agent.health}`} style={{ fontSize: '12px' }}>
                            {getHealthBadge(agent.health)}
                          </span>
                        )}
                        <span className={`${s.statusBadge} ${getStatusClass(agent.status)}`}>
                          <span className={s.statusDot} />
                          {agent.status}
                        </span>
                      </div>
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
                  {stats.idleAgents} idle, {stats.busyAgents} busy, {stats.offlineAgents} offline
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon}>🏥</div>
                <div className={s.statValue}>{stats.healthyAgents}</div>
                <div className={s.statLabel}>Healthy Agents</div>
                <div className={s.statSubtext}>
                  🟡 {stats.degradedAgents} degraded, 🔴 {stats.unhealthyAgents} unhealthy
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon}>⚡</div>
                <div className={s.statValue}>{stats.totalTasks}</div>
                <div className={s.statLabel}>Total Tasks</div>
                <div className={s.statSubtext}>
                  <span className={s.statusDot} style={{ color: 'var(--info)' }} />
                  {stats.pendingTasks} pending, {stats.assignedTasks} assigned
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon}>🔥</div>
                <div className={s.statValue}>{stats.highPriorityTasks}</div>
                <div className={s.statLabel}>High Priority</div>
                <div className={s.statSubtext}>
                  Tasks requiring immediate attention
                </div>
              </div>
              <div className={s.statCard}>
                <div className={s.statIcon}>✓</div>
                <div className={s.statValue}>{stats.completedTasks}</div>
                <div className={s.statLabel}>Completed</div>
                <div className={s.statSubtext}>
                  ❌ {stats.failedTasks} failed
                </div>
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
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                        Priority (1=High, 5=Low)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        placeholder="Priority"
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className={s.input}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                        Max Retries
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Max Retries"
                        value={taskForm.maxRetries}
                        onChange={(e) => setTaskForm({ ...taskForm, maxRetries: e.target.value })}
                        className={s.input}
                        required
                      />
                    </div>
                  </div>
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
                      <th className={s.th}>Skills</th>
                      <th className={s.th}>Priority</th>
                      <th className={s.th}>Status</th>
                      <th className={s.th}>Assigned To</th>
                      <th className={s.th}>Reward</th>
                      <th className={s.th}>Retries</th>
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
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              backgroundColor: getPriorityColor(task.priority) + '20',
                              color: getPriorityColor(task.priority),
                              fontWeight: 'bold'
                            }}>
                              {getPriorityLabel(task.priority)}
                            </span>
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
                            {task.retryCount !== undefined ? `${task.retryCount}/${task.maxRetries || 3}` : '—'}
                          </td>
                          <td className={s.td}>
                            {task.status === 'assigned' && task.assignedTo && (
                              <button
                                className={s.smallButton}
                                onClick={() => handleCompleteTask(task.id, task.assignedTo!)}
                              >
                                Complete
                              </button>
                            )}
                            {task.status === 'failed' && (task.retryCount || 0) < (task.maxRetries || 3) && (
                              <button
                                className={s.smallButton}
                                onClick={() => handleRetryTask(task.id)}
                                style={{ backgroundColor: 'var(--warning)' }}
                              >
                                Retry
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

        {activeTab === 'planner' && (
          <div className={s.content}>
            <div className={s.plannerHeader} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              padding: '20px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div>
                <h2 className={s.sectionTitle}>Swarm Task Planner</h2>
                <p className={s.tagline}>Design and visualize your agent-task workflows</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Cost:</span>
                  <span style={{ 
                    color: 'var(--accent)',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}>${totalPlannerCost.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handlePlannerPurchase}
                  disabled={edges.length === 0}
                  style={{
                    background: edges.length === 0 
                      ? 'var(--bg-secondary)' 
                      : 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: edges.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition)',
                    boxShadow: edges.length === 0 ? 'none' : 'var(--shadow-glow)',
                    opacity: edges.length === 0 ? 0.5 : 1,
                  }}
                >
                  Purchase ({connectedTasks} task{connectedTasks !== 1 ? 's' : ''})
                </button>
              </div>
            </div>

            <div style={{
              height: '600px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.type === 'agentNode') return '#6366f1';
                    if (node.type === 'taskNode') return '#22c55e';
                    return '#94a3b8';
                  }}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                  }}
                />
                <Panel position="top-left">
                  <div style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    gap: '8px',
                  }}>
                    <button 
                      onClick={() => setShowAddAgent(!showAddAgent)}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      + Add Agent
                    </button>
                    <button 
                      onClick={() => setShowAddTask(!showAddTask)}
                      style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      + Add Task
                    </button>
                  </div>
                  
                  {showAddAgent && (
                    <div style={{
                      marginTop: '12px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      minWidth: '250px',
                    }}>
                      <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1rem' }}>Add Agent Node</h3>
                      <input
                        type="text"
                        placeholder="Agent Name"
                        value={plannerAgentForm.name}
                        onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Skills (comma-separated)"
                        value={plannerAgentForm.skills}
                        onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, skills: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Cost per task"
                        value={plannerAgentForm.cost}
                        onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, cost: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '12px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={addPlannerAgentNode}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                            color: 'white',
                            border: 'none',
                            padding: '8px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => setShowAddAgent(false)}
                          style={{
                            flex: 1,
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '8px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {showAddTask && (
                    <div style={{
                      marginTop: '12px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      minWidth: '250px',
                    }}>
                      <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1rem' }}>Add Task Node</h3>
                      <input
                        type="text"
                        placeholder="Task Name"
                        value={plannerTaskForm.name}
                        onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={plannerTaskForm.description}
                        onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Required Skills (comma-separated)"
                        value={plannerTaskForm.skills}
                        onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, skills: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Estimated Cost"
                        value={plannerTaskForm.cost}
                        onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, cost: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '12px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={addPlannerTaskNode}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                            color: 'white',
                            border: 'none',
                            padding: '8px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => setShowAddTask(false)}
                          style={{
                            flex: 1,
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '8px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </Panel>

                <Panel position="bottom-right">
                  <div style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ 
                          width: '16px',
                          height: '16px',
                          background: '#6366f1',
                          borderRadius: '3px',
                        }}></div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Agent</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ 
                          width: '16px',
                          height: '16px',
                          background: '#22c55e',
                          borderRadius: '3px',
                        }}></div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Task</span>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '8px',
                    }}>
                      💡 Drag to connect agents to tasks
                    </div>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={s.content}>
            <h2 className={s.sectionTitle}>
              Task History <span>({taskHistory.length})</span>
            </h2>
            <div className={s.tableContainer}>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th className={s.th}>Description</th>
                      <th className={s.th}>Priority</th>
                      <th className={s.th}>Status</th>
                      <th className={s.th}>Agent</th>
                      <th className={s.th}>Reward</th>
                      <th className={s.th}>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskHistory.map((task) => {
                      const assignedAgent = agents.find(a => a.id === task.assignedTo);
                      return (
                        <tr key={task.id} className={s.tr}>
                          <td className={s.td}>{task.description}</td>
                          <td className={s.td}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              backgroundColor: getPriorityColor(task.priority) + '20',
                              color: getPriorityColor(task.priority),
                              fontWeight: 'bold'
                            }}>
                              {getPriorityLabel(task.priority)}
                            </span>
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
                            {task.completedAt ? new Date(task.completedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {taskHistory.length === 0 && (
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>📋</div>
                  No task history yet
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
