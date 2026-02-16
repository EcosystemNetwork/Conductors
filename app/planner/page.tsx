'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import s from '@/styles/Home.module.css';

// Define Node Types & Data Interfaces
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

const AgentNode = ({ data }: { data: AgentNodeData }) => {
  return (
    <div style={{
      background: 'rgba(20, 10, 30, 0.95)',
      border: '1px solid rgba(147, 51, 234, 0.3)',
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      minWidth: '200px',
      color: 'var(--text-primary)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(147, 51, 234, 0.15)',
      backdropFilter: 'blur(10px)'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent)', border: '2px solid white', width: 12, height: 12 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <div style={{
          fontSize: '18px',
          background: 'var(--accent)',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%'
        }}>🤖</div>
        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{data.label}</span>
      </div>
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {(data.skills || []).map((skill, idx) => (
            <span key={idx} style={{
              background: 'rgba(147, 51, 234, 0.15)',
              border: '1px solid rgba(147, 51, 234, 0.3)',
              color: '#d8b4fe',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>{skill}</span>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Cost/Task</span>
          <span style={{ color: 'var(--accent-light)', fontWeight: '600' }}>${data.costPerTask}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent)', border: '2px solid white', width: 12, height: 12 }} />
    </div>
  );
};

const TaskNode = ({ data }: { data: TaskNodeData }) => {
  return (
    <div style={{
      background: 'rgba(19, 17, 26, 0.95)',
      border: '1px solid rgba(0, 191, 255, 0.3)',
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      minWidth: '220px',
      color: 'var(--text-primary)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(0, 191, 255, 0.15)',
      backdropFilter: 'blur(10px)'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--cyan)', border: '2px solid white', width: 12, height: 12 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid rgba(0, 191, 255, 0.2)', paddingBottom: '8px' }}>
        <div style={{
          fontSize: '18px',
          background: 'rgba(0, 191, 255, 0.2)',
          color: 'var(--cyan)',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '1px solid var(--cyan)'
        }}>⚡</div>
        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{data.label}</span>
      </div>
      <div>
        <div style={{ fontSize: '12px', marginBottom: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{data.description}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {(data.requiredSkills || []).map((skill, idx) => (
            <span key={idx} style={{
              background: 'rgba(0, 191, 255, 0.1)',
              border: '1px solid rgba(0, 191, 255, 0.2)',
              color: 'var(--cyan)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>{skill}</span>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Reward</span>
          <span style={{ color: 'var(--success)', fontWeight: '600' }}>${data.estimatedCost}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'var(--cyan)', border: '2px solid white', width: 12, height: 12 }} />
    </div>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
  taskNode: TaskNode,
};

const defiScenario = {
  nodes: [
    { id: '1', type: 'agentNode', position: { x: 50, y: 50 }, data: { label: 'Market Analyst', skills: ['analyze', 'price-feed'], costPerTask: 5 } },
    { id: '2', type: 'agentNode', position: { x: 50, y: 250 }, data: { label: 'Trade Executor', skills: ['trade', 'defi'], costPerTask: 12 } },
    { id: '3', type: 'agentNode', position: { x: 50, y: 450 }, data: { label: 'Risk Manager', skills: ['audit', 'risk'], costPerTask: 8 } },
    { id: '4', type: 'taskNode', position: { x: 400, y: 50 }, data: { label: 'Monitor ETH/USDC', description: 'Check price every 30s', requiredSkills: ['price-feed'], estimatedCost: 2 } },
    { id: '5', type: 'taskNode', position: { x: 400, y: 250 }, data: { label: 'Execute Swap', description: 'Buy if price > MA(200)', requiredSkills: ['trade'], estimatedCost: 15 } },
    { id: '6', type: 'taskNode', position: { x: 400, y: 450 }, data: { label: 'Validate Position', description: 'Ensure exposure < 10%', requiredSkills: ['risk'], estimatedCost: 5 } },
  ],
  edges: [
    { id: 'e1-4', source: '1', target: '4', animated: true, type: 'smoothstep' },
    { id: 'e2-5', source: '2', target: '5', animated: true, type: 'smoothstep' },
    { id: 'e3-6', source: '3', target: '6', animated: true, type: 'smoothstep' },
    { id: 'e4-5', source: '4', target: '5', animated: true, label: 'triggers', type: 'smoothstep' },
    { id: 'e5-6', source: '5', target: '6', animated: true, label: 'validates', type: 'smoothstep' },
  ],
};

export default function PlannerPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(4);
  const [plannerSubmitting, setPlannerSubmitting] = useState(false);
  const [plannerResult, setPlannerResult] = useState<{ success: boolean; message: string } | null>(null);
  const [plannerTab, setPlannerTab] = useState('build');
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
  const [submissions, setSubmissions] = useState<any[]>([]); // Need submission type or any

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

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;
      const exists = edges.some(
        e => e.source === connection.source && e.target === connection.target
      );
      if (exists) return false;
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

  const handleLoadTemplate = () => {
    if (confirm('Load DeFi Demo Scenario? This will replace your current design.')) {
      // @ts-ignore
      setNodes(defiScenario.nodes);
      // @ts-ignore
      setEdges(defiScenario.edges);
      setNodeIdCounter(10);
    }
  };

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
      // Register all agent nodes
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

      // Create all task nodes
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
        setNodes([]);
        setEdges([]);
        setNodeIdCounter(4);
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

  React.useEffect(() => {
    fetch('/api/tasks/submissions')
      .then(res => res.json())
      .then(data => {
        if (data.submissions) setSubmissions(data.submissions.filter((s: any) => s.type === 'swarm'));
      });
  }, []);

  return (
    <div className={s.container}>
      <main className={s.main}>
        <div className={s.grid}>
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleLoadTemplate}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid var(--accent)',
                    background: 'rgba(147, 51, 234, 0.1)',
                    color: 'var(--accent-light)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Load Demo
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all nodes?')) {
                      setNodes([]);
                      setEdges([]);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Clear
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
              gap: '0',
              height: '600px',
              border: '1px solid var(--border-color)',
            }}>
              {/* Sidebar */}
              <div style={{
                width: '320px',
                background: 'var(--bg-glass)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                {/* Sidebar Tabs */}
                <div style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  {['build', 'deploy', 'monitor'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPlannerTab(tab)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: plannerTab === tab ? 'rgba(147, 51, 234, 0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: plannerTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                        color: plannerTab === tab ? 'var(--accent-light)' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all var(--transition)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tab === 'build' && '🛠️ Build'}
                      {tab === 'deploy' && '🚀 Deploy'}
                      {tab === 'monitor' && '📊 Monitor'}
                    </button>
                  ))}
                </div>

                <div style={{
                  padding: '20px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}>
                  {plannerTab === 'build' && (
                    <>
                      <div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Add Agent to Swarm
                        </h3>
                        <input
                          type="text"
                          placeholder="Agent Name"
                          value={plannerAgentForm.name}
                          onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, name: e.target.value })}
                          className={s.input}
                          style={{ marginBottom: '10px' }}
                        />
                        <input
                          type="text"
                          placeholder="Skills (comma-separated)"
                          value={plannerAgentForm.skills}
                          onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, skills: e.target.value })}
                          className={s.input}
                          style={{ marginBottom: '10px' }}
                        />
                        <input
                          type="number"
                          placeholder="Cost per task"
                          value={plannerAgentForm.cost}
                          onChange={(e) => setPlannerAgentForm({ ...plannerAgentForm, cost: e.target.value })}
                          className={s.input}
                          style={{ marginBottom: '12px' }}
                        />
                        <button
                          onClick={addPlannerAgentNode}
                          className={s.sidebarButton}
                          style={{ background: 'var(--accent)' }}
                        >
                          Add Agent Node
                        </button>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Add Task to Swarm
                        </h3>
                        <input
                          type="text"
                          placeholder="Task Name"
                          value={plannerTaskForm.name}
                          onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, name: e.target.value })}
                          className={s.input}
                          style={{ marginBottom: '10px' }}
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={plannerTaskForm.description}
                          onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, description: e.target.value })}
                          className={s.input}
                          style={{ marginBottom: '10px' }}
                        />
                        <input
                          type="text"
                          placeholder="Required Skills"
                          value={plannerTaskForm.skills}
                          onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, skills: e.target.value })}
                          className={s.input}
                          style={{ marginBottom: '10px' }}
                        />
                        <input
                          type="number"
                          placeholder="Estimated Cost"
                          value={plannerTaskForm.cost}
                          onChange={(e) => setPlannerTaskForm({ ...plannerTaskForm, cost: e.target.value })}
                          className={s.input}
                          style={{ marginBottom: '12px' }}
                        />
                        <button
                          onClick={addPlannerTaskNode}
                          className={s.sidebarButton}
                          style={{ background: 'var(--cyan)' }}
                        >
                          Add Task Node
                        </button>
                      </div>

                      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Legend</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                            <div style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: '50%' }}></div> Agent
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                            <div style={{ width: 12, height: 12, background: 'var(--cyan)', borderRadius: '50%' }}></div> Task
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {plannerTab === 'deploy' && (
                    <>
                      <div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Swarm Overview
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-light)' }}>{nodes.filter(n => n.type === 'agentNode').length}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agents</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--cyan)' }}>{nodes.filter(n => n.type === 'taskNode').length}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tasks</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{edges.length}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Connections</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                              ${nodes.reduce((acc, n) => {
                                const cost = n.type === 'agentNode'
                                  ? (n.data as AgentNodeData).costPerTask
                                  : (n.data as TaskNodeData).estimatedCost;
                                return acc + (Number(cost) || 0);
                              }, 0).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Est. Cost</div>
                          </div>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(147, 51, 234, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(147, 51, 234, 0.2)', marginBottom: '20px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--accent-light)' }}>Ready to Deploy?</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Ensure all tasks are connected to capable agents. Submitting will launch the specialized swarm on the network.
                          </p>
                        </div>

                        <button
                          onClick={handlePlannerPurchase}
                          style={{
                            width: '100%',
                            background: (edges.length === 0 || plannerSubmitting)
                              ? 'var(--bg-secondary)'
                              : 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                            color: 'white',
                            border: 'none',
                            padding: '14px',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            cursor: (edges.length === 0 || plannerSubmitting) ? 'not-allowed' : 'pointer',
                            transition: 'all var(--transition)',
                            boxShadow: (edges.length === 0 || plannerSubmitting) ? 'none' : 'var(--shadow-glow)',
                            opacity: (edges.length === 0 || plannerSubmitting) ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          {plannerSubmitting ? 'Deploying...' : (
                            <>
                              <span>🚀</span> Launch Swarm
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {plannerTab === 'monitor' && (
                    <>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Active Swarms
                      </h3>
                      {submissions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>📊</div>
                          <div style={{ fontSize: '0.9rem' }}>No active swarms found</div>
                        </div>
                      ) : (
                        <div className={s.submissionList}>
                          {submissions.slice(0, 5).map((sub) => (
                            <div key={sub.id} className={s.submissionCard} style={{ padding: '12px' }}>
                              <div className={s.submissionHeader}>
                                <span className={s.submissionId}>#{sub.id.slice(0, 6)}</span>
                                <span className={`${s.statusBadge} ${s[sub.status]}`}>{sub.status}</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                {sub.description}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {new Date(sub.submittedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
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
                  <Background color="#333" gap={20} />
                  <Controls style={{ fill: 'white' }} />
                  <MiniMap
                    nodeColor={(node) => {
                      if (node.type === 'agentNode') return '#9333ea';
                      if (node.type === 'taskNode') return '#00bfff';
                      return '#94a3b8';
                    }}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                    maskColor="rgba(0, 0, 0, 0.6)"
                  />
                </ReactFlow>
                {/* End React Flow Canvas */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
