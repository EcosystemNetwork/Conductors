'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface JobOffering {
    name: string;
    description: string;
    price: number;
    skills: string[];
}

interface Agent {
    id: string;
    name: string;
    status: string;
    jobOfferings: JobOffering[];
    walletAddress?: string;
}

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { agentId, jobIndex } = params;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [job, setJob] = useState<JobOffering | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Purchase State
    const [hiring, setHiring] = useState(false);
    const [hireResult, setHireResult] = useState<{ success: boolean; message: string } | null>(null);

    // Negotiation State
    const [negotiating, setNegotiating] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [negotiationResult, setNegotiationResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (agentId) {
            const id = Array.isArray(agentId) ? agentId[0] : agentId;
            fetch(`/api/agents/${id}`)
                .then(async (res) => {
                    if (!res.ok) throw new Error('Agent not found');
                    return res.json();
                })
                .then((data) => {
                    const agentData = data.agent;
                    setAgent(agentData);

                    const jobIndexStr = Array.isArray(jobIndex) ? jobIndex[0] : jobIndex;
                    if (!jobIndexStr) {
                        setError('Invalid job index');
                        return;
                    }
                    const idx = parseInt(jobIndexStr);
                    if (agentData.jobOfferings && agentData.jobOfferings[idx]) {
                        setJob(agentData.jobOfferings[idx]);
                    } else {
                        setError('Job offering not found');
                    }
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [agentId, jobIndex]);

    const handleHire = async () => {
        if (!agent || !job) return;
        if (!confirm(`Hire ${agent.name} for "${job.name}" at $${job.price}?`)) return;

        setHiring(true);
        setHireResult(null);

        try {
            const mockTxHash = `0x${Math.random().toString(16).substring(2)}`;
            const response = await fetch('/api/agents/hire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: agent.id,
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
            } else {
                setHireResult({ success: false, message: data.error });
            }
        } catch (err) {
            setHireResult({ success: false, message: 'Network error' });
        } finally {
            setHiring(false);
        }
    };

    const handleNegotiate = async (e: React.FormEvent) => {
        e.preventDefault();
        setNegotiationResult(null);

        try {
            const response = await fetch('/api/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: agent?.id,
                    jobName: job?.name,
                    offerAmount,
                    message: offerMessage
                })
            });

            const data = await response.json();
            if (response.ok) {
                setNegotiationResult({ success: true, message: data.message });
                setNegotiating(false);
                setOfferAmount('');
                setOfferMessage('');
            } else {
                setNegotiationResult({ success: false, message: data.error });
            }
        } catch (err) {
            setNegotiationResult({ success: false, message: 'Failed to submit offer' });
        }
    };

    if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    if (error || !agent || !job) return <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', padding: '40px' }}>Error: {error || 'Not found'} <button onClick={() => router.push('/')} style={{ marginLeft: '10px', background: 'var(--accent)', border: 'none', padding: '5px 10px', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Back</button></div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', padding: '40px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem' }}>← Back to Marketplace</button>

            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '40px' }}>

                {/* Header */}
                <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>{job.name}</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            Posted by <span style={{ color: 'var(--accent-light)', fontWeight: 600, cursor: 'pointer' }} onClick={() => router.push(`/agent/${agent.id}`)}>{agent.name}</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>${job.price}</div>
                    </div>
                </div>

                {/* Details */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Description</h3>
                    <p style={{ lineHeight: '1.6' }}>{job.description}</p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Required Skills</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(job.skills || []).map((skill, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem' }}>{skill}</span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={handleHire}
                        disabled={hiring}
                        style={{ flex: 1, padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: hiring ? 'wait' : 'pointer', fontSize: '1rem' }}
                    >
                        {hiring ? 'Processing...' : '⚡ Buy Now (x402)'}
                    </button>
                    <button
                        onClick={() => setNegotiating(true)}
                        style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
                    >
                        🤝 Negotiate
                    </button>
                </div>

                {/* Feedback Messages */}
                {hireResult && (
                    <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', background: hireResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: hireResult.success ? '#4ade80' : '#f87171' }}>
                        {hireResult.message}
                    </div>
                )}

                {negotiationResult && (
                    <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', background: negotiationResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: negotiationResult.success ? '#4ade80' : '#f87171' }}>
                        {negotiationResult.message}
                    </div>
                )}

                {/* Negotiation Modal */}
                {negotiating && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#1e1e2e', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
                            <h2 style={{ marginTop: 0 }}>Propose Offer</h2>
                            <form onSubmit={handleNegotiate}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Counter Offer ($)</label>
                                    <input
                                        type="number"
                                        value={offerAmount}
                                        onChange={e => setOfferAmount(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Message</label>
                                    <textarea
                                        value={offerMessage}
                                        onChange={e => setOfferMessage(e.target.value)}
                                        rows={4}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" onClick={() => setNegotiating(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Send Offer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
