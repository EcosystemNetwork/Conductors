#!/usr/bin/env python3
"""
Example usage of the Claw Bot Swarm Communication System

This example demonstrates:
1. Creating a leader bot (Conductor)
2. Adding follower bots to the swarm
3. Assigning tasks to bots
4. Monitoring swarm status
5. Dynamically adding more bots as needed
"""

from leader_bot import LeaderBot
from follower_bot import FollowerBot
from swarm_coordinator import SwarmCoordinator
import time


def print_separator():
    print("\n" + "="*60 + "\n")


def main():
    print("🤖 Claw Bot Swarm Communication System Demo")
    print_separator()
    
    # Step 1: Create the swarm coordinator
    print("Step 1: Initializing Swarm Coordinator...")
    coordinator = SwarmCoordinator()
    print_separator()
    
    # Step 2: Create and set the leader bot
    print("Step 2: Creating Leader Bot (Conductor)...")
    leader = LeaderBot(name="Conductor-Alpha")
    coordinator.set_leader(leader)
    print_separator()
    
    # Step 3: Add initial follower bots
    print("Step 3: Adding Initial Follower Bots...")
    follower1 = FollowerBot(leader.bot_id, name="ClawBot-1")
    follower2 = FollowerBot(leader.bot_id, name="ClawBot-2")
    
    coordinator.add_follower(follower1)
    coordinator.add_follower(follower2)
    print_separator()
    
    # Step 4: Check initial swarm status
    print("Step 4: Initial Swarm Status")
    status = coordinator.get_swarm_status()
    print(f"Leader: {status['leader']['name']}")
    print(f"Total Followers: {status['total_followers']}")
    print(f"Idle Followers: {status['idle_followers']}")
    print(f"Busy Followers: {status['busy_followers']}")
    print("\nFollowers:")
    for follower in status['followers']:
        print(f"  - {follower['name']}: {follower['status']}")
    print_separator()
    
    # Step 5: Assign tasks to specific bots
    print("Step 5: Assigning Specific Tasks...")
    task1 = {
        'description': 'Pick up object at position (10, 20)',
        'action': 'pickup',
        'position': (10, 20),
        'duration': 0.5  # Simulated task duration
    }
    
    task2 = {
        'description': 'Move to position (30, 40)',
        'action': 'move',
        'position': (30, 40),
        'duration': 0.3
    }
    
    coordinator.assign_task_from_leader(follower1.bot_id, task1)
    time.sleep(0.1)  # Small delay for demonstration
    coordinator.assign_task_from_leader(follower2.bot_id, task2)
    
    # Wait for tasks to complete
    time.sleep(1)
    
    # Report completions
    coordinator.report_task_complete(follower1.bot_id, task1)
    coordinator.report_task_complete(follower2.bot_id, task2)
    print_separator()
    
    # Step 6: Broadcast a task to any available bot
    print("Step 6: Broadcasting Task to Available Bots...")
    task3 = {
        'description': 'Scan area for objects',
        'action': 'scan',
        'area': 'zone-A',
        'duration': 0.4
    }
    
    coordinator.broadcast_task_from_leader(task3)
    time.sleep(0.5)
    coordinator.report_task_complete(follower1.bot_id, task3)
    print_separator()
    
    # Step 7: Add more bots dynamically
    print("Step 7: Dynamically Adding More Bots...")
    follower3 = FollowerBot(leader.bot_id, name="ClawBot-3")
    follower4 = FollowerBot(leader.bot_id, name="ClawBot-4")
    
    coordinator.add_follower(follower3)
    coordinator.add_follower(follower4)
    print_separator()
    
    # Step 8: Queue multiple tasks and process them
    print("Step 8: Queuing Multiple Tasks...")
    tasks = [
        {'description': 'Sort objects in bin 1', 'action': 'sort', 'duration': 0.3},
        {'description': 'Transport items to zone B', 'action': 'transport', 'duration': 0.3},
        {'description': 'Clean workspace area', 'action': 'clean', 'duration': 0.3},
        {'description': 'Return to home position', 'action': 'return_home', 'duration': 0.2},
    ]
    
    for task in tasks:
        leader.add_task_to_queue(task)
    
    print("\nProcessing queued tasks...")
    coordinator.process_queued_tasks()
    
    # Wait for some tasks to complete
    time.sleep(1)
    
    # Simulate task completions
    for i, follower_id in enumerate(list(coordinator.followers.keys())[:len(tasks)]):
        coordinator.report_task_complete(follower_id, tasks[i])
    
    print_separator()
    
    # Step 9: Final swarm status
    print("Step 9: Final Swarm Status")
    final_status = coordinator.get_swarm_status()
    print(f"Leader: {final_status['leader']['name']}")
    print(f"Total Followers: {final_status['total_followers']}")
    print(f"Idle Followers: {final_status['idle_followers']}")
    print(f"Busy Followers: {final_status['busy_followers']}")
    print(f"Completed Tasks: {final_status['completed_tasks']}")
    print("\nAll Followers:")
    for follower in final_status['followers']:
        print(f"  - {follower['name']}: {follower['status']}")
    print_separator()
    
    # Step 10: Remove a bot from the swarm
    print("Step 10: Removing a Bot from the Swarm...")
    coordinator.remove_follower(follower4.bot_id)
    
    status_after_removal = coordinator.get_swarm_status()
    print(f"Remaining Followers: {status_after_removal['total_followers']}")
    print_separator()
    
    print("✅ Demo Complete!")
    print("\nKey Features Demonstrated:")
    print("  ✓ Leader bot (Conductor) managing the swarm")
    print("  ✓ Multiple follower bots executing tasks")
    print("  ✓ Task assignment (specific and broadcast)")
    print("  ✓ Dynamic bot addition and removal")
    print("  ✓ Task queuing and processing")
    print("  ✓ Status monitoring and reporting")


if __name__ == "__main__":
    main()
