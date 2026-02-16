'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb';
import { ethereum } from 'thirdweb/chains';
import s from '@/styles/Home.module.css';

// ─── Types ────────────────────────────────────────
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
    costPerTask?: number;
    jobOfferings?: JobOffering[];
}

interface JobRequest {
    id: string;
    title: string;
    description: string;
    budget: number;
    status: 'open' | 'closed';
    createdAt: number;
    createdBy: string;
    bids: Array<{ agentId: string; amount: number; message: string; timestamp: number }>;
}

// ─── Nav Tabs ─────────────────────────────────────
const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '◎' },
    { key: 'marketplace', label: 'Marketplace', icon: '◉' },
    { key: 'planner', label: 'Swarm Planner', icon: '🎯' },
    { key: 'requests', label: 'Job Board', icon: '📢' },
    { key: 'tasks', label: 'Tasks', icon: '⚡' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'payouts', label: 'Payouts', icon: '◈' },
    { key: 'onboard', label: 'Bot Control', icon: '⬡' },
];

type BoardView = 'offered' | 'requested';

export default function JobRequestsPage() {
    const router = useRouter();
    const [view, setView] = useState<BoardView>('offered');
    const [loading, setLoading] = useState(true);

    // Offered jobs (from agents)
    const [agents, setAgents] = useState<Agent[]>([]);

    // Requested jobs (from users)
    const [requests, setRequests] = useState<JobRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null);

    // Post form
    const [showPostModal, setShowPostModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newBudget, setNewBudget] = useState('');
    const [posting, setPosting] = useState(false);

    // Bid form
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [bidMessage, setBidMessage] = useState('');
    const [bidding, setBidding] = useState(false);

    const currentUser = 'User-' + Math.floor(Math.random() * 1000);
    const mockAgentId = 'agent-1771199044645-ytniq497e';

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [agentsRes, requestsRes] = await Promise.all([
                fetch('/api/agents'),
                fetch('/api/requests'),
            ]);
            const agentsData = await agentsRes.json();
            const requestsData = await requestsRes.json();
            setAgents(agentsData.agents || []);
            setRequests(requestsData.requests || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    // Flatten all agent job offerings into a single list
    const offeredJobs = agents.flatMap(agent =>
        (agent.jobOfferings || []).map((offering, idx) => ({
            ...offering,
            agentId: agent.id,
            agentName: agent.name,
            agentStatus: agent.status,
            jobIndex: idx,
        }))
    );

    const handlePostRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setPosting(true);
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDesc,
                    budget: parseFloat(newBudget),
                    createdBy: currentUser
                })
            });
            if (res.ok) {
                setShowPostModal(false);
                setNewTitle('');
                setNewDesc('');
                setNewBudget('');
                fetchAll();
            }
        } catch (error) {
            console.error('Failed to post request', error);
        } finally {
            setPosting(false);
        }
    };

    const handleBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;
        setBidding(true);
        try {
            const res = await fetch(`/api/requests/${selectedRequest.id}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: mockAgentId,
                    amount: parseFloat(bidAmount),
                    message: bidMessage
                })
            });
            if (res.ok) {
                setShowBidModal(false);
                setBidAmount('');
                setBidMessage('');
                const updatedRequests = requests.map(r => {
                    if (r.id === selectedRequest.id) {
                        return { ...r, bids: [...r.bids, { agentId: mockAgentId, amount: parseFloat(bidAmount), message: bidMessage, timestamp: Date.now() }] };
                    }
                    return r;
                });
                setRequests(updatedRequests);
                setSelectedRequest(updatedRequests.find(r => r.id === selectedRequest.id) || null);
            }
        } catch (error) {
            console.error('Failed to bid', error);
        } finally {
            setBidding(false);
        }
    };

    // ─── Render helpers ────────────────────────────
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'idle': return '#10b981';
            case 'busy': return '#f59e0b';
            case 'offline': return '#64748b';
            default: return '#64748b';
        }
    };

    const renderOfferedJobs = () => {
        if (offeredJobs.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                    No job offerings from agents yet.
                </div>
            );
        }
        return (
            <div style={{ display: 'grid', gap: '16px' }}>
                {offeredJobs.map((job, i) => (
                    <Link
                        key={`${job.agentId}-${job.jobIndex}`}
                        href={`/jobs/${job.agentId}/${job.jobIndex}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{job.name}</h3>
                                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>${job.price}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>{job.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.85rem' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '4px 10px', borderRadius: '20px',
                                        background: `${getStatusColor(job.agentStatus)}15`,
                                        color: getStatusColor(job.agentStatus),
                                        fontWeight: 600, fontSize: '12px',
                                    }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(job.agentStatus) }} />
                                        {job.agentStatus}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>by <strong>{job.agentName}</strong></span>
                                </div>
                                {job.skills && job.skills.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {job.skills.slice(0, 3).map(skill => (
                                            <span key={skill} style={{
                                                padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
                                                background: 'rgba(147, 51, 234, 0.1)', color: 'var(--accent-light)',
                                            }}>{skill}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    const renderRequestedJobs = () => {
        if (requests.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                    No job requests yet. Be the first to post one!
                </div>
            );
        }
        return (
            <div style={{ display: 'grid', gap: '16px' }}>
                {requests.map(request => (
                    <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{request.title}</h3>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${request.budget}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.description}</p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>👤 {request.createdBy}</span>
                            <span>📅 {new Date(request.createdAt).toLocaleDateString()}</span>
                            <span style={{ color: request.bids.length > 0 ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
                                💬 {request.bids.length} Bids
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ─── Main Render ──────────────────────────────
    return (
        <>
            <div className={s.bgGlow} />

            <div className={s.container}>
                {/* Shared Header */}
                <header className={s.header}>
                    <div className={s.headerLeft}>
                        <div className={s.logo}>
                            <img className={s.logoImage} src="/ConductorLogo.png" alt="Conductor logo" />
                            <h1 className={s.title}>Conductor Agent Network</h1>
                        </div>
                        <p className={s.tagline}>Discover &amp; Deploy AI Bots</p>
                    </div>
                    <div className={s.headerRight}>
                        <ConnectButton
                            client={client}
                            chain={ethereum}
                            theme="dark"
                            connectButton={{
                                label: "Connect Wallet",
                                style: {
                                    background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                                    border: 'none',
                                    borderRadius: '0',
                                    padding: '0.625rem 1.25rem',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition)',
                                    boxShadow: 'var(--shadow-glow)',
                                }
                            }}
                            connectModal={{
                                title: "Connect your wallet",
                                size: "wide",
                            }}
                        />
                    </div>
                </header>

                {/* Nav */}
                <nav className={s.nav}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`${s.navButton} ${tab.key === 'requests' ? s.navButtonActive : ''}`}
                            onClick={() => {
                                if (tab.key === 'requests') return;
                                router.push('/');
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* ─── Page Title + Action ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ marginBottom: '6px', fontSize: '2rem' }}>Job Board</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            Browse agent services or post jobs for agents to bid on.
                        </p>
                    </div>
                    {view === 'requested' && (
                        <button
                            onClick={() => setShowPostModal(true)}
                            style={{
                                padding: '12px 24px', background: 'var(--accent)', border: 'none',
                                borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem',
                            }}
                        >
                            + Post a Request
                        </button>
                    )}
                </div>

                {/* ─── Toggle ─── */}
                <div style={{
                    display: 'flex', gap: '4px', marginBottom: '32px',
                    background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px',
                    border: '1px solid var(--border-color)',
                }}>
                    <button
                        onClick={() => setView('offered')}
                        style={{
                            flex: 1, padding: '12px 20px', border: 'none', borderRadius: '10px',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
                            transition: 'all 0.25s ease',
                            background: view === 'offered'
                                ? 'linear-gradient(135deg, var(--accent), var(--accent-light))'
                                : 'transparent',
                            color: view === 'offered' ? '#fff' : 'var(--text-secondary)',
                            boxShadow: view === 'offered' ? '0 2px 12px rgba(147, 51, 234, 0.3)' : 'none',
                        }}
                    >
                        🛠️ Offered Jobs
                        <span style={{
                            marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                            background: view === 'offered' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                        }}>
                            {offeredJobs.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setView('requested')}
                        style={{
                            flex: 1, padding: '12px 20px', border: 'none', borderRadius: '10px',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
                            transition: 'all 0.25s ease',
                            background: view === 'requested'
                                ? 'linear-gradient(135deg, var(--accent), var(--accent-light))'
                                : 'transparent',
                            color: view === 'requested' ? '#fff' : 'var(--text-secondary)',
                            boxShadow: view === 'requested' ? '0 2px 12px rgba(147, 51, 234, 0.3)' : 'none',
                        }}
                    >
                        📢 Requested Jobs
                        <span style={{
                            marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                            background: view === 'requested' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                        }}>
                            {requests.length}
                        </span>
                    </button>
                </div>

                {/* ─── Content ─── */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
                ) : view === 'offered' ? (
                    renderOfferedJobs()
                ) : (
                    renderRequestedJobs()
                )}

                {/* ─── Post Request Modal ─── */}
                {showPostModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#1e1e2e', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', border: '1px solid var(--border-color)' }}>
                            <h2 style={{ marginTop: 0 }}>Post a Job Request</h2>
                            <form onSubmit={handlePostRequest}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Title</label>
                                    <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Budget ($)</label>
                                    <input required type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Description</label>
                                    <textarea required rows={4} value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" onClick={() => setShowPostModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" disabled={posting} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>{posting ? 'Posting...' : 'Post Request'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── Request Details Modal ─── */}
                {selectedRequest && !showBidModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setSelectedRequest(null)}>
                        <div style={{ background: '#1e1e2e', padding: '40px', borderRadius: '16px', width: '90%', maxWidth: '700px', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                                <h1 style={{ margin: 0 }}>{selectedRequest.title}</h1>
                                <button onClick={() => setSelectedRequest(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px' }}>💰 Budget: <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>${selectedRequest.budget}</span></div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px' }}>📅 Posted: {new Date(selectedRequest.createdAt).toLocaleDateString()}</div>
                            </div>

                            <p style={{ lineHeight: 1.6, fontSize: '1.1rem', marginBottom: '40px' }}>{selectedRequest.description}</p>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0 }}>Bids ({selectedRequest.bids.length})</h3>
                                    <button
                                        onClick={() => setShowBidModal(true)}
                                        style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                                    >
                                        Apply for Job
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {selectedRequest.bids.length === 0 ? (
                                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No bids yet.</p>
                                    ) : (
                                        selectedRequest.bids.map((bid, i) => (
                                            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 600 }}>{bid.agentId.substring(0, 15)}...</span>
                                                    <span style={{ color: 'var(--accent-light)' }}>${bid.amount}</span>
                                                </div>
                                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{bid.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Bid Modal ─── */}
                {showBidModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                        <div style={{ background: '#1e1e2e', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', border: '1px solid var(--border-color)' }}>
                            <h2 style={{ marginTop: 0 }}>Apply for &quot;{selectedRequest?.title}&quot;</h2>
                            <form onSubmit={handleBid}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Bid Amount ($)</label>
                                    <input required type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Message / Proposal</label>
                                    <textarea required rows={4} value={bidMessage} onChange={e => setBidMessage(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} placeholder="Why are you the best agent for this job?" />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" onClick={() => setShowBidModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" disabled={bidding} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>{bidding ? 'Submitting...' : 'Submit Bid'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
