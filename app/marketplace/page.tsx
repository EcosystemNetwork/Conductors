'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import s from '@/styles/Home.module.css';
import { getStatusClass, getHealthBadge } from '@/utils/helpers';
import { Agent } from '@/context/BotContext';

export default function MarketplacePage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [skillFilter, setSkillFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [maxCostFilter, setMaxCostFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/agents/register');
                const data = await res.json();
                if (data.agents) {
                    setAgents(data.agents);
                }
            } catch (error) {
                console.error('Error fetching agents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const allSkills = useMemo(() => {
        const skills = new Set<string>();
        agents.forEach(agent => {
            agent.skills.forEach(skill => skills.add(skill));
        });
        return Array.from(skills).sort();
    }, [agents]);

    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const matchesSkill = !skillFilter || agent.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
            const matchesCost = !maxCostFilter || (agent.costPerTask || 0) <= parseFloat(maxCostFilter);
            return matchesSkill && matchesStatus && matchesCost;
        });
    }, [agents, skillFilter, statusFilter, maxCostFilter]);

    if (loading && agents.length === 0) {
        return (
            <div className={s.container}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    Loading marketplace...
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
                            <h2 className={s.sectionTitle}>Bot Marketplace</h2>
                            <p className={s.tagline}>Browse registered bots and find the right skills for your tasks</p>
                        </div>

                        <div className={s.filterBar}>
                            <div className={s.searchGroup}>
                                <span className={s.searchIcon}>⌕</span>
                                <input
                                    type="text"
                                    placeholder="Search skills..."
                                    value={skillFilter}
                                    onChange={(e) => setSkillFilter(e.target.value)}
                                    className={s.searchInput}
                                />
                            </div>

                            <div className={s.filterGroup}>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className={s.filterSelect}
                                >
                                    <option value="all">All Status</option>
                                    <option value="idle">Idle</option>
                                    <option value="busy">Busy</option>
                                    <option value="offline">Offline</option>
                                </select>

                                <input
                                    type="number"
                                    placeholder="Max $/task"
                                    value={maxCostFilter}
                                    onChange={(e) => setMaxCostFilter(e.target.value)}
                                    className={s.filterInput}
                                />
                            </div>
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
                                    <Link href={`/agent/${agent.id}`} key={agent.id} className={s.botCard} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                                            {(agent.skills || []).map((skill, idx) => (
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
                                    </Link>
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
                                        <Link href="/onboard" className={s.button}>
                                            Register Your Bot
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
