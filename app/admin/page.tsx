
'use client';

import { useState, useEffect } from 'react';
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

// Replace with your Client ID
const client = createThirdwebClient({ clientId: "YOUR_CLIENT_ID" });

export default function AdminPage() {
    const account = useActiveAccount();
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [pendingAgents, setPendingAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load key from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('admin_api_key');
        if (stored) setApiKey(stored);
    }, []);

    // Fetch pending agents
    const fetchAgents = async () => {
        if (!apiKey) return;
        setLoading(true);
        try {
            // We need a way to list agents. 
            // We can use the public /api/agents endpoint if it returns status?
            // Wait, we need an endpoint to LIST pending agents.
            // Let's assume /api/admin/agents?status=pending 
            // OR we just fetch all agents and filter client side for now since /api/agents likely returns all.
            const res = await fetch('/api/agents');
            const data = await res.json();
            if (data.agents) {
                const pending = data.agents.filter((a: any) => a.verificationStatus === 'pending');
                setPendingAgents(pending);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (apiKey) fetchAgents();
    }, [apiKey]);

    const handleLogin = async () => {
        if (!account) return;
        try {
            const message = "Login to Conductor Admin Panel";
            const signature = await account.signMessage({ message });

            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: account.address,
                    message,
                    signature
                })
            });

            const data = await res.json();
            if (data.success && data.apiKey) {
                setApiKey(data.apiKey);
                localStorage.setItem('admin_api_key', data.apiKey);
                fetchAgents();
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleApprove = async (agentId: string, approved: boolean) => {
        if (!apiKey) return;
        try {
            const res = await fetch('/api/admin/approve-agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({ agentId, approved })
            });
            if (res.ok) {
                // Refresh
                fetchAgents();
            } else {
                alert('Action failed');
            }
        } catch (err) {
            alert('Error');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-3xl mb-8 text-cyan-400">Admin Panel</h1>

            {!account ? (
                <div className="border border-gray-800 p-8 rounded flex flex-col items-center">
                    <p className="mb-4">Connect wallet to claim admin or login.</p>
                    <ConnectButton client={client} />
                </div>
            ) : !apiKey ? (
                <div className="border border-gray-800 p-8 rounded flex flex-col items-center">
                    <p className="mb-4 text-green-400">Connected: {account.address}</p>
                    <button
                        onClick={handleLogin}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded"
                    >
                        Sign to Login / Claim Admin
                    </button>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-400">Logged in as Admin</p>
                        <button onClick={() => { setApiKey(null); localStorage.removeItem('admin_api_key'); }} className="text-red-400">Logout</button>
                    </div>

                    <div className="grid gap-6">
                        <h2 className="text-xl border-b border-gray-800 pb-2">Pending Agents</h2>
                        {loading && <p>Loading...</p>}
                        {pendingAgents.length === 0 && !loading && <p className="text-gray-500">No pending agents.</p>}

                        {pendingAgents.map(agent => (
                            <div key={agent.id} className="border border-gray-800 p-4 rounded flex justify-between items-center bg-gray-900/50">
                                <div>
                                    <p className="font-bold text-lg">{agent.name}</p>
                                    <p className="text-sm text-gray-400">{agent.id}</p>
                                    <p className="text-xs text-cyan-500 mt-1">Wallet: {agent.walletAddress}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(agent.id, true)}
                                        className="bg-green-600/20 text-green-400 border border-green-600/50 px-4 py-2 rounded hover:bg-green-600/40"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApprove(agent.id, false)}
                                        className="bg-red-600/20 text-red-400 border border-red-600/50 px-4 py-2 rounded hover:bg-red-600/40"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
