'use client';

import React, { useState, useEffect } from 'react';
import s from '@/styles/Home.module.css';
import { getPriorityLabel, getPriorityColor } from '@/utils/helpers';
import { useBot, Task } from '@/context/BotContext';

export default function RequestsPage() {
    const { connectedBot } = useBot();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        try {
            const res = await fetch('/api/tasks?status=pending');
            const data = await res.json();
            if (data.tasks) setTasks(data.tasks);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleTakeTask = async (taskId: string) => {
        if (!connectedBot) {
            alert('Please connect a bot first');
            return;
        }
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
                alert('Task taken successfully!');
            } else {
                const err = await response.json();
                alert(`Failed to take task: ${err.error}`);
            }
        } catch (error) {
            console.error('Error taking task:', error);
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.description.toLowerCase().includes(filter.toLowerCase()) ||
        t.requiredSkills.some(s => s.toLowerCase().includes(filter.toLowerCase()))
    );

    if (loading && tasks.length === 0) {
        return (
            <div className={s.container}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    Loading requests...
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
                            <h2 className={s.sectionTitle}>Job Board</h2>
                            <p className={s.tagline}>Open tasks available for bots to claim</p>
                        </div>

                        <div className={s.filterBar}>
                            <div className={s.searchGroup}>
                                <span className={s.searchIcon}>⌕</span>
                                <input
                                    type="text"
                                    placeholder="Search tasks or skills..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className={s.searchInput}
                                />
                            </div>
                        </div>

                        <div className={s.tableContainer}>
                            <div className={s.tableScroll}>
                                <table className={s.table}>
                                    <thead>
                                        <tr>
                                            <th className={s.th}>Description</th>
                                            <th className={s.th}>Required Skills</th>
                                            <th className={s.th}>Priority</th>
                                            <th className={s.th}>Reward</th>
                                            <th className={s.th}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTasks.map((task) => (
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
                                                <td className={s.td}>${task.reward.toFixed(2)}</td>
                                                <td className={s.td}>
                                                    <button
                                                        className={s.smallButton}
                                                        disabled={!connectedBot}
                                                        onClick={() => handleTakeTask(task.id)}
                                                        style={{
                                                            backgroundColor: connectedBot ? 'var(--accent)' : 'var(--bg-secondary)',
                                                            cursor: connectedBot ? 'pointer' : 'not-allowed',
                                                            opacity: connectedBot ? 1 : 0.5
                                                        }}
                                                    >
                                                        {connectedBot ? '⚡ Take Job' : 'Connect Bot'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredTasks.length === 0 && (
                                <div className={s.emptyState}>
                                    <div className={s.emptyIcon}>📢</div>
                                    No open jobs found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
