"""
Swarm Coordinator - Manages communication between leader and follower bots
"""
from typing import Dict, List, Optional
from leader_bot import LeaderBot
from follower_bot import FollowerBot
from bot import Message


class SwarmCoordinator:
    """Coordinates communication between all bots in the swarm"""
    
    def __init__(self):
        self.leader: Optional[LeaderBot] = None
        self.followers: Dict[str, FollowerBot] = {}
        self.message_log: List[Message] = []
    
    def set_leader(self, leader: LeaderBot):
        """Set the leader bot for the swarm"""
        self.leader = leader
        print(f"[Coordinator] Leader set: {leader.name}")
    
    def add_follower(self, follower: FollowerBot):
        """Add a follower bot to the swarm"""
        self.followers[follower.bot_id] = follower
        print(f"[Coordinator] Added follower: {follower.name}")
        
        # Register follower with leader
        if self.leader:
            register_msg = follower.register_with_leader()
            self.route_message(register_msg)
    
    def remove_follower(self, follower_id: str):
        """Remove a follower bot from the swarm"""
        if follower_id in self.followers:
            follower = self.followers[follower_id]
            # Unregister from leader
            if self.leader:
                unregister_msg = follower.unregister_from_leader()
                self.route_message(unregister_msg)
            
            follower_name = follower.name
            del self.followers[follower_id]
            print(f"[Coordinator] Removed follower: {follower_name}")
    
    def route_message(self, message: Message):
        """Route a message to its intended recipient"""
        self.message_log.append(message)
        
        # Route to the intended recipient
        if self.leader and message.recipient_id == self.leader.bot_id:
            # Message to leader
            self.leader.receive_message(message)
        elif message.recipient_id in self.followers:
            # Message to a specific follower
            self.followers[message.recipient_id].receive_message(message)
    
    def assign_task_from_leader(self, follower_id: str, task: Dict):
        """Leader assigns task to specific follower"""
        if not self.leader:
            print("[Coordinator] Error: No leader set")
            return
        
        message = self.leader.assign_task(follower_id, task)
        if message and follower_id in self.followers:
            self.followers[follower_id].receive_message(message)
            self.message_log.append(message)
    
    def broadcast_task_from_leader(self, task: Dict):
        """Leader broadcasts task to idle followers"""
        if not self.leader:
            print("[Coordinator] Error: No leader set")
            return
        
        messages = self.leader.broadcast_task(task)
        for message in messages:
            # Route message to its intended recipient
            if message.recipient_id in self.followers:
                self.followers[message.recipient_id].receive_message(message)
                self.message_log.append(message)
    
    def report_task_complete(self, follower_id: str, task: Dict):
        """Follower reports task completion to leader"""
        if follower_id not in self.followers:
            print("[Coordinator] Error: Unknown follower")
            return
        
        if not self.leader:
            print("[Coordinator] Error: No leader set")
            return
        
        follower = self.followers[follower_id]
        message = follower.report_task_complete(task)
        self.leader.receive_message(message)
        self.message_log.append(message)
    
    def get_swarm_status(self):
        """Get complete swarm status"""
        if not self.leader:
            return {"error": "No leader set"}
        
        return self.leader.get_swarm_status()
    
    def process_queued_tasks(self):
        """Process any queued tasks in the leader"""
        if not self.leader:
            print("[Coordinator] Error: No leader set")
            return
        
        messages = self.leader.process_task_queue()
        for message in messages:
            # Route messages to their intended recipients
            if message.recipient_id in self.followers:
                self.followers[message.recipient_id].receive_message(message)
                self.message_log.append(message)
