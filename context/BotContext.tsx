'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interfaces matching those in app/page.tsx
export interface JobOffering {
    name: string;
    description: string;
    price: number;
    skills: string[];
}

export interface Agent {
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

export interface Task {
    id: string;
    description: string;
    requiredSkills: string[];
    status: 'pending' | 'assigned' | 'completed' | 'failed';
    assignedTo?: string;
    createdAt: number;
    completedAt?: number;
    reward: number;
    priority?: number;
    retryCount?: number;
    maxRetries?: number;
    lastAttemptAt?: number;
}

export interface Payout {
    id: string;
    agentId: string;
    taskId: string;
    amount: number;
    timestamp: number;
    status: 'pending' | 'completed';
    transactionHash?: string;
}

export interface Submission {
    id: string;
    type: 'job' | 'swarm';
    source: 'dashboard' | 'planner' | 'bot-api';
    submittedAt: number;
    totalCost: number;
    taskIds: string[];
    agentIds: string[];
    status: 'submitted' | 'in-progress' | 'completed' | 'failed';
    taskCount: number;
    agentCount: number;
    description: string;
    progress?: {
        completed: number;
        failed: number;
        pending: number;
        assigned: number;
        total: number;
    };
}

interface BotJobResult {
    success: boolean;
    message: string;
}

interface BotContextType {
    connectedBot: Agent | null;
    setConnectedBot: (bot: Agent | null) => void;
    botJobResult: BotJobResult | null;
    setBotJobResult: (result: BotJobResult | null) => void;
    apiKey: string | null;
    setApiKey: (key: string | null) => void;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export function BotProvider({ children }: { children: ReactNode }) {
    const [connectedBot, setConnectedBot] = useState<Agent | null>(null);
    const [botJobResult, setBotJobResult] = useState<BotJobResult | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);

    // Auto-heartbeat effect
    useEffect(() => {
        if (!connectedBot) return;

        const sendHeartbeat = async () => {
            try {
                await fetch('/api/agents/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId: connectedBot.id })
                });
            } catch (error) {
                console.error('Heartbeat failed:', error);
            }
        };

        // Send immediately on connect
        sendHeartbeat();

        // Then every 25s
        const interval = setInterval(sendHeartbeat, 25000);
        return () => clearInterval(interval);
    }, [connectedBot]);

    return (
        <BotContext.Provider value={{ connectedBot, setConnectedBot, botJobResult, setBotJobResult, apiKey, setApiKey }}>
            {children}
        </BotContext.Provider>
    );
}

export function useBot() {
    const context = useContext(BotContext);
    if (context === undefined) {
        throw new Error('useBot must be used within a BotProvider');
    }
    return context;
}
