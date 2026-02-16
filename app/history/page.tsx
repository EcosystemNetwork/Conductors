'use client';

import React, { useState, useEffect } from 'react';
import s from '@/styles/Home.module.css';
import { getStatusClass, getPriorityLabel, getPriorityColor } from '@/utils/helpers';
import { Task, Agent, Submission } from '@/context/BotContext';

export default function HistoryPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [taskHistory, setTaskHistory] = useState<Task[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [subsRes, historyRes, agentsRes] = await Promise.all([
                fetch('/api/tasks/submissions'),
                fetch('/api/tasks/history'),
                fetch('/api/agents/register')
            ]);
            const subsData = await subsRes.json();
            const historyData = await historyRes.json();
            const agentsData = await agentsRes.json();

            if (subsData.submissions) setSubmissions(subsData.submissions);
            if (historyData.history) setTaskHistory(historyData.history);
            if (agentsData.agents) setAgents(agentsData.agents);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading && submissions.length === 0 && taskHistory.length === 0) {
        return (
            <div className={s.container}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    Loading history...
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
                            <h2 className={s.sectionTitle}>History</h2>
                            <p className={s.tagline}>Track all past jobs and swarm submissions</p>
                        </div>

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
                                No submissions yet.
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
                </div>
            </main>
        </div>
    );
}
