import s from '@/styles/Home.module.css';

export const getStatusClass = (status: string) => {
    switch (status) {
        case 'idle': return s.statusIdle;
        case 'busy': return s.statusBusy;
        case 'offline': return s.statusOffline;
        case 'pending': return s.statusPending;
        case 'assigned': return s.statusAssigned;
        case 'completed': return s.statusCompleted;
        case 'failed': return s.statusFailed;
        default: return s.statusPending;
    }
};

export const getHealthBadge = (health?: string) => {
    if (!health) return null;
    const healthColors = {
        healthy: '🟢',
        degraded: '🟡',
        unhealthy: '🔴'
    };
    // @ts-ignore
    return healthColors[health] || '';
};

export const getPriorityLabel = (priority?: number) => {
    if (!priority) return 'Medium';
    if (priority <= 2) return 'High';
    if (priority >= 4) return 'Low';
    return 'Medium';
};

export const getPriorityColor = (priority?: number) => {
    if (!priority) return '#f59e0b';
    if (priority <= 2) return '#ef4444';
    if (priority >= 4) return '#10b981';
    return '#f59e0b';
};
