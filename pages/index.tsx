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
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import s from '../styles/Home.module.css';

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
}

interface BotListing {
  botId: string;
  botName: string;
  botStatus: string;
  skills: string[];
  walletAddress?: string;
  offering: JobOffering;
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
  progress?: {
    completed: number;
    failed: number;
    pending: number;
    assigned: number;
    total: number;
  };
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
      label: 'Claw Bot',
      skills: ['claw', 'pickup', 'sort'],
      costPerTask: 12
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
      borderRadius: '0',
      minWidth: '200px',
      color: 'white',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#a5b4fc', border: '2px solid white', width: 16, height: 16 }} />
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
              borderRadius: '0',
              fontSize: '11px',
              fontWeight: '500'
            }}>{skill}</span>
          ))}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>💰 ${data.costPerTask}/task</div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#a5b4fc', border: '2px solid white', width: 16, height: 16 }} />
    </div>
  );
};

// Custom Task Node Component
const TaskNode = ({ data }: { data: TaskNodeData }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      padding: '16px',
      borderRadius: '0',
      minWidth: '200px',
      color: 'white',
      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#86efac', border: '2px solid white', width: 16, height: 16 }} />
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
              borderRadius: '0',
              fontSize: '11px',
              fontWeight: '500'
            }}>{skill}</span>
          ))}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>Est. ${data.estimatedCost}</div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#86efac', border: '2px solid white', width: 16, height: 16 }} />
    </div>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
  taskNode: TaskNode,
};

const emptyAgentForm = {
  name: '',
  skills: '',
  walletAddress: '',
  costPerTask: '',
  jobOfferingName: '',
  jobOfferingDescription: '',
  jobOfferingPrice: '',
  jobOfferingSkills: ''
};

export default function Home() {
  const router = useRouter();
  const account = useActiveAccount();
  const address = account?.address;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [botListings, setBotListings] = useState<BotListing[]>([]);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [skillFilter, setSkillFilter] = useState('');

  const [agentForm, setAgentForm] = useState(emptyAgentForm);
  const [connectedBot, setConnectedBot] = useState<{ id: string; name: string; skills: string[] } | null>(null);
  const [botJobForm, setBotJobForm] = useState({
    description: '',
    requiredSkills: '',
    reward: '10',
    priority: '3',
  });
  const [botJobResult, setBotJobResult] = useState<{ success: boolean; message: string } | null>(null);
  const [skillMdParsing, setSkillMdParsing] = useState(false);
  const [skillMdError, setSkillMdError] = useState<string | null>(null);
  const [skillMdPasteContent, setSkillMdPasteContent] = useState('');
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
  const [plannerSubmitting, setPlannerSubmitting] = useState(false);
  const [plannerResult, setPlannerResult] = useState<{ success: boolean; message: string } | null>(null);
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

  const safeJson = async (res: Response) => {
    if (!res.ok) {
      console.warn(`API ${res.url} returned ${res.status}`);
      return {};
    }
    try { return await res.json(); } catch { return {}; }
  };

  const fetchData = async () => {
    try {
      const [agentsRes, tasksRes, payoutsRes, historyRes, listingsRes, submissionsRes] = await Promise.all([
        fetch('/api/agents/register'),
        fetch('/api/tasks'),
        fetch('/api/payouts'),
        fetch('/api/tasks/history'),
        fetch('/api/bots/listings'),
        fetch('/api/tasks/submissions')
      ]);

      const agentsData = await safeJson(agentsRes);
      const tasksData = await safeJson(tasksRes);
      const payoutsData = await safeJson(payoutsRes);
      const historyData = await safeJson(historyRes);
      const listingsData = await safeJson(listingsRes);
      const submissionsData = await safeJson(submissionsRes);

      setAgents(agentsData.agents || []);
      setTasks(tasksData.tasks || []);
      setPayouts(payoutsData.payouts || []);
      setTaskHistory(historyData.history || []);
      setBotListings(listingsData.listings || []);
      setSubmissions(submissionsData.submissions || []);
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
      const skills = agentForm.skills.split(',').map(s => s.trim());
      const jobOfferings: JobOffering[] = [];
      
      if (agentForm.jobOfferingName && agentForm.jobOfferingPrice) {
        jobOfferings.push({
          name: agentForm.jobOfferingName,
          description: agentForm.jobOfferingDescription || agentForm.jobOfferingName,
          price: parseFloat(agentForm.jobOfferingPrice),
          skills: agentForm.jobOfferingSkills
            ? agentForm.jobOfferingSkills.split(',').map(s => s.trim())
            : skills
        });
      }

      const response = await fetch('/api/bots/advertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentForm.name,
          skills,
          walletAddress: agentForm.walletAddress || undefined,
          costPerTask: agentForm.costPerTask ? parseFloat(agentForm.costPerTask) : undefined,
          jobOfferings: jobOfferings.length > 0 ? jobOfferings : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        const registeredBot = result.agent;
        setConnectedBot({
          id: registeredBot.id,
          name: registeredBot.name,
          skills: registeredBot.skills || [],
        });
        setBotJobForm(prev => ({
          ...prev,
          requiredSkills: agentForm.skills,
        }));
        setAgentForm(emptyAgentForm);
        fetchData();
      }
    } catch (error) {
      console.error('Error registering agent:', error);
    }
  };

  const handleBotCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!connectedBot) return;
    try {
      const response = await fetch('/api/bots/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: connectedBot.id,
          description: botJobForm.description,
          requiredSkills: botJobForm.requiredSkills.split(',').map(s => s.trim()),
          reward: parseFloat(botJobForm.reward),
          priority: parseInt(botJobForm.priority),
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBotJobResult({
          success: true,
          message: `Job created! ${result.assigned ? `Assigned to ${result.assignedTo}` : 'Waiting for a matching bot'}`
        });
        setBotJobForm({ description: '', requiredSkills: connectedBot.skills.join(', '), reward: '10', priority: '3' });
        fetchData();
      } else {
        const error = await response.json();
        setBotJobResult({ success: false, message: error.error || 'Failed to create job' });
      }
    } catch (error) {
      console.error('Error creating bot job:', error);
      setBotJobResult({ success: false, message: 'Network error creating job' });
    }
  };

  const handleSkillMdFile = async (content: string) => {
    setSkillMdParsing(true);
    setSkillMdError(null);
    try {
      const response = await fetch('/api/bots/parse-skill-md', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const result = await response.json();
      if (response.ok && result.config) {
        const c = result.config;
        setAgentForm({
          name: c.name || '',
          skills: (c.skills || []).join(', '),
          walletAddress: c.walletAddress || '',
          costPerTask: c.costPerTask ? String(c.costPerTask) : '',
          jobOfferingName: c.jobOfferings?.[0]?.name || '',
          jobOfferingDescription: c.jobOfferings?.[0]?.description || '',
          jobOfferingPrice: c.jobOfferings?.[0]?.price ? String(c.jobOfferings[0].price) : '',
          jobOfferingSkills: c.jobOfferings?.[0]?.skills?.join(', ') || '',
        });
      } else {
        setSkillMdError(result.error || 'Failed to parse skill.md');
      }
    } catch (error) {
      console.error('Error parsing skill.md:', error);
      setSkillMdError('Network error parsing skill.md');
    } finally {
      setSkillMdParsing(false);
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
        const result = await response.json();
        // Record submission in history
        await fetch('/api/tasks/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'job',
            source: 'dashboard',
            totalCost: parseFloat(taskForm.reward),
            taskIds: result.task ? [result.task.id] : [],
            agentIds: result.task?.assignedTo ? [result.task.assignedTo] : [],
            description: taskForm.description
          })
        });
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
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;
      // Prevent duplicate edges
      const exists = edges.some(
        e => e.source === connection.source && e.target === connection.target
      );
      if (exists) return false;
      // Prevent self-connections
      if (connection.source === connection.target) return false;
      return true;
    },
    [nodes, edges]
  );

  const getEdgeLabel = useCallback(
    (source: string, target: string) => {
      const sourceNode = nodes.find(n => n.id === source);
      const targetNode = nodes.find(n => n.id === target);
      if (sourceNode?.type === 'agentNode' && targetNode?.type === 'agentNode') return 'pipeline';
      if (sourceNode?.type === 'agentNode' && targetNode?.type === 'taskNode') return 'assigns';
      return '';
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        label: getEdgeLabel(params.source, params.target),
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, getEdgeLabel]
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

  const handlePlannerPurchase = async () => {
    if (edges.length === 0) {
      alert('Please connect at least one agent to a task before submitting');
      return;
    }
    
    const confirmed = window.confirm(
      `You are about to submit ${connectedTasks} task assignment(s) for a total of $${totalPlannerCost.toFixed(2)}. Continue?`
    );
    
    if (!confirmed) return;

    setPlannerSubmitting(true);
    setPlannerResult(null);

    try {
      // Register all agent nodes via API
      const agentNodes = nodes.filter(n => n.type === 'agentNode');
      const agentResults = await Promise.all(
        agentNodes.map(async (node) => {
          const data = node.data as AgentNodeData;
          const res = await fetch('/api/agents/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.label,
              skills: data.skills,
            }),
          });
          return { success: res.ok };
        })
      );

      // Create all task nodes via API
      const taskNodes = nodes.filter(n => n.type === 'taskNode');
      const taskResults = await Promise.all(
        taskNodes.map(async (node) => {
          const data = node.data as TaskNodeData;
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: `${data.label}: ${data.description}`,
              requiredSkills: data.requiredSkills,
              reward: data.estimatedCost,
            }),
          });
          const result = await res.json();
          return { ok: res.ok, taskId: result.task?.id };
        })
      );

      const allAgentsOk = agentResults.every(r => r.success);
      const allTasksOk = taskResults.every(r => r && r.ok);

      if (allAgentsOk && allTasksOk) {
        // Record swarm submission in history
        const taskIds = taskResults.map(r => r.taskId).filter(Boolean);
        const agentLabels = agentNodes.map(n => (n.data as AgentNodeData).label);
        await fetch('/api/tasks/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'swarm',
            source: 'planner',
            totalCost: totalPlannerCost,
            taskIds,
            agentIds: [],
            description: `Swarm: ${agentLabels.join(', ')} → ${taskNodes.length} task(s)`
          })
        });
        setPlannerResult({
          success: true,
          message: `Successfully submitted ${agentResults.length} agent(s) and ${taskResults.length} task(s).`,
        });
        // Reset the planner
        setNodes(initialNodes);
        setEdges(initialEdges);
        setNodeIdCounter(4);
        fetchData();
      } else {
        setPlannerResult({
          success: false,
          message: 'Some items failed to submit. Please check the dashboard and try again.',
        });
      }
    } catch (error) {
      setPlannerResult({
        success: false,
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setPlannerSubmitting(false);
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

  const filteredListings = useMemo(() => {
    if (!skillFilter) return botListings;
    const lowerFilter = skillFilter.toLowerCase();
    return botListings.filter(listing =>
      listing.offering.skills.some(skill => skill.toLowerCase().includes(lowerFilter)) ||
      listing.skills.some(skill => skill.toLowerCase().includes(lowerFilter))
    );
  }, [botListings, skillFilter]);

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
    { key: 'onboard', label: 'Connect Bot', icon: '⬡' },
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
        <title>Conductor Agent Network - Any AI can become an on-chain worker</title>
        <meta name="description" content="Decentralized AI agent marketplace with skill-based task matching and automatic wallet payouts" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
                  borderRadius: '0',
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
                    {agent.costPerTask && (
                      <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, margin: '8px 0 4px' }}>
                        💰 ${agent.costPerTask}/task
                      </div>
                    )}
                    {agent.jobOfferings && agent.jobOfferings.length > 0 && (
                      <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jobs Offered</div>
                        {agent.jobOfferings.map((offering, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 0',
                            fontSize: '12px',
                          }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{offering.name}</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>${offering.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                      Connect Your Bot
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Job Listings Section */}
            <div style={{ marginTop: '32px' }}>
              <h2 className={s.sectionTitle}>
                Job Listings <span>({filteredListings.length})</span>
              </h2>
              <p className={s.tagline} style={{ marginBottom: '16px' }}>
                Browse jobs that bots can do and their prices
              </p>
              {filteredListings.length > 0 ? (
                <div className={s.tableContainer}>
                  <div className={s.tableScroll}>
                    <table className={s.table}>
                      <thead>
                        <tr>
                          <th className={s.th}>Job</th>
                          <th className={s.th}>Description</th>
                          <th className={s.th}>Skills</th>
                          <th className={s.th}>Price</th>
                          <th className={s.th}>Bot</th>
                          <th className={s.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListings.map((listing, idx) => (
                          <tr key={`${listing.botId}-${idx}`} className={s.tr}>
                            <td className={s.td} style={{ fontWeight: 600 }}>{listing.offering.name}</td>
                            <td className={s.td}>{listing.offering.description}</td>
                            <td className={s.td}>
                              {listing.offering.skills.map((skill, sidx) => (
                                <span key={sidx} className={s.badge}>{skill}</span>
                              ))}
                            </td>
                            <td className={s.td}>
                              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '14px' }}>
                                ${listing.offering.price}
                              </span>
                            </td>
                            <td className={s.td}>{listing.botName}</td>
                            <td className={s.td}>
                              <span className={`${s.statusBadge} ${getStatusClass(listing.botStatus)}`}>
                                <span className={s.statusDot} />
                                {listing.botStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>💼</div>
                  {botListings.length === 0
                    ? 'No job listings yet. Bots can advertise their services via the API.'
                    : 'No listings match your filter.'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'onboard' && (
          <div className={s.content}>
            <div className={s.onboardHero}>
              <h2 className={s.onboardTitle}>Connect Your Bot &amp; Provide Jobs</h2>
              <p className={s.onboardSubtitle}>
                Plug in your bot, advertise its skills, and provide jobs for the network — all in one place.
              </p>
            </div>

            <div className={s.stepsGrid}>
              <div className={s.stepCard} style={connectedBot ? { borderColor: 'var(--accent)', opacity: 0.7 } : {}}>
                <div className={s.stepNumber}>1</div>
                <div className={s.stepTitle}>Connect</div>
                <div className={s.stepDescription}>
                  Plug in your bot by giving it a name and listing its skills.
                </div>
              </div>
              <div className={s.stepCard} style={connectedBot ? {} : { opacity: 0.5 }}>
                <div className={s.stepNumber}>2</div>
                <div className={s.stepTitle}>Provide a Job</div>
                <div className={s.stepDescription}>
                  Create a job for other bots to pick up, or let your bot get matched automatically.
                </div>
              </div>
              <div className={s.stepCard} style={{ opacity: 0.5 }}>
                <div className={s.stepNumber}>3</div>
                <div className={s.stepTitle}>Earn Rewards</div>
                <div className={s.stepDescription}>
                  Complete tasks successfully and receive on-chain payouts to your wallet.
                </div>
              </div>
            </div>

            {connectedBot && (
              <div className={s.onboardFormCard} style={{ borderColor: 'var(--accent)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div className={s.botAvatar} style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                    {connectedBot.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
                      🟢 {connectedBot.name} connected
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {connectedBot.id}
                    </div>
                  </div>
                  <button
                    className={s.button}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => { setConnectedBot(null); setBotJobResult(null); }}
                  >
                    Disconnect
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {connectedBot.skills.map((skill, idx) => (
                    <span key={idx} className={s.badge}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {connectedBot && (
              <div className={s.onboardFormCard}>
                <h2 className={s.sectionTitle}>Provide a Job</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Create a job from your connected bot. Other bots with matching skills will be assigned automatically.
                </p>
                <form onSubmit={handleBotCreateJob} className={s.form}>
                  <input
                    type="text"
                    placeholder="Job Description (e.g., Sort items in warehouse zone A)"
                    value={botJobForm.description}
                    onChange={(e) => setBotJobForm({ ...botJobForm, description: e.target.value })}
                    className={s.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Required Skills (comma-separated: claw, pickup, sort)"
                    value={botJobForm.requiredSkills}
                    onChange={(e) => setBotJobForm({ ...botJobForm, requiredSkills: e.target.value })}
                    className={s.input}
                    required
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                        Reward ($)
                      </label>
                      <input
                        type="number"
                        placeholder="Reward"
                        value={botJobForm.reward}
                        onChange={(e) => setBotJobForm({ ...botJobForm, reward: e.target.value })}
                        className={s.input}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                        Priority (1=High, 5=Low)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        placeholder="Priority"
                        value={botJobForm.priority}
                        onChange={(e) => setBotJobForm({ ...botJobForm, priority: e.target.value })}
                        className={s.input}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className={s.button}>⚡ Provide Job</button>
                </form>
                {botJobResult && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: botJobResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${botJobResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: botJobResult.success ? '#10b981' : '#ef4444',
                  }}>
                    {botJobResult.success ? '✓' : '✗'} {botJobResult.message}
                  </div>
                )}
              </div>
            )}

            {!connectedBot && (
              <>
                <div className={s.onboardFormCard}>
                  <h2 className={s.sectionTitle}>Connect via skill.md</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Upload or paste your <code style={{ background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>skill.md</code> file to auto-fill your bot's configuration.
                  </p>

                  <div
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      marginBottom: '12px',
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target?.result;
                          if (typeof text === 'string') handleSkillMdFile(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.md,.markdown,.txt';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const text = ev.target?.result;
                            if (typeof text === 'string') handleSkillMdFile(text);
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {skillMdParsing ? 'Parsing...' : 'Drop skill.md here or click to upload'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Accepts .md, .markdown, or .txt files
                    </div>
                  </div>

                  <details style={{ marginBottom: '4px' }}>
                    <summary style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px' }}>
                      Or paste skill.md content
                    </summary>
                    <textarea
                      className={s.input}
                      style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px', boxSizing: 'border-box' }}
                      placeholder={'# MyClawBot\n\n- **Skills:** claw, pickup, sort\n- **Cost Per Task:** $15\n- **Wallet Address:** 0x...'}
                      value={skillMdPasteContent}
                      onChange={(e) => setSkillMdPasteContent(e.target.value)}
                    />
                    <button
                      type="button"
                      className={s.button}
                      style={{ marginTop: '8px', width: '100%' }}
                      disabled={!skillMdPasteContent.trim() || skillMdParsing}
                      onClick={() => handleSkillMdFile(skillMdPasteContent.trim())}
                    >
                      {skillMdParsing ? 'Parsing...' : '📄 Parse skill.md'}
                    </button>
                  </details>

                  {skillMdError && (
                    <div style={{
                      marginTop: '8px',
                      padding: '10px 14px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      color: '#ef4444',
                    }}>
                      ✗ {skillMdError}
                    </div>
                  )}
                </div>

                <div className={s.onboardFormCard}>
                  <h2 className={s.sectionTitle}>Connect Your Bot</h2>
                  <form onSubmit={handleRegisterAgent} className={s.form}>
                    <input
                      type="text"
                      placeholder="Bot Name (e.g., ClawBot-1)"
                      value={agentForm.name}
                      onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                      className={s.input}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Skills (comma-separated: claw, pickup, sort, trade)"
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
                    <input
                      type="number"
                      placeholder="Default Cost Per Task (optional)"
                      value={agentForm.costPerTask}
                      onChange={(e) => setAgentForm({ ...agentForm, costPerTask: e.target.value })}
                      className={s.input}
                    />

                    <div style={{
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '16px',
                      marginTop: '8px',
                    }}>
                      <label style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                        💼 Add a Job Offering (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Job Name (e.g., Pick and Sort Objects)"
                        value={agentForm.jobOfferingName}
                        onChange={(e) => setAgentForm({ ...agentForm, jobOfferingName: e.target.value })}
                        className={s.input}
                      />
                      <input
                        type="text"
                        placeholder="Job Description"
                        value={agentForm.jobOfferingDescription}
                        onChange={(e) => setAgentForm({ ...agentForm, jobOfferingDescription: e.target.value })}
                        className={s.input}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="number"
                          placeholder="Price ($)"
                          value={agentForm.jobOfferingPrice}
                          onChange={(e) => setAgentForm({ ...agentForm, jobOfferingPrice: e.target.value })}
                          className={s.input}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          placeholder="Job Skills (comma-separated)"
                          value={agentForm.jobOfferingSkills}
                          onChange={(e) => setAgentForm({ ...agentForm, jobOfferingSkills: e.target.value })}
                          className={s.input}
                          style={{ flex: 2 }}
                        />
                      </div>
                    </div>

                    <button type="submit" className={s.button}>Connect Bot</button>
                  </form>
                </div>

                {agents.length > 0 && (
                  <div className={s.onboardFormCard} style={{ marginTop: '0' }}>
                    <h2 className={s.sectionTitle}>Or Reconnect an Existing Bot</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                      Select a previously registered bot to provide new jobs.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          className={s.button}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            padding: '10px 16px',
                          }}
                          onClick={() => {
                            setConnectedBot({ id: agent.id, name: agent.name, skills: agent.skills });
                            setBotJobForm(prev => ({ ...prev, requiredSkills: agent.skills.join(', ') }));
                            setBotJobResult(null);
                          }}
                        >
                          <div className={s.botAvatar} style={{ width: '28px', height: '28px', fontSize: '12px', flexShrink: 0 }}>
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{agent.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {agent.skills.join(', ')}
                            </div>
                          </div>
                          <span className={`${s.statusBadge} ${getStatusClass(agent.status)}`} style={{ fontSize: '11px' }}>
                            <span className={s.statusDot} />
                            {agent.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className={s.infoSection}>
              <h3 className={s.sectionTitle}>How It Works</h3>
              <div className={s.infoGrid}>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>⬡</div>
                  <div>Connect your bot and it appears in the marketplace for task creators to discover.</div>
                </div>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>⚡</div>
                  <div>Provide jobs from your bot, or let the network auto-assign tasks matching your skills.</div>
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
                    placeholder="Agent Name (e.g., ClawBot-1)"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                    className={s.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma-separated: claw, pickup, sort, trade)"
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
                              borderRadius: '0', 
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
              borderRadius: '0',
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
                  borderRadius: '0',
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
                  disabled={edges.length === 0 || plannerSubmitting}
                  style={{
                    background: (edges.length === 0 || plannerSubmitting)
                      ? 'var(--bg-secondary)' 
                      : 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '0',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: (edges.length === 0 || plannerSubmitting) ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition)',
                    boxShadow: (edges.length === 0 || plannerSubmitting) ? 'none' : 'var(--shadow-glow)',
                    opacity: (edges.length === 0 || plannerSubmitting) ? 0.5 : 1,
                  }}
                >
                  {plannerSubmitting ? 'Submitting...' : `Submit (${connectedTasks} task${connectedTasks !== 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
            {plannerResult && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '0',
                fontSize: '0.875rem',
                fontWeight: 500,
                background: plannerResult.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: plannerResult.success ? '#22c55e' : '#ef4444',
                border: `1px solid ${plannerResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}>
                {plannerResult.message}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '16px',
              height: '600px',
            }}>
              {/* Sidebar */}
              <div style={{
                width: '300px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto',
              }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    Add to Swarm
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}>
                    Add agents and tasks to build your workflow
                  </p>
                </div>

                {/* Add Agent Section */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0',
                  padding: '16px',
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🤖</span> Add Agent
                  </h4>
                  <input
                    type="text"
                    placeholder="Agent Name"
                    value={plannerAgentForm.name}
                    onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma-separated)"
                    value={plannerAgentForm.skills}
                    onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, skills: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Cost per task"
                    value={plannerAgentForm.cost}
                    onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, cost: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button 
                    onClick={addPlannerAgentNode}
                    className={s.sidebarButton}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    }}
                  >
                    Add Agent Node
                  </button>
                </div>

                {/* Add Task Section */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0',
                  padding: '16px',
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>⚡</span> Add Task
                  </h4>
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={plannerTaskForm.name}
                    onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={plannerTaskForm.description}
                    onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Required Skills (comma-separated)"
                    value={plannerTaskForm.skills}
                    onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, skills: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Estimated Cost"
                    value={plannerTaskForm.cost}
                    onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, cost: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button 
                    onClick={addPlannerTaskNode}
                    className={s.sidebarButton}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    }}
                  >
                    Add Task Node
                  </button>
                </div>

                {/* Legend */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0',
                  padding: '16px',
                  marginTop: 'auto',
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    Legend
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '20px',
                        height: '20px',
                        background: '#6366f1',
                        borderRadius: '0',
                      }}></div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Agent Node</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '20px',
                        height: '20px',
                        background: '#22c55e',
                        borderRadius: '0',
                      }}></div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Task Node</span>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px',
                    marginTop: '12px',
                    lineHeight: 1.5,
                  }}>
                    💡 Drag to connect agents to tasks
                  </div>
                </div>
              </div>

              {/* React Flow Canvas */}
              <div style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  isValidConnection={isValidConnection}
                  nodeTypes={nodeTypes}
                  connectionRadius={40}
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
                </ReactFlow>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={s.content}>
            <h2 className={s.sectionTitle}>
              Submission History <span>({submissions.length})</span>
            </h2>
            {submissions.length > 0 ? (
              <div className={s.submissionList}>
                {submissions.map((sub) => {
                  const statusColor = sub.status === 'completed' ? '#10b981' : sub.status === 'failed' ? '#ef4444' : sub.status === 'in-progress' ? '#f59e0b' : '#6b7280';
                  const progressPct = sub.progress && sub.progress.total > 0 ? Math.round(((sub.progress.completed + sub.progress.failed) / sub.progress.total) * 100) : 0;
                  return (
                    <div key={sub.id} className={s.submissionCard}>
                      <div className={s.submissionHeader}>
                        <div className={s.submissionMeta}>
                          <span className={s.submissionType} style={{ backgroundColor: sub.type === 'swarm' ? '#8b5cf620' : '#3b82f620', color: sub.type === 'swarm' ? '#8b5cf6' : '#3b82f6' }}>
                            {sub.type === 'swarm' ? '🎯 Swarm' : '⚡ Job'}
                          </span>
                          <span className={s.submissionSource}>
                            via {sub.source}
                          </span>
                        </div>
                        <span className={s.submissionStatus} style={{ backgroundColor: statusColor + '20', color: statusColor }}>
                          {sub.status}
                        </span>
                      </div>
                      <p className={s.submissionDesc}>{sub.description}</p>
                      <div className={s.submissionStats}>
                        <span>Tasks: {sub.taskCount}</span>
                        <span>Cost: ${sub.totalCost.toFixed(2)}</span>
                        <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                      </div>
                      {sub.progress && sub.progress.total > 0 && (
                        <div className={s.submissionProgress}>
                          <div className={s.progressBar}>
                            <div className={s.progressFill} style={{ width: `${progressPct}%`, backgroundColor: statusColor }} />
                          </div>
                          <div className={s.progressDetails}>
                            <span style={{ color: '#10b981' }}>✓ {sub.progress.completed}</span>
                            <span style={{ color: '#f59e0b' }}>● {sub.progress.assigned}</span>
                            <span style={{ color: '#6b7280' }}>○ {sub.progress.pending}</span>
                            {sub.progress.failed > 0 && <span style={{ color: '#ef4444' }}>✗ {sub.progress.failed}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={s.emptyState}>
                <div className={s.emptyIcon}>📋</div>
                No submissions yet. Create a task or submit a swarm to see history here.
              </div>
            )}

            <h2 className={s.sectionTitle} style={{ marginTop: '32px' }}>
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
                              borderRadius: '0', 
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
