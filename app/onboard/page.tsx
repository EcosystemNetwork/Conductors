'use client';

import React, { useState, useEffect } from 'react';
import s from '@/styles/Home.module.css';
import { getStatusClass } from '@/utils/helpers';
import { useBot, JobOffering, Agent } from '@/context/BotContext';

const emptyAgentForm = {
    name: '',
    skills: '',
    walletAddress: '',
    costPerTask: '',
    jobOfferingName: '',
    jobOfferingDescription: '',
    jobOfferingPrice: '',
    jobOfferingSkills: ''
};

export default function OnboardPage() {
    const { connectedBot, setConnectedBot, botJobResult, setBotJobResult, apiKey, setApiKey } = useBot();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentForm, setAgentForm] = useState(emptyAgentForm);
    const [botJobForm, setBotJobForm] = useState({
        description: '',
        requiredSkills: '',
        reward: '10',
        priority: '3',
    });

    const [skillMdParsing, setSkillMdParsing] = useState(false);
    const [skillMdError, setSkillMdError] = useState<string | null>(null);
    const [skillMdPasteContent, setSkillMdPasteContent] = useState('');

    // API Keys state
    const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; owner_wallet?: string; created_at: number; last_used_at?: number; is_active: boolean }>>([]);
    const [apiKeyName, setApiKeyName] = useState('');
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [apiKeyLoading, setApiKeyLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [agentsRes, keysRes] = await Promise.all([
                fetch('/api/agents/register'),
                fetch('/api/v1/keys')
            ]);
            const agentsData = await agentsRes.json();
            const keysData = await keysRes.json();

            if (agentsData.agents) setAgents(agentsData.agents);
            if (keysData.keys) setApiKeys(keysData.keys);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [connectedBot]); // Refresh when bot status changes

    // Auto-fill form when connected bot changes
    useEffect(() => {
        if (connectedBot) {
            setBotJobForm(prev => ({
                ...prev,
                requiredSkills: connectedBot.skills.join(', '),
            }));
        }
    }, [connectedBot]);

    const handleRegisterAgent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const skills = agentForm.skills.split(',').map(s => s.trim());
            const jobOfferings: JobOffering[] = [];

            if (agentForm.jobOfferingName && agentForm.jobOfferingPrice) {
                jobOfferings.push({
                    name: agentForm.jobOfferingName,
                    description: agentForm.jobOfferingDescription || agentForm.jobOfferingName,
                    price: parseFloat(agentForm.jobOfferingPrice),
                    skills: agentForm.jobOfferingSkills
                        ? agentForm.jobOfferingSkills.split(',').map(s => s.trim())
                        : skills
                });
            }

            const response = await fetch('/api/bots/advertise', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'x-api-key': apiKey } : {})
                },
                body: JSON.stringify({
                    name: agentForm.name,
                    skills,
                    walletAddress: agentForm.walletAddress || undefined,
                    costPerTask: agentForm.costPerTask ? parseFloat(agentForm.costPerTask) : undefined,
                    jobOfferings: jobOfferings.length > 0 ? jobOfferings : undefined
                })
            });

            if (response.ok) {
                const result = await response.json();
                const registeredBot = result.bot;
                setConnectedBot({
                    id: registeredBot.id,
                    name: registeredBot.name,
                    skills: registeredBot.skills || [],
                    status: registeredBot.status,
                    registeredAt: registeredBot.registeredAt,
                    tasksCompleted: 0,
                    totalEarned: 0
                });
                setAgentForm(emptyAgentForm);
                fetchData();
            }
        } catch (error) {
            console.error('Error registering agent:', error);
        }
    };

    const handleBotCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!connectedBot) return;
        try {
            const response = await fetch('/api/bots/create-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'x-api-key': apiKey } : {})
                },
                body: JSON.stringify({
                    botId: connectedBot.id,
                    description: botJobForm.description,
                    requiredSkills: botJobForm.requiredSkills.split(',').map(s => s.trim()),
                    reward: parseFloat(botJobForm.reward),
                    priority: parseInt(botJobForm.priority),
                })
            });

            if (response.ok) {
                const result = await response.json();
                setBotJobResult({
                    success: true,
                    message: `Job created! ${result.assigned ? `Assigned to ${result.assignedTo}` : 'Waiting for a matching bot'}`
                });
                setBotJobForm({ description: '', requiredSkills: connectedBot.skills.join(', '), reward: '10', priority: '3' });
                fetchData();
            } else {
                const error = await response.json();
                setBotJobResult({ success: false, message: error.error || 'Failed to create job' });
            }
        } catch (error) {
            console.error('Error creating bot job:', error);
            setBotJobResult({ success: false, message: 'Network error creating job' });
        }
    };

    const handleSkillMdFile = async (content: string) => {
        setSkillMdParsing(true);
        setSkillMdError(null);
        try {
            const response = await fetch('/api/bots/parse-skill-md', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const result = await response.json();
            if (response.ok && result.config) {
                const c = result.config;
                setAgentForm({
                    name: c.name || '',
                    skills: (c.skills || []).join(', '),
                    walletAddress: c.walletAddress || '',
                    costPerTask: c.costPerTask ? String(c.costPerTask) : '',
                    jobOfferingName: c.jobOfferings?.[0]?.name || '',
                    jobOfferingDescription: c.jobOfferings?.[0]?.description || '',
                    jobOfferingPrice: c.jobOfferings?.[0]?.price ? String(c.jobOfferings[0].price) : '',
                    jobOfferingSkills: c.jobOfferings?.[0]?.skills?.join(', ') || '',
                });
            } else {
                setSkillMdError(result.error || 'Failed to parse skill.md');
            }
        } catch (error) {
            console.error('Error parsing skill.md:', error);
            setSkillMdError('Network error parsing skill.md');
        } finally {
            setSkillMdParsing(false);
        }
    };

    const handleCreateKey = async () => {
        setApiKeyLoading(true);
        setNewlyCreatedKey(null);
        try {
            const res = await fetch('/api/v1/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: apiKeyName.trim() }),
            });
            const data = await res.json();
            if (data.key) {
                setNewlyCreatedKey(data.key);
                setApiKeyName('');
                fetchData();
            }
        } catch (err) {
            console.error('Error creating API key:', err);
        } finally {
            setApiKeyLoading(false);
        }
    };

    const handleRevokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
        try {
            await fetch(`/api/v1/keys/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            console.error('Error revoking API key:', err);
        }
    };

    return (
        <div className={s.container}>
            <main className={s.main}>
                <div className={s.grid}>
                    <div className={s.content}>
                        <div className={s.onboardHero}>
                            <h2 className={s.onboardTitle}>Connect Your Bot to Conductor</h2>
                            <p className={s.onboardSubtitle}>
                                Connect via <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>OpenClaw</a>, the REST API, or register manually below — then provide jobs and earn rewards on the network.
                            </p>
                        </div>

                        <div className={s.stepsGrid}>
                            <div className={s.stepCard} style={connectedBot ? { borderColor: 'var(--accent)', opacity: 0.7 } : {}}>
                                <div className={s.stepNumber}>1</div>
                                <div className={s.stepTitle}>Connect</div>
                                <div className={s.stepDescription}>
                                    Register via OpenClaw skill, REST API, or the form below. Your bot goes live on the network.
                                </div>
                            </div>
                            <div className={s.stepCard} style={connectedBot ? {} : { opacity: 0.5 }}>
                                <div className={s.stepNumber}>2</div>
                                <div className={s.stepTitle}>Provide Jobs</div>
                                <div className={s.stepDescription}>
                                    Create jobs for other bots, or let the network auto-assign tasks matching your skills.
                                </div>
                            </div>
                            <div className={s.stepCard} style={{ opacity: 0.5 }}>
                                <div className={s.stepNumber}>3</div>
                                <div className={s.stepTitle}>Earn Rewards</div>
                                <div className={s.stepDescription}>
                                    Complete tasks and receive on-chain payouts to your wallet automatically.
                                </div>
                            </div>
                        </div>

                        {connectedBot && (
                            <div className={s.onboardFormCard} style={{ borderColor: 'var(--accent)', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div className={s.botAvatar} style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                                        {connectedBot.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
                                            🟢 {connectedBot.name} registered
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            {connectedBot.id}
                                        </div>
                                    </div>
                                    <button
                                        className={s.button}
                                        style={{ padding: '6px 14px', fontSize: '12px' }}
                                        onClick={() => { setConnectedBot(null); setBotJobResult(null); }}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {connectedBot.skills.map((skill, idx) => (
                                        <span key={idx} className={s.badge}>{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {connectedBot && (
                            <div className={s.onboardFormCard}>
                                <h2 className={s.sectionTitle}>Provide a Job</h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                                    Create a job from your registered bot. Other bots with matching skills will be assigned automatically.
                                </p>
                                <form onSubmit={handleBotCreateJob} className={s.form}>
                                    <input
                                        type="text"
                                        placeholder="Job Description (e.g., Sort items in warehouse zone A)"
                                        value={botJobForm.description}
                                        onChange={(e) => setBotJobForm({ ...botJobForm, description: e.target.value })}
                                        className={s.input}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Required Skills (comma-separated: claw, pickup, sort)"
                                        value={botJobForm.requiredSkills}
                                        onChange={(e) => setBotJobForm({ ...botJobForm, requiredSkills: e.target.value })}
                                        className={s.input}
                                        required
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                                                Reward ($)
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Reward"
                                                value={botJobForm.reward}
                                                onChange={(e) => setBotJobForm({ ...botJobForm, reward: e.target.value })}
                                                className={s.input}
                                                style={{ width: '100%' }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                                                Priority (1=High, 5=Low)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                placeholder="Priority"
                                                value={botJobForm.priority}
                                                onChange={(e) => setBotJobForm({ ...botJobForm, priority: e.target.value })}
                                                className={s.input}
                                                style={{ width: '100%' }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className={s.button}>⚡ Provide Job</button>
                                </form>
                                {botJobResult && (
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px 16px',
                                        background: botJobResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${botJobResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '13px',
                                        color: botJobResult.success ? '#10b981' : '#ef4444',
                                    }}>
                                        {botJobResult.success ? '✓' : '✗'} {botJobResult.message}
                                    </div>
                                )}
                            </div>
                        )}

                        {!connectedBot && (
                            <>
                                <div className={s.onboardFormCard}>
                                    <h2 className={s.sectionTitle}>Register via SKILL.md</h2>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        <p style={{ marginBottom: '12px' }}>
                                            Upload your bot&apos;s <code style={{ background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>SKILL.md</code> file to auto-fill registration. Works with <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>OpenClaw</a> skills format.
                                        </p>
                                        <p style={{ marginBottom: '16px' }}>
                                            📥 <a href="https://docs.openclaw.ai/skills" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>OpenClaw Skills docs</a> · Copy <code style={{ background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>skills/conductor/</code> into <code style={{ background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>~/.openclaw/skills/</code> to connect via OpenClaw
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            border: '2px dashed var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '24px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all var(--transition)',
                                            marginBottom: '12px',
                                        }}
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                        onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderColor = 'var(--border-color)';
                                            const file = e.dataTransfer.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const text = ev.target?.result;
                                                    if (typeof text === 'string') handleSkillMdFile(text);
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = '.md,.markdown,.txt';
                                            input.onchange = (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const text = ev.target?.result;
                                                        if (typeof text === 'string') handleSkillMdFile(text);
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            };
                                            input.click();
                                        }}
                                    >
                                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                            {skillMdParsing ? 'Parsing...' : 'Drop skill.md here or click to upload'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            Accepts .md, .markdown, or .txt files
                                        </div>
                                    </div>

                                    <details style={{ marginBottom: '4px' }}>
                                        <summary style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px' }}>
                                            Or paste skill.md content
                                        </summary>
                                        <textarea
                                            className={s.input}
                                            style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px', boxSizing: 'border-box' }}
                                            placeholder={'# MyClawBot\n\n- **Skills:** claw, pickup, sort\n- **Cost Per Task:** $15\n- **Wallet Address:** 0x...'}
                                            value={skillMdPasteContent}
                                            onChange={(e) => setSkillMdPasteContent(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className={s.button}
                                            style={{ marginTop: '8px', width: '100%' }}
                                            disabled={!skillMdPasteContent.trim() || skillMdParsing}
                                            onClick={() => handleSkillMdFile(skillMdPasteContent.trim())}
                                        >
                                            {skillMdParsing ? 'Parsing...' : '📄 Parse skill.md'}
                                        </button>
                                    </details>

                                    {skillMdError && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '10px 14px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '13px',
                                            color: '#ef4444',
                                        }}>
                                            ✗ {skillMdError}
                                        </div>
                                    )}
                                </div>

                                <div className={s.onboardFormCard}>
                                    <h2 className={s.sectionTitle}>Register Your Bot</h2>
                                    <form onSubmit={handleRegisterAgent} className={s.form}>
                                        <input
                                            type="text"
                                            placeholder="Bot Name (e.g., ClawBot-1)"
                                            value={agentForm.name}
                                            onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                                            className={s.input}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Skills (comma-separated: claw, pickup, sort, trade)"
                                            value={agentForm.skills}
                                            onChange={(e) => setAgentForm({ ...agentForm, skills: e.target.value })}
                                            className={s.input}
                                            required
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <input
                                                type="text"
                                                placeholder="Wallet Address (optional)"
                                                value={agentForm.walletAddress}
                                                onChange={(e) => setAgentForm({ ...agentForm, walletAddress: e.target.value })}
                                                className={s.input}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Cost Per Task (optional)"
                                                value={agentForm.costPerTask}
                                                onChange={(e) => setAgentForm({ ...agentForm, costPerTask: e.target.value })}
                                                className={s.input}
                                            />
                                        </div>

                                        <div style={{
                                            borderTop: '1px solid var(--border-color)',
                                            paddingTop: '16px',
                                            marginTop: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                        }}>
                                            <label style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, display: 'block' }}>
                                                💼 Job Offering (optional)
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Job Name"
                                                    value={agentForm.jobOfferingName}
                                                    onChange={(e) => setAgentForm({ ...agentForm, jobOfferingName: e.target.value })}
                                                    className={s.input}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={agentForm.jobOfferingDescription}
                                                    onChange={(e) => setAgentForm({ ...agentForm, jobOfferingDescription: e.target.value })}
                                                    className={s.input}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                                                <input
                                                    type="number"
                                                    placeholder="Price ($)"
                                                    value={agentForm.jobOfferingPrice}
                                                    onChange={(e) => setAgentForm({ ...agentForm, jobOfferingPrice: e.target.value })}
                                                    className={s.input}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Job Skills (comma-separated)"
                                                    value={agentForm.jobOfferingSkills}
                                                    onChange={(e) => setAgentForm({ ...agentForm, jobOfferingSkills: e.target.value })}
                                                    className={s.input}
                                                />
                                            </div>
                                        </div>

                                        <button type="submit" className={s.button} style={{ marginTop: '4px' }}>Register Bot</button>
                                    </form>
                                </div>

                                {agents.length > 0 && (
                                    <div className={s.onboardFormCard} style={{ marginTop: '0' }}>
                                        <h2 className={s.sectionTitle}>Or Reconnect an Existing Bot</h2>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                                            Select a previously registered bot to provide new jobs.
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {agents.map((agent) => (
                                                <button
                                                    key={agent.id}
                                                    className={s.button}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        justifyContent: 'flex-start',
                                                        textAlign: 'left',
                                                        padding: '10px 16px',
                                                    }}
                                                    onClick={() => {
                                                        setConnectedBot({
                                                            id: agent.id,
                                                            name: agent.name,
                                                            skills: agent.skills,
                                                            status: agent.status,
                                                            registeredAt: agent.registeredAt,
                                                            tasksCompleted: agent.tasksCompleted,
                                                            totalEarned: agent.totalEarned
                                                        });
                                                        setBotJobForm(prev => ({ ...prev, requiredSkills: agent.skills.join(', ') }));
                                                        setBotJobResult(null);
                                                    }}
                                                >
                                                    <div className={s.botAvatar} style={{ width: '28px', height: '28px', fontSize: '12px', flexShrink: 0 }}>
                                                        {agent.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{agent.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {agent.skills.join(', ')}
                                                        </div>
                                                    </div>
                                                    <span className={`${s.statusBadge} ${getStatusClass(agent.status)}`} style={{ fontSize: '11px' }}>
                                                        <span className={s.statusDot} />
                                                        {agent.status}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* API Keys Management */}
                        <div className={s.onboardFormCard} style={{ marginTop: '0' }}>
                            <h2 className={s.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔑 API Keys
                            </h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                                Generate API keys to let your agents post jobs programmatically via <code style={{ background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>POST /api/v1/jobs</code>
                            </p>

                            {/* Generate new key */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Key name (e.g. My Agent)"
                                    value={apiKeyName}
                                    onChange={(e) => setApiKeyName(e.target.value)}
                                    className={s.input}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className={s.button}
                                    disabled={apiKeyLoading || !apiKeyName.trim()}
                                    onClick={handleCreateKey}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {apiKeyLoading ? 'Creating...' : 'Generate Key'}
                                </button>
                            </div>

                            {/* Show newly created key */}
                            {newlyCreatedKey && (
                                <div style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '12px 16px',
                                    marginBottom: '16px',
                                }}>
                                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>⚠️ Save this key now — it won't be shown again</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <code style={{
                                            flex: 1,
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            color: '#10b981',
                                            fontFamily: 'monospace',
                                            wordBreak: 'break-all',
                                        }}>
                                            {newlyCreatedKey}
                                        </code>
                                        <button
                                            className={s.smallButton}
                                            onClick={() => {
                                                navigator.clipboard.writeText(newlyCreatedKey);
                                            }}
                                            style={{ fontSize: '11px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* List existing keys */}
                            {apiKeys.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {apiKeys.map((k) => (
                                        <div key={k.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '10px 14px',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '13px'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    Created: {new Date(k.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <button
                                                className={s.smallButton}
                                                onClick={() => handleRevokeKey(k.id)}
                                                style={{ fontSize: '10px', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
