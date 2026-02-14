"""
Network Communication Module for TCP/UDP support
Enables remote bot communication over network protocols
"""
import socket
import json
import threading
from typing import Optional, Callable, Dict, Any
from bot import Message


class NetworkServer:
    """TCP/UDP server for network-based bot communication"""
    
    def __init__(self, host: str = '0.0.0.0', port: int = 8888, protocol: str = 'TCP'):
        self.host = host
        self.port = port
        self.protocol = protocol.upper()
        self.socket: Optional[socket.socket] = None
        self.running = False
        self.message_handler: Optional[Callable[[Message], None]] = None
        
        if self.protocol not in ['TCP', 'UDP']:
            raise ValueError("Protocol must be 'TCP' or 'UDP'")
    
    def set_message_handler(self, handler: Callable[[Message], None]):
        """Set the message handler callback"""
        self.message_handler = handler
    
    def start(self):
        """Start the network server"""
        if self.protocol == 'TCP':
            self._start_tcp_server()
        else:
            self._start_udp_server()
    
    def _start_tcp_server(self):
        """Start TCP server"""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind((self.host, self.port))
        self.socket.listen(5)
        self.running = True
        
        print(f"[NetworkServer] TCP server listening on {self.host}:{self.port}")
        
        while self.running:
            try:
                self.socket.settimeout(1.0)
                client_socket, address = self.socket.accept()
                print(f"[NetworkServer] Connection from {address}")
                
                # Handle client in a new thread
                client_thread = threading.Thread(
                    target=self._handle_tcp_client,
                    args=(client_socket,)
                )
                client_thread.daemon = True
                client_thread.start()
            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f"[NetworkServer] Error accepting connection: {e}")
    
    def _handle_tcp_client(self, client_socket: socket.socket):
        """Handle TCP client connection"""
        try:
            data = b''
            while True:
                chunk = client_socket.recv(4096)
                if not chunk:
                    break
                data += chunk
                
                # Try to parse complete JSON messages
                try:
                    message_data = json.loads(data.decode('utf-8'))
                    message = Message.from_dict(message_data)
                    
                    if self.message_handler:
                        self.message_handler(message)
                    
                    # Send acknowledgment
                    response = json.dumps({'status': 'received', 'message_id': message.id})
                    client_socket.sendall(response.encode('utf-8'))
                    
                    data = b''
                except json.JSONDecodeError:
                    # Incomplete message, continue receiving
                    if len(data) > 1024 * 1024:  # 1MB limit
                        print("[NetworkServer] Message too large, closing connection")
                        break
                    continue
        except Exception as e:
            print(f"[NetworkServer] Error handling client: {e}")
        finally:
            client_socket.close()
    
    def _start_udp_server(self):
        """Start UDP server"""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.bind((self.host, self.port))
        self.running = True
        
        print(f"[NetworkServer] UDP server listening on {self.host}:{self.port}")
        
        while self.running:
            try:
                self.socket.settimeout(1.0)
                data, address = self.socket.recvfrom(4096)
                
                try:
                    message_data = json.loads(data.decode('utf-8'))
                    message = Message.from_dict(message_data)
                    
                    if self.message_handler:
                        self.message_handler(message)
                    
                    # Send acknowledgment
                    response = json.dumps({'status': 'received', 'message_id': message.id})
                    self.socket.sendto(response.encode('utf-8'), address)
                except json.JSONDecodeError:
                    print(f"[NetworkServer] Invalid JSON from {address}")
            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f"[NetworkServer] Error receiving data: {e}")
    
    def stop(self):
        """Stop the network server"""
        self.running = False
        if self.socket:
            self.socket.close()
        print("[NetworkServer] Server stopped")


class NetworkClient:
    """TCP/UDP client for network-based bot communication"""
    
    def __init__(self, host: str, port: int, protocol: str = 'TCP'):
        self.host = host
        self.port = port
        self.protocol = protocol.upper()
        
        if self.protocol not in ['TCP', 'UDP']:
            raise ValueError("Protocol must be 'TCP' or 'UDP'")
    
    def send_message(self, message: Message) -> bool:
        """Send a message over the network"""
        try:
            message_data = json.dumps(message.to_dict()).encode('utf-8')
            
            if self.protocol == 'TCP':
                return self._send_tcp(message_data)
            else:
                return self._send_udp(message_data)
        except Exception as e:
            print(f"[NetworkClient] Error sending message: {e}")
            return False
    
    def _send_tcp(self, data: bytes) -> bool:
        """Send data via TCP"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(5.0)
                sock.connect((self.host, self.port))
                sock.sendall(data)
                
                # Wait for acknowledgment
                response = sock.recv(1024)
                ack = json.loads(response.decode('utf-8'))
                return ack.get('status') == 'received'
        except Exception as e:
            print(f"[NetworkClient] TCP send error: {e}")
            return False
    
    def _send_udp(self, data: bytes) -> bool:
        """Send data via UDP"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.settimeout(5.0)
                sock.sendto(data, (self.host, self.port))
                
                # Wait for acknowledgment
                response, _ = sock.recvfrom(1024)
                ack = json.loads(response.decode('utf-8'))
                return ack.get('status') == 'received'
        except Exception as e:
            print(f"[NetworkClient] UDP send error: {e}")
            return False


class NetworkCoordinator:
    """Network-enabled coordinator for distributed bot swarms"""
    
    def __init__(self, coordinator, host: str = '0.0.0.0', port: int = 8888, protocol: str = 'TCP'):
        self.coordinator = coordinator
        self.server = NetworkServer(host, port, protocol)
        self.server.set_message_handler(self._handle_network_message)
        self.server_thread: Optional[threading.Thread] = None
    
    def start(self):
        """Start the network coordinator"""
        self.server_thread = threading.Thread(target=self.server.start)
        self.server_thread.daemon = True
        self.server_thread.start()
        print(f"[NetworkCoordinator] Started on {self.server.host}:{self.server.port}")
    
    def stop(self):
        """Stop the network coordinator"""
        self.server.stop()
        if self.server_thread:
            self.server_thread.join(timeout=5.0)
    
    def _handle_network_message(self, message: Message):
        """Handle messages received over the network"""
        print(f"[NetworkCoordinator] Received network message: {message.msg_type}")
        self.coordinator.route_message(message)
