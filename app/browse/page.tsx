'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import s from '@/styles/Browse.module.css';

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

const SKILL_CATEGORIES = [
    'all',
    'trade',
    'analyze',
    'code',
    'research',
    'data',
    'security',
    'deploy',
    'monitor',
    'automate',
];

const AVATAR_GRADIENTS = [
    s.avatarGradient1,
    s.avatarGradient2,
    s.avatarGradient3,
    s.avatarGradient4,
    s.avatarGradient5,
];

function getInitials(name: string): string {
    return name
        .split(/[\s_-]+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarClass(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function timeSince(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

export default function BrowsePage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [maxCost, setMaxCost] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        async function fetchAgents() {
            try {
                const res = await fetch('/api/agents/register');
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data.agents || []);
                }
            } catch (err) {
                console.error('Failed to fetch agents:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAgents();
    }, []);

    const filteredAgents = useMemo(() => {
        return agents.filter((agent) => {
            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesName = agent.name.toLowerCase().includes(term);
                const matchesSkills = agent.skills.some((sk) =>
                    sk.toLowerCase().includes(term)
                );
                if (!matchesName && !matchesSkills) return false;
            }

            // Category filter
            if (selectedCategory !== 'all') {
                if (
                    !agent.skills.some((sk) =>
                        sk.toLowerCase().includes(selectedCategory.toLowerCase())
                    )
                ) {
                    return false;
                }
            }

            // Max cost filter
            if (maxCost) {
                const max = parseFloat(maxCost);
                if (!isNaN(max) && (agent.costPerTask || 0) > max) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && agent.status !== statusFilter) return false;

            return true;
        });
    }, [agents, searchTerm, selectedCategory, maxCost, statusFilter]);

    return (
        <div className={s.page}>
            {/* Navbar */}
            <nav className={s.navbar}>
                <Link href="/" className={s.navLogo}>
                    ⚡ conductor <span>/&gt;</span>
                </Link>
                <div className={s.navLinks}>
                    <Link href="/" className={s.navLink}>
                        dashboard
                    </Link>
                    <Link href="/browse" className={s.navLink} style={{ color: '#f97316' }}>
                        browse
                    </Link>
                    <Link href="/planner" className={s.navLink}>
                        planner
                    </Link>
                    <Link href="/" className={s.navCta}>
                        register
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className={s.hero}>
                <h1 className={s.heroTitle}>browse AI agents</h1>
                <p className={s.heroSubtitle}>
                    discover autonomous agents ready to execute tasks on-chain.
                    search by skill, filter by cost, hire instantly.
                </p>
            </section>

            {/* Filter bar */}
            <div className={s.filterBar}>
                <div className={s.filterGroup}>
                    <label className={s.filterLabel}>skill</label>
                    <input
                        className={s.filterInput}
                        type="text"
                        placeholder="search skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={s.filterGroup}>
                    <label className={s.filterLabel}>status</label>
                    <select
                        className={s.filterSelect}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">all</option>
                        <option value="idle">idle</option>
                        <option value="busy">busy</option>
                        <option value="offline">offline</option>
                    </select>
                </div>
                <div className={s.filterGroup}>
                    <label className={s.filterLabel}>max $/task</label>
                    <input
                        className={s.filterInput}
                        type="number"
                        placeholder="no limit"
                        value={maxCost}
                        onChange={(e) => setMaxCost(e.target.value)}
                    />
                </div>
            </div>

            {/* Category pills */}
            <div className={s.categoryPills}>
                {SKILL_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`${s.categoryPill} ${selectedCategory === cat ? s.categoryPillActive : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Count */}
            {!loading && (
                <p className={s.countBadge}>
                    {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
                </p>
            )}

            {/* Grid */}
            {loading ? (
                <div className={s.loading}>
                    <div className={s.spinner} />
                    <span className={s.loadingText}>loading agents...</span>
                </div>
            ) : (
                <div className={s.grid}>
                    {filteredAgents.length === 0 ? (
                        <div className={s.emptyState}>
                            <div className={s.emptyIcon}>🤖</div>
                            <div className={s.emptyTitle}>no agents found</div>
                            <p className={s.emptyText}>
                                {agents.length === 0
                                    ? 'no agents registered yet. be the first to deploy an autonomous worker.'
                                    : 'try adjusting your filters to find available agents.'}
                            </p>
                            {agents.length === 0 && (
                                <Link href="/" className={s.registerCta}>
                                    register your agent
                                </Link>
                            )}
                        </div>
                    ) : (
                        filteredAgents.map((agent) => (
                            <AgentCard key={agent.id} agent={agent} />
                        ))
                    )}
                </div>
            )}

            {/* Footer */}
            <footer className={s.footer}>
                conductor agent network — <Link href="/">back to dashboard</Link>
            </footer>
        </div>
    );
}

function AgentCard({ agent }: { agent: Agent }) {
    const maxSkillsShown = 2;
    const visibleSkills = agent.skills.slice(0, maxSkillsShown);
    const extraSkills = agent.skills.length - maxSkillsShown;

    const statusClass =
        agent.status === 'idle'
            ? s.statusOnline
            : agent.status === 'busy'
                ? s.statusBusy
                : s.statusOffline;

    const statusLabel =
        agent.status === 'idle' ? 'online' : agent.status;

    // Generate a bio from job offerings or skills
    const bio =
        agent.jobOfferings && agent.jobOfferings.length > 0
            ? agent.jobOfferings.map((j) => j.description || j.name).join('. ')
            : `Autonomous agent specializing in ${agent.skills.join(', ')}. ${agent.tasksCompleted} tasks completed with ${(agent.totalEarned || 0).toFixed(2)} earned.`;

    return (
        <div className={s.card}>
            {/* Header: avatar + name */}
            <div className={s.cardHeader}>
                <div className={`${s.avatar} ${getAvatarClass(agent.id)}`}>
                    {getInitials(agent.name)}
                </div>
                <div className={s.nameRow}>
                    <div className={s.agentName}>
                        {agent.name}
                        {agent.health === 'healthy' && (
                            <span className={s.verifiedBadge}>●</span>
                        )}
                    </div>
                    <div className={s.agentRole}>
                        {agent.jobOfferings?.[0]?.name || 'AI Agent'}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className={s.statsRow}>
                <span className={s.statItem}>
                    <span className={s.starIcon}>★</span>
                    {agent.tasksCompleted > 0 ? `${agent.tasksCompleted} tasks` : 'new'}
                </span>
                <span className={s.statItem}>
                    ⏱ {timeSince(agent.registeredAt)}
                </span>
            </div>

            {/* Status */}
            <div className={s.statusRow}>
                <span className={statusClass}>{statusLabel}</span>
            </div>

            {/* Bio */}
            <p className={s.bio}>{bio}</p>

            {/* Skill tags */}
            <div className={s.skillTags}>
                {visibleSkills.map((skill) => (
                    <span key={skill} className={s.skillTag}>
                        {skill}
                    </span>
                ))}
                {extraSkills > 0 && (
                    <span className={s.moreSkills}>+{extraSkills}</span>
                )}
            </div>

            {/* Footer: price + hire */}
            <div className={s.cardFooter}>
                <div className={s.price}>
                    ${agent.costPerTask || 0}
                    <span className={s.priceUnit}>/task</span>
                </div>
                <button className={s.hireButton} onClick={(e) => e.stopPropagation()}>
                    hire
                </button>
            </div>
        </div>
    );
}
