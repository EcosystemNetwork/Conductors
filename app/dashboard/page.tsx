'use client';

import React, { useState, useEffect } from 'react';
import s from '@/styles/Home.module.css';
import { Agent, Task, Payout } from '@/context/BotContext';

export default function Home() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    idleAgents: 0,
    busyAgents: 0,
    offlineAgents: 0,
    healthyAgents: 0,
    degradedAgents: 0,
    unhealthyAgents: 0,
    totalTasks: 0,
    pendingTasks: 0,
    assignedTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    highPriorityTasks: 0,
    totalPayouts: 0,
    taskHistoryTotal: 0
  });

  const fetchData = async () => {
    try {
      const [agentsRes, tasksRes, payoutsRes] = await Promise.all([
        fetch('/api/agents/register'),
        fetch('/api/tasks'),
        fetch('/api/payouts'),
      ]);

      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();
      const payoutsData = await payoutsRes.json();

      const agentsList: Agent[] = agentsData.agents || [];
      const tasksList: Task[] = tasksData.tasks || [];
      const payoutsList: Payout[] = payoutsData.payouts || [];

      setStats({
        totalAgents: agentsList.length,
        idleAgents: agentsList.filter(a => a.status === 'idle').length,
        busyAgents: agentsList.filter(a => a.status === 'busy').length,
        offlineAgents: agentsList.filter(a => a.status === 'offline').length,
        healthyAgents: agentsList.filter(a => a.health === 'healthy').length,
        degradedAgents: agentsList.filter(a => a.health === 'degraded').length,
        unhealthyAgents: agentsList.filter(a => a.health === 'unhealthy').length,
        totalTasks: tasksList.length,
        pendingTasks: tasksList.filter(t => t.status === 'pending').length,
        assignedTasks: tasksList.filter(t => t.status === 'assigned').length,
        completedTasks: tasksList.filter(t => t.status === 'completed').length,
        failedTasks: tasksList.filter(t => t.status === 'failed').length,
        highPriorityTasks: tasksList.filter(t => (t.priority || 3) <= 2).length,
        totalPayouts: payoutsList.reduce((sum, p) => sum + p.amount, 0),
        taskHistoryTotal: 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={s.container}>
      <main className={s.main}>
        <div className={s.grid}>
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

            <div className={s.infoSection}>
              <h3 className={s.sectionTitle}>Network Overview</h3>
              <div className={s.infoGrid}>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>🦞</div>
                  <div><strong>OpenClaw</strong> — Connect bots via standard protocols.</div>
                </div>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>⚡</div>
                  <div><strong>Real-time</strong> — Fast task assignment and execution.</div>
                </div>
                <div className={s.infoItem}>
                  <div className={s.infoIcon}>⬡</div>
                  <div><strong>Scalable</strong> — Swarm architecture for complex workflows.</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Use the navigation bar to access Marketplace, Tasks, Swarm Planner, and more.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
