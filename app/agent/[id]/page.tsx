
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import s from '@/styles/Home.module.css';

interface Agent {
    id: string;
    name: string;
    skills: string[];
    status: 'idle' | 'busy' | 'offline';
    registeredAt: number;
    tasksCompleted: number;
    totalEarned: number;
    walletAddress?: string;
    costPerTask?: number;
    jobOfferings?: any[];
}

interface Task {
    id: string;
    description: string;
    status: string;
    reward: number;
    completedAt?: number;
}

export default function AgentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [history, setHistory] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hiring, setHiring] = useState<string | null>(null); // Job name being hired
    const [hireResult, setHireResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleHire = async (job: any) => {
        if (!confirm(`Hire ${agent?.name} for "${job.name}" at $${job.price}? This will use x402 payment simulation.`)) return;

        setHiring(job.name);
        setHireResult(null);

        try {
            // Simulate x402 signing
            const mockTxHash = `0x${Math.random().toString(16).substring(2)}...${Math.random().toString(16).substring(2)}`;

            const response = await fetch('/api/agents/hire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: agent?.id,
                    serviceName: job.name,
                    description: job.description,
                    price: job.price,
                    paymentMethod: 'x402',
                    x402Payment: {
                        chainId: 1,
                        amount: job.price.toString(),
                        currency: 'ETH',
                        transactionHash: mockTxHash
                    }
                })
            });

            const data = await response.json();

            if (response.ok) {
                setHireResult({ success: true, message: `Successfully hired! Task ID: ${data.task.id}` });
                // Refresh data
                fetch(`/api/agents/${params.id}`)
                    .then(res => res.json())
                    .then(data => {
                        setAgent(data.agent);
                        setHistory(data.history || []);
                    });
            } else {
                setHireResult({ success: false, message: data.error || 'Failed to hire agent' });
            }
        } catch (err) {
            setHireResult({ success: false, message: 'Network error during hiring' });
        } finally {
            setHiring(null);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetch(`/api/agents/${params.id}`)
                .then(async (res) => {
                    if (!res.ok) {
                        if (res.status === 404) throw new Error('Agent not found');
                        throw new Error('Failed to fetch agent details');
                    }
                    return res.json();
                })
                .then((data) => {
                    setAgent(data.agent);
                    setHistory(data.history || []);
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [params.id]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                background: 'var(--bg-dark)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                Loading agent details...
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div style={{
                height: '100vh',
                background: 'var(--bg-dark)',
                color: 'var(--text-primary)',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <h1 style={{ marginBottom: '20px' }}>⚠️ Error</h1>
                <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>{error || 'Agent not found'}</p>
                <button
                    onClick={() => router.push('/')}
                    style={{
                        padding: '12px 24px',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Back to Marketplace
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', padding: '40px' }}>
            <button
                onClick={() => router.push('/')}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1rem'
                }}
            >
                ← Back to Marketplace
            </button>

            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '32px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        boxShadow: '0 0 20px var(--accent-glow)'
                    }}>
                        🤖
                    </div>
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem' }}>{agent.name}</h1>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                backgroundColor: agent.status === 'idle' ? 'rgba(16, 185, 129, 0.2)' : agent.status === 'busy' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: agent.status === 'idle' ? '#34d399' : agent.status === 'busy' ? '#fbbf24' : '#f87171',
                                border: `1px solid ${agent.status === 'idle' ? 'rgba(16, 185, 129, 0.3)' : agent.status === 'busy' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}>
                                ● {agent.status.toUpperCase()}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ID: {agent.id}</span>
                        </div>
                    </div>
                </div>

                {hireResult && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        borderRadius: '8px',
                        background: hireResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${hireResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        color: hireResult.success ? '#4ade80' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>{hireResult.success ? '✅' : '❌'}</span>
                        {hireResult.message}
                    </div>
                )}

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Earned</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-light)' }}>${agent.totalEarned.toFixed(2)}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Tasks Completed</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{agent.tasksCompleted}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Cost Per Task</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>${agent.costPerTask || 0}</div>
                    </div>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Skills</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {(agent.skills || []).map(skill => (
                            <span key={skill} style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem'
                            }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Job Offerings */}
                {agent.jobOfferings && agent.jobOfferings.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Services Offered</h3>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {(agent.jobOfferings || []).map((job, idx) => (
                                <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                                            <Link href={`/jobs/${agent.id}/${idx}`} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer', borderBottom: '1px dotted var(--text-secondary)' }}>
                                                {job.name} ↗
                                            </Link>
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ color: 'var(--accent-light)', fontWeight: '700' }}>${job.price}</span>
                                            <button
                                                onClick={() => handleHire(job)}
                                                disabled={!!hiring}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: hiring === job.name ? 'var(--text-secondary)' : 'var(--accent)',
                                                    color: 'white',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    cursor: hiring ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {hiring === job.name ? 'Processing...' : '⚡ Buy (x402)'}
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{job.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Task History */}
                <div>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Recent Activity</h3>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No task history available.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {(history || []).slice(0, 10).map(task => (
                                <div key={task.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{task.description}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Pending'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '600', color: task.status === 'completed' ? '#34d399' : '#fbbf24' }}>
                                            {task.status.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--accent-light)' }}>
                                            +${task.reward}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
