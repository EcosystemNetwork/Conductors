"""
Follower Bot - Executes tasks assigned by the leader
"""
from typing import Optional, Dict, Any
from bot import Bot, BotType, BotStatus, Message
import time


class FollowerBot(Bot):
    """Follower bot that executes tasks from the leader"""
    
    def __init__(self, leader_id: str, bot_id: Optional[str] = None, name: Optional[str] = None):
        super().__init__(bot_id, name)
        self.bot_type = BotType.FOLLOWER
        self.leader_id = leader_id
        self.current_task: Optional[Dict[str, Any]] = None
        
    def register_with_leader(self) -> Message:
        """Register this bot with the leader"""
        message = self.send_message(
            self.leader_id, 
            'register', 
            {
                'name': self.name,
                'timestamp': time.time()
            }
        )
        print(f"[{self.name}] Registering with leader...")
        return message
    
    def unregister_from_leader(self) -> Message:
        """Unregister this bot from the leader"""
        message = self.send_message(
            self.leader_id,
            'unregister',
            {'timestamp': time.time()}
        )
        print(f"[{self.name}] Unregistering from leader...")
        return message
    
    def send_status_update(self, status: BotStatus) -> Message:
        """Send status update to leader"""
        self.status = status
        message = self.send_message(
            self.leader_id,
            'status_update',
            {
                'status': status.value,
                'timestamp': time.time()
            }
        )
        return message
    
    def execute_task(self, task: Dict[str, Any]):
        """Execute a task - simulate task execution"""
        self.current_task = task
        self.status = BotStatus.BUSY
        
        print(f"[{self.name}] Executing task: {task.get('description', 'No description')}")
        
        # Simulate task execution
        duration = task.get('duration', 1)
        time.sleep(duration)
        
        print(f"[{self.name}] Task completed!")
        self.status = BotStatus.IDLE
        self.current_task = None
    
    def report_task_complete(self, task: Dict[str, Any]) -> Message:
        """Report task completion to leader"""
        message = self.send_message(
            self.leader_id,
            'task_complete',
            {
                'task': task,
                'timestamp': time.time()
            }
        )
        return message
    
    def process_message(self, message: Message):
        """Process messages from the leader"""
        if message.msg_type == 'task_assignment':
            if message.sender_id == self.leader_id:
                task = message.content
                self.execute_task(task)
                # Note: In this synchronous simulation, task completion is reported
                # via coordinator.report_task_complete(). In a real async system,
                # this message would be sent back to the coordinator/leader here.
                print(f"[{self.name}] Task execution complete")
            else:
                print(f"[{self.name}] Ignoring task from non-leader: {message.sender_id}")
        
        elif message.msg_type == 'status_request':
            if message.sender_id == self.leader_id:
                status_msg = self.send_status_update(self.status)
                # Note: In a real system, this would be sent via the coordinator
                print(f"[{self.name}] Status update prepared")
