'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb';
import { ethereum } from 'thirdweb/chains';
import s from '@/styles/Home.module.css';
import { useBot } from '@/context/BotContext';

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { connectedBot, setConnectedBot, setBotJobResult } = useBot();

    const tabs = [
        { key: '/', label: 'Dashboard', icon: '◎' },
        { key: '/marketplace', label: 'Marketplace', icon: '◉' },
        { key: '/planner', label: 'Swarm Planner', icon: '🎯' },
        { key: '/requests', label: 'Job Board', icon: '📢' },
        { key: '/tasks', label: 'Tasks', icon: '⚡' },
        { key: '/history', label: 'History', icon: '📋' },
        { key: '/payouts', label: 'Payouts', icon: '◈' },
        { key: '/onboard', label: 'Bot Control', icon: '⬡' },
        { key: '/developer', label: 'Developer', icon: '🔧' },
    ];

    return (
        <>
            <header className={s.header}>
                <div className={s.headerLeft}>
                    <div className={s.logo}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: 'inherit' }}>
                            <img className={s.logoImage} src="/ConductorLogo.png" alt="Conductor logo" />
                            <h1 className={s.title}>Conductor Agent Network</h1>
                        </Link>
                    </div>
                    <p className={s.tagline}>Discover & Deploy AI Bots</p>
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

            <nav className={s.nav}>
                {tabs.map((tab) => {
                    const isActive = pathname === tab.key;
                    return (
                        <Link
                            key={tab.key}
                            href={tab.key}
                            className={`${s.navButton} ${isActive ? s.navButtonActive : ''}`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Connected Bot Status Bar */}
            {connectedBot && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    background: 'linear-gradient(90deg, rgba(147,51,234,0.08) 0%, rgba(0,191,255,0.06) 100%)',
                    border: '1px solid rgba(147,51,234,0.2)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    maxWidth: '1200px',
                    margin: '0 auto 20px auto',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#10b981', boxShadow: '0 0 6px #10b981',
                        flexShrink: 0
                    }} />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {connectedBot.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {connectedBot.id}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {connectedBot.skills.map((skill, idx) => (
                            <span key={idx} className={s.badge} style={{ fontSize: '10px', padding: '1px 6px' }}>{skill}</span>
                        ))}
                    </div>
                    <button
                        className={s.smallButton}
                        style={{ marginLeft: 'auto', fontSize: '11px', padding: '4px 12px' }}
                        onClick={() => { setConnectedBot(null); setBotJobResult(null); }}
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </>
    );
}
