"""
Base Bot class for swarm communication system.
"""
import uuid
import time
from enum import Enum
from typing import Dict, Any, Optional


class BotType(Enum):
    """Types of bots in the swarm"""
    LEADER = "leader"
    FOLLOWER = "follower"


class BotStatus(Enum):
    """Status of a bot"""
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"


class Message:
    """Message structure for communication between bots"""
    def __init__(self, sender_id: str, msg_type: str, content: Dict[str, Any]):
        self.id = str(uuid.uuid4())
        self.sender_id = sender_id
        self.msg_type = msg_type
        self.content = content
        self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'msg_type': self.msg_type,
            'content': self.content,
            'timestamp': self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        msg = cls(
            sender_id=data['sender_id'],
            msg_type=data['msg_type'],
            content=data['content']
        )
        msg.id = data['id']
        msg.timestamp = data['timestamp']
        return msg


class Bot:
    """Base class for all bots in the swarm"""
    
    def __init__(self, bot_id: Optional[str] = None, name: Optional[str] = None):
        self.bot_id = bot_id or str(uuid.uuid4())
        self.name = name or f"Bot-{self.bot_id[:8]}"
        self.status = BotStatus.IDLE
        self.message_queue = []
        
    def send_message(self, recipient_id: str, msg_type: str, content: Dict[str, Any]) -> Message:
        """Send a message to another bot"""
        message = Message(self.bot_id, msg_type, content)
        return message
    
    def receive_message(self, message: Message):
        """Receive a message from another bot"""
        self.message_queue.append(message)
        self.process_message(message)
    
    def process_message(self, message: Message):
        """Process received message - to be overridden by subclasses"""
        print(f"[{self.name}] Received message: {message.msg_type}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current bot status"""
        return {
            'bot_id': self.bot_id,
            'name': self.name,
            'status': self.status.value
        }
