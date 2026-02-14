"""
Leader Bot (Conductor) - Coordinates the swarm of claw bots
"""
from typing import Dict, List, Any, Optional
from bot import Bot, BotType, BotStatus, Message


class LeaderBot(Bot):
    """Leader bot that coordinates swarm tasks"""
    
    def __init__(self, bot_id: Optional[str] = None, name: Optional[str] = None):
        super().__init__(bot_id, name or "Leader")
        self.bot_type = BotType.LEADER
        self.followers: Dict[str, Dict[str, Any]] = {}
        self.task_queue: List[Dict[str, Any]] = []
        self.completed_tasks: List[Dict[str, Any]] = []
        
    def register_follower(self, follower_id: str, follower_info: Dict[str, Any]):
        """Register a new follower bot"""
        self.followers[follower_id] = {
            'id': follower_id,
            'name': follower_info.get('name', f'Follower-{follower_id[:8]}'),
            'status': BotStatus.IDLE.value,
            'registered_at': follower_info.get('timestamp', 0)
        }
        print(f"[{self.name}] Registered new follower: {self.followers[follower_id]['name']}")
    
    def unregister_follower(self, follower_id: str):
        """Unregister a follower bot"""
        if follower_id in self.followers:
            follower_name = self.followers[follower_id]['name']
            del self.followers[follower_id]
            print(f"[{self.name}] Unregistered follower: {follower_name}")
    
    def assign_task(self, follower_id: str, task: Dict[str, Any]) -> Optional[Message]:
        """Assign a task to a specific follower"""
        if follower_id not in self.followers:
            print(f"[{self.name}] Error: Follower {follower_id} not registered")
            return None
        
        if self.followers[follower_id]['status'] != BotStatus.IDLE.value:
            print(f"[{self.name}] Warning: Follower {follower_id} is not idle")
            return None
        
        self.followers[follower_id]['status'] = BotStatus.BUSY.value
        message = self.send_message(follower_id, 'task_assignment', task)
        print(f"[{self.name}] Assigned task to {self.followers[follower_id]['name']}: {task.get('description', 'No description')}")
        return message
    
    def broadcast_task(self, task: Dict[str, Any]) -> List[Message]:
        """Broadcast a task to all idle followers"""
        messages = []
        idle_followers = [fid for fid, info in self.followers.items() 
                         if info['status'] == BotStatus.IDLE.value]
        
        if not idle_followers:
            print(f"[{self.name}] No idle followers available for task")
            return messages
        
        # Assign to first idle follower
        follower_id = idle_followers[0]
        message = self.assign_task(follower_id, task)
        if message:
            messages.append(message)
        
        return messages
    
    def process_message(self, message: Message):
        """Process messages from follower bots"""
        if message.msg_type == 'register':
            self.register_follower(message.sender_id, message.content)
            
        elif message.msg_type == 'status_update':
            if message.sender_id in self.followers:
                self.followers[message.sender_id]['status'] = message.content.get('status', BotStatus.IDLE.value)
                print(f"[{self.name}] Follower {self.followers[message.sender_id]['name']} status: {message.content.get('status')}")
                
        elif message.msg_type == 'task_complete':
            if message.sender_id in self.followers:
                self.followers[message.sender_id]['status'] = BotStatus.IDLE.value
                self.completed_tasks.append({
                    'task': message.content.get('task'),
                    'follower_id': message.sender_id,
                    'completed_at': message.timestamp
                })
                print(f"[{self.name}] Task completed by {self.followers[message.sender_id]['name']}")
        
        elif message.msg_type == 'unregister':
            self.unregister_follower(message.sender_id)
    
    def get_swarm_status(self) -> Dict[str, Any]:
        """Get status of entire swarm"""
        return {
            'leader': self.get_status(),
            'followers': list(self.followers.values()),
            'total_followers': len(self.followers),
            'idle_followers': sum(1 for f in self.followers.values() if f['status'] == BotStatus.IDLE.value),
            'busy_followers': sum(1 for f in self.followers.values() if f['status'] == BotStatus.BUSY.value),
            'completed_tasks': len(self.completed_tasks)
        }
    
    def add_task_to_queue(self, task: Dict[str, Any]):
        """Add a task to the queue"""
        self.task_queue.append(task)
        print(f"[{self.name}] Added task to queue: {task.get('description', 'No description')}")
    
    def process_task_queue(self) -> List[Message]:
        """Process queued tasks by assigning to idle followers"""
        messages = []
        while self.task_queue:
            idle_followers = [fid for fid, info in self.followers.items() 
                            if info['status'] == BotStatus.IDLE.value]
            if not idle_followers:
                break
            
            task = self.task_queue.pop(0)
            task_messages = self.broadcast_task(task)
            messages.extend(task_messages)
        
        return messages
