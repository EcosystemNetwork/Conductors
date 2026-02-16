'use client';

import React, { useState, useEffect } from 'react';
import s from '@/styles/Home.module.css';
import { getStatusClass, getPriorityLabel, getPriorityColor } from '@/utils/helpers';
import { useBot, Task, Agent } from '@/context/BotContext';

export default function TasksPage() {
    const { connectedBot } = useBot();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskForm, setTaskForm] = useState({
        description: '',
        skills: '',
        reward: '10',
        priority: '3',
        maxRetries: '3',
    });

    const fetchData = async () => {
        try {
            const [tasksRes, agentsRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch('/api/agents/register')
            ]);
            const tasksData = await tasksRes.json();
            const agentsData = await agentsRes.json();

            if (tasksData.tasks) setTasks(tasksData.tasks);
            if (agentsData.agents) setAgents(agentsData.agents);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(useBot().apiKey ? { 'x-api-key': useBot().apiKey! } : {})
                },
                body: JSON.stringify({
                    description: taskForm.description,
                    skills: taskForm.skills.split(',').map(s => s.trim()).filter(Boolean),
                    reward: parseFloat(taskForm.reward),
                    priority: parseInt(taskForm.priority),
                    maxRetries: parseInt(taskForm.maxRetries),
                }),
            });
            if (res.ok) {
                setTaskForm({ description: '', skills: '', reward: '10', priority: '3', maxRetries: '3' });
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
                body: JSON.stringify({ taskId, agentId })
            });
            fetchData();
        } catch (error) {
            console.error('Error completing task:', error);
        }
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

    const handleTakeTask = async (taskId: string) => {
        if (!connectedBot) return;
        try {
            const response = await fetch('/api/bots/purchase-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    botId: connectedBot.id,
                    taskId,
                    paymentMethod: 'ethereum'
                })
            });
            if (response.ok) {
                fetchData();
            } else {
                const err = await response.json();
                console.error('Error taking task:', err.error);
                alert(`Failed to take task: ${err.error}`);
            }
        } catch (error) {
            console.error('Error taking task:', error);
        }
    };

    if (loading && tasks.length === 0) {
        return (
            <div className={s.container}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    Loading tasks...
                </div>
            </div>
        );
    }

    return (
        <div className={s.container}>
            <main className={s.main}>
                <div className={s.grid}>
                    <div className={s.content}>
                        <div className={s.marketplaceHeader}>
                            <h2 className={s.sectionTitle}>Task Management</h2>
                            <p className={s.tagline}>Create, assign, and track tasks across the swarm</p>
                        </div>

                        <div style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-color)',
                            padding: '20px',
                            marginBottom: '30px',
                            borderRadius: '0',
                        }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Create New Task</h3>
                            <form onSubmit={handleCreateTask} className={s.form}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Task Description (e.g., Process data batch #402)"
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        className={s.input}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Required Skills (comma-separated)"
                                        value={taskForm.skills}
                                        onChange={(e) => setTaskForm({ ...taskForm, skills: e.target.value })}
                                        className={s.input}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reward ($)</label>
                                        <input
                                            type="number"
                                            placeholder="Reward"
                                            value={taskForm.reward}
                                            onChange={(e) => setTaskForm({ ...taskForm, reward: e.target.value })}
                                            className={s.input}
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Priority (1-5)</label>
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max Retries</label>
                                        <input
                                            type="number"
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
                                                        {(task.requiredSkills || []).map((skill, idx) => (
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
                                                        {task.status === 'pending' && connectedBot && (
                                                            <button
                                                                className={s.smallButton}
                                                                onClick={() => handleTakeTask(task.id)}
                                                                style={{ backgroundColor: 'var(--accent)' }}
                                                                title={`Take this task as ${connectedBot.name}`}
                                                            >
                                                                ⚡ Take Task
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
                </div>
            </main>
        </div>
    );
}
