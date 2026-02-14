import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
import s from '../styles/Planner.module.css';

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
    <div className={s.agentNode}>
      <div className={s.nodeHeader}>
        <span className={s.nodeIcon}>🤖</span>
        <span className={s.nodeTitle}>{data.label}</span>
      </div>
      <div className={s.nodeBody}>
        <div className={s.skillTags}>
          {data.skills.map((skill, idx) => (
            <span key={idx} className={s.skillTag}>{skill}</span>
          ))}
        </div>
        <div className={s.nodeCost}>💰 ${data.costPerTask}/task</div>
      </div>
    </div>
  );
};

// Custom Task Node Component
const TaskNode = ({ data }: { data: TaskNodeData }) => {
  return (
    <div className={s.taskNode}>
      <div className={s.nodeHeader}>
        <span className={s.nodeIcon}>⚡</span>
        <span className={s.nodeTitle}>{data.label}</span>
      </div>
      <div className={s.nodeBody}>
        <div className={s.nodeDescription}>{data.description}</div>
        <div className={s.skillTags}>
          {data.requiredSkills.map((skill, idx) => (
            <span key={idx} className={s.skillTag}>{skill}</span>
          ))}
        </div>
        <div className={s.nodeCost}>Est. ${data.estimatedCost}</div>
      </div>
    </div>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
  taskNode: TaskNode,
};

export default function SwarmPlanner() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(4);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // Form states
  const [agentForm, setAgentForm] = useState({
    name: '',
    skills: '',
    cost: '10'
  });
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    skills: '',
    cost: '10'
  });

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

  const addAgentNode = useCallback(() => {
    if (!agentForm.name || !agentForm.skills) {
      alert('Please fill in agent name and skills');
      return;
    }

    const newNode: Node<AgentNodeData> = {
      id: `${nodeIdCounter}`,
      type: 'agentNode',
      position: { x: Math.random() * 300 + 50, y: Math.random() * 300 + 50 },
      data: {
        label: agentForm.name,
        skills: agentForm.skills.split(',').map(s => s.trim()),
        costPerTask: parseFloat(agentForm.cost),
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter(nodeIdCounter + 1);
    setAgentForm({ name: '', skills: '', cost: '10' });
    setShowAddAgent(false);
  }, [nodeIdCounter, agentForm, setNodes]);

  const addTaskNode = useCallback(() => {
    if (!taskForm.name || !taskForm.description || !taskForm.skills) {
      alert('Please fill in all task fields');
      return;
    }

    const newNode: Node<TaskNodeData> = {
      id: `${nodeIdCounter}`,
      type: 'taskNode',
      position: { x: Math.random() * 300 + 400, y: Math.random() * 300 + 50 },
      data: {
        label: taskForm.name,
        description: taskForm.description,
        requiredSkills: taskForm.skills.split(',').map(s => s.trim()),
        estimatedCost: parseFloat(taskForm.cost),
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter(nodeIdCounter + 1);
    setTaskForm({ name: '', description: '', skills: '', cost: '10' });
    setShowAddTask(false);
  }, [nodeIdCounter, taskForm, setNodes]);

  const totalCost = useMemo(() => {
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

  const handlePurchase = () => {
    if (edges.length === 0) {
      alert('Please connect at least one agent to a task before purchasing');
      return;
    }
    
    const confirmed = window.confirm(
      `You are about to purchase ${connectedTasks} task assignment(s) for a total of $${totalCost.toFixed(2)}. Continue?`
    );
    
    if (confirmed) {
      alert(`Purchase successful! Your swarm tasks have been queued. Redirecting to dashboard...`);
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Swarm Task Planner - Claw Agent Network</title>
        <meta name="description" content="Plan and manage swarm tasks" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={s.container}>
        <header className={s.header}>
          <div className={s.headerLeft}>
            <button onClick={() => router.push('/')} className={s.backButton}>
              ← Back to Home
            </button>
            <h1 className={s.title}>⬡ Swarm Task Planner</h1>
          </div>
          <div className={s.headerRight}>
            <div className={s.costBadge}>
              <span className={s.costLabel}>Total Cost:</span>
              <span className={s.costValue}>${totalCost.toFixed(2)}</span>
            </div>
            <button 
              className={s.purchaseButton}
              onClick={handlePurchase}
              disabled={edges.length === 0}
            >
              Purchase ({connectedTasks} task{connectedTasks !== 1 ? 's' : ''})
            </button>
          </div>
        </header>

        <div className={s.plannerContainer}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className={s.reactFlow}
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                if (node.type === 'agentNode') return '#6366f1';
                if (node.type === 'taskNode') return '#22c55e';
                return '#94a3b8';
              }}
              className={s.minimap}
            />
            <Panel position="top-left" className={s.panel}>
              <div className={s.controls}>
                <button 
                  className={s.controlButton}
                  onClick={() => setShowAddAgent(!showAddAgent)}
                >
                  + Add Agent
                </button>
                <button 
                  className={s.controlButton}
                  onClick={() => setShowAddTask(!showAddTask)}
                >
                  + Add Task
                </button>
              </div>
              
              {showAddAgent && (
                <div className={s.formCard}>
                  <h3>Add Agent Node</h3>
                  <input
                    type="text"
                    placeholder="Agent Name"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                    className={s.input}
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma-separated)"
                    value={agentForm.skills}
                    onChange={(e) => setAgentForm({ ...agentForm, skills: e.target.value })}
                    className={s.input}
                  />
                  <input
                    type="number"
                    placeholder="Cost per task"
                    value={agentForm.cost}
                    onChange={(e) => setAgentForm({ ...agentForm, cost: e.target.value })}
                    className={s.input}
                  />
                  <div className={s.formActions}>
                    <button onClick={addAgentNode} className={s.addButton}>Add</button>
                    <button onClick={() => setShowAddAgent(false)} className={s.cancelButton}>Cancel</button>
                  </div>
                </div>
              )}

              {showAddTask && (
                <div className={s.formCard}>
                  <h3>Add Task Node</h3>
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={taskForm.name}
                    onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                    className={s.input}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className={s.input}
                  />
                  <input
                    type="text"
                    placeholder="Required Skills (comma-separated)"
                    value={taskForm.skills}
                    onChange={(e) => setTaskForm({ ...taskForm, skills: e.target.value })}
                    className={s.input}
                  />
                  <input
                    type="number"
                    placeholder="Estimated Cost"
                    value={taskForm.cost}
                    onChange={(e) => setTaskForm({ ...taskForm, cost: e.target.value })}
                    className={s.input}
                  />
                  <div className={s.formActions}>
                    <button onClick={addTaskNode} className={s.addButton}>Add</button>
                    <button onClick={() => setShowAddTask(false)} className={s.cancelButton}>Cancel</button>
                  </div>
                </div>
              )}
            </Panel>

            <Panel position="bottom-right" className={s.infoPanel}>
              <div className={s.legend}>
                <div className={s.legendItem}>
                  <div className={s.legendColor} style={{ background: '#6366f1' }}></div>
                  <span>Agent</span>
                </div>
                <div className={s.legendItem}>
                  <div className={s.legendColor} style={{ background: '#22c55e' }}></div>
                  <span>Task</span>
                </div>
              </div>
              <div className={s.instructions}>
                💡 Drag to connect agents to tasks
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </>
  );
}
