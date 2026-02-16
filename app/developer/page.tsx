'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb';
import { ethereum } from 'thirdweb/chains';
import s from '@/styles/Home.module.css';

interface ApiKey {
    id: string;
    name: string;
    owner_wallet?: string;
    created_at: number;
    last_used_at?: number;
    is_active: boolean;
    permissions: string[];
}

const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '◎' },
    { key: 'marketplace', label: 'Marketplace', icon: '◉' },
    { key: 'planner', label: 'Swarm Planner', icon: '🎯' },
    { key: 'requests', label: 'Job Board', icon: '📢' },
    { key: 'tasks', label: 'Tasks', icon: '⚡' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'payouts', label: 'Payouts', icon: '◈' },
    { key: 'onboard', label: 'Bot Control', icon: '⬡' },
    { key: 'developer', label: 'Developer', icon: '🔧' },
];

export default function DeveloperPage() {
    const router = useRouter();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [creating, setCreating] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/keys');
            const data = await res.json();
            setKeys(data.keys || []);
        } catch (error) {
            console.error('Failed to fetch keys', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/v1/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();
            if (res.ok) {
                setGeneratedKey(data.key);
                setNewKeyName('');
                fetchKeys();
            }
        } catch (error) {
            console.error('Failed to create key', error);
        } finally {
            setCreating(false);
        }
    };

    const handleRevokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/v1/keys/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchKeys();
            }
        } catch (error) {
            console.error('Failed to revoke key', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <>
            <div className={s.bgGlow} />

            <div className={s.container}>
                {/* Header */}
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
                        />
                    </div>
                </header>

                {/* Nav */}
                <nav className={s.nav}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`${s.navButton} ${tab.key === 'developer' ? s.navButtonActive : ''}`}
                            onClick={() => {
                                if (tab.key === 'developer') return;
                                router.push(tab.key === 'dashboard' ? '/' : `/${tab.key}`);
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ marginBottom: '6px', fontSize: '2rem' }}>Developer API Keys</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            Manage API keys for programmatic agent access.
                        </p>
                    </div>
                    <button
                        onClick={() => { setShowCreateModal(true); setGeneratedKey(null); }}
                        style={{
                            padding: '12px 24px', background: 'var(--accent)', border: 'none',
                            borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem',
                        }}
                    >
                        + Generate New Key
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {keys.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                                No API keys found. Generate one to get started.
                            </div>
                        ) : (
                            keys.map(key => (
                                <div key={key.id} style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: key.is_active ? 1 : 0.5
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{key.name}</h3>
                                            {!key.is_active && <span style={{ background: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>REVOKED</span>}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', gap: '16px' }}>
                                            <span>Start: <code>{key.id.substring(0, 8)}...</code></span>
                                            <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                                            <span>Last Used: {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}</span>
                                        </div>
                                    </div>
                                    {key.is_active && (
                                        <button
                                            onClick={() => handleRevokeKey(key.id)}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#1e1e2e', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', border: '1px solid var(--border-color)' }}>
                            {generatedKey ? (
                                <>
                                    <h2 style={{ marginTop: 0, color: '#10b981' }}>Key Generated!</h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        Make sure to copy your new API key now. You won't be able to see it again!
                                    </p>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px',
                                        fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '24px',
                                        border: '1px solid var(--accent)', color: 'var(--accent-light)'
                                    }}>
                                        {generatedKey}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => copyToClipboard(generatedKey)} style={{ flex: 1, padding: '12px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Copy Key</button>
                                        <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ marginTop: 0 }}>Create New API Key</h2>
                                    <form onSubmit={handleCreateKey}>
                                        <div style={{ marginBottom: '24px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Key Name</label>
                                            <input
                                                required
                                                value={newKeyName}
                                                onChange={e => setNewKeyName(e.target.value)}
                                                placeholder="e.g. Trading Bot V1"
                                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                            <button type="submit" disabled={creating} style={{ flex: 1, padding: '12px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{creating ? 'Generating...' : 'Generate Key'}</button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
