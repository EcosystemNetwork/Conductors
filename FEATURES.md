# Conductor Roadmap Features - Quick Start Guide

This guide demonstrates the new features implemented in the Conductor roadmap.

## 🚀 Quick Start

### 1. Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## 📋 Task Priority System

Create tasks with priority levels (1=highest, 5=lowest):

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "description": "URGENT: Fix critical security bug",
    "requiredSkills": ["security", "debugging"],
    "reward": 100,
    "priority": 1,
    "maxRetries": 3
  }'
```

Tasks are automatically sorted by priority, with highest priority tasks assigned first.

## 🔄 Task Retry Mechanism

Failed tasks can be automatically retried up to the configured limit:

### Automatic Retry on Failure
```bash
# Mark task as failed - it will auto-retry if under max retries
curl -X POST http://localhost:3000/api/tasks/complete \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-xxx",
    "agentId": "agent-xxx",
    "success": false
  }'
```

### Manual Retry
```bash
curl -X POST http://localhost:3000/api/tasks/retry \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-xxx"
  }'
```

## 🏥 Health Monitoring

### Send Heartbeat
```bash
curl -X POST http://localhost:3000/api/agents/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-xxx"
  }'
```

### Check Agent Health
```bash
curl http://localhost:3000/api/agents/health
```

Health status is automatically calculated:
- **Healthy**: Heartbeat within 15 seconds
- **Degraded**: Heartbeat 15-30 seconds ago
- **Unhealthy**: Heartbeat >30 seconds ago
- **Offline**: Agent marked offline automatically after 30s

## 📊 Task History

View complete history of all completed and failed tasks:

```bash
curl http://localhost:3000/api/tasks/history
```

Or view in the dashboard by clicking the "History" tab.

## 🎮 Remote Agent Control

Control agents remotely via REST API:

### Start an Agent
```bash
curl -X POST http://localhost:3000/api/agents/control \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-xxx",
    "command": "start"
  }'
```

### Stop an Agent
```bash
curl -X POST http://localhost:3000/api/agents/control \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-xxx",
    "command": "stop"
  }'
```

### Manually Assign Task
```bash
curl -X POST http://localhost:3000/api/agents/control \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-xxx",
    "command": "assign_task",
    "parameters": {
      "taskId": "task-xxx"
    }
  }'
```

### Update Agent Skills
```bash
curl -X POST http://localhost:3000/api/agents/control \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-xxx",
    "command": "update_skills",
    "parameters": {
      "skills": ["new_skill1", "new_skill2"]
    }
  }'
```

## 🌐 Network Status

Get comprehensive network statistics:

```bash
curl http://localhost:3000/api/network/status
```

Returns:
- Agent statistics (total, idle, busy, offline, health breakdown)
- Task statistics (total, pending, assigned, completed, failed, by priority)
- Payout statistics
- Task history summary
- Network uptime

## 🔌 WebSocket Real-time Updates

Connect to the WebSocket server for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to an agent's updates
ws.send(JSON.stringify({
  type: 'subscribe',
  agentId: 'agent-xxx'
}));

// Listen for updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update received:', data);
  // Types: 'task_update', 'agent_update', 'task_created', 'task_completed'
};

// Send heartbeat via WebSocket
ws.send(JSON.stringify({
  type: 'heartbeat',
  agentId: 'agent-xxx'
}));

// Ping/Pong
ws.send(JSON.stringify({ type: 'ping' }));
```

## 🐍 Python Network Communication

For distributed bot swarms using TCP/UDP:

```python
from network_communication import NetworkServer, NetworkClient, NetworkCoordinator
from swarm_coordinator import SwarmCoordinator
from leader_bot import LeaderBot
from follower_bot import FollowerBot

# Setup coordinator with network support
coordinator = SwarmCoordinator()
leader = LeaderBot(name="NetworkLeader")
coordinator.set_leader(leader)

# Start network server
network_coord = NetworkCoordinator(
    coordinator, 
    host='0.0.0.0', 
    port=8888, 
    protocol='TCP'  # or 'UDP'
)
network_coord.start()

print("Network coordinator running on port 8888")

# From another machine/process - connect a remote bot
client = NetworkClient(host='coordinator-host', port=8888, protocol='TCP')

# Create and send messages
from bot import Message
follower = FollowerBot(leader_id="remote-leader", name="RemoteBot")
register_msg = follower.register_with_leader()
client.send_message(register_msg)
```

## 📱 Enhanced Dashboard Features

Access the dashboard at http://localhost:3000 to see:

### Dashboard Tab
- 6 comprehensive stat cards showing:
  - Total agents (with idle/busy/offline breakdown)
  - Healthy agents (with degraded/unhealthy counts)
  - Total tasks (with pending/assigned breakdown)
  - High priority tasks count
  - Completed tasks (with failed count)
  - Total payouts

### Marketplace Tab
- Agent cards with health indicators (🟢🟡🔴)
- Status badges (idle/busy/offline)
- Filter agents by skills

### Tasks Tab
- Priority column with color-coded badges
- Retry count column (X/Y format)
- Retry button for failed tasks
- Complete button for assigned tasks
- Sortable by all columns

### History Tab
- Complete historical record
- Shows priority, status, agent, reward, completion time
- Sortable and filterable

### Task Creation
- Priority selector (1-5)
- Max retries configuration
- Skills and reward inputs

## 🧪 Testing the Features

### Test Priority System
1. Create 3 tasks with different priorities (1, 3, 5)
2. Observe they are assigned in priority order (high to low)
3. Check the Tasks tab to see priority badges

### Test Retry Mechanism
1. Create a task and let it get assigned
2. Mark it as failed (success: false)
3. Observe it gets automatically retried (status changes to pending)
4. Check the retry count increases

### Test Health Monitoring
1. Register an agent
2. Send heartbeat immediately - status should be "healthy" 🟢
3. Wait 20 seconds without sending heartbeat - status becomes "degraded" 🟡
4. Wait 35 seconds - status becomes "unhealthy" 🔴 and "offline"

### Test Task History
1. Complete several tasks
2. Navigate to History tab
3. See all completed/failed tasks with timestamps

## 📖 More Information

- See [API.md](./API.md) for complete API documentation
- See [README.md](./README.md) for architecture details
- See code comments for implementation details
