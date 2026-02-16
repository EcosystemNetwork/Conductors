'use client';

import React, { useState, useEffect } from 'react';
import s from '@/styles/Home.module.css';
import { getStatusClass } from '@/utils/helpers';
import { Payout, Task, Agent } from '@/context/BotContext';

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [payoutsRes, tasksRes, agentsRes] = await Promise.all([
                fetch('/api/payouts'),
                fetch('/api/tasks'),
                fetch('/api/agents/register')
            ]);
            const payoutsData = await payoutsRes.json();
            const tasksData = await tasksRes.json();
            const agentsData = await agentsRes.json();

            if (payoutsData.payouts) setPayouts(payoutsData.payouts);
            if (tasksData.tasks) setTasks(tasksData.tasks);
            if (agentsData.agents) setAgents(agentsData.agents);
        } catch (error) {
            console.error('Error fetching payouts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading && payouts.length === 0) {
        return (
            <div className={s.container}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    Loading payouts...
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
                            <h2 className={s.sectionTitle}>Payouts</h2>
                            <p className={s.tagline}>View on-chain payment history for completed tasks</p>
                        </div>

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
                </div>
            </main>
        </div>
    );
}
