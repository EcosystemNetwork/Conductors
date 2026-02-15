import { dataStore } from './dataStore';

export class TaskDispatcher {
  /**
   * Find the best available agent for a given task based on skill matching.
   * Returns the agent with the most matching skills who is currently idle.
   */
  static async matchTaskToAgent(task: { requiredSkills: string[] }) {
    const agents = await dataStore.getAllAgents();

    const idleAgents = agents.filter(agent => agent.status === 'idle');

    // Find agents that have at least one matching skill
    const matchingAgents = idleAgents
      .map(agent => ({
        agent,
        matchCount: task.requiredSkills.filter(skill =>
          agent.skills.includes(skill)
        ).length
      }))
      .filter(({ matchCount }) => matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    return matchingAgents.length > 0 ? matchingAgents[0].agent : null;
  }

  /**
   * Assign a task to an agent, updating both records.
   */
  static async assignTask(taskId: string, agentId: string): Promise<boolean> {
    const task = await dataStore.getTask(taskId);
    const agent = await dataStore.getAgent(agentId);

    if (!task || !agent) return false;

    await dataStore.updateTask(taskId, {
      status: 'assigned',
      assignedTo: agentId
    });

    await dataStore.updateAgent(agentId, {
      status: 'busy'
    });

    return true;
  }

  /**
   * Get the next available (pending) task for a specific agent based on skills.
   * Automatically assigns the task if found.
   * Tasks are prioritized by priority level (1 highest, 5 lowest).
   */
  static async getNextTaskForAgent(agentId: string) {
    const agent = await dataStore.getAgent(agentId);
    if (!agent || agent.status === 'busy') return null;

    const tasks = await dataStore.getAllTasks();
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    // Find tasks that match the agent's skills
    const matchingTasks = pendingTasks.filter(task =>
      task.requiredSkills.some(skill => agent.skills.includes(skill))
    );

    if (matchingTasks.length === 0) return null;

    // Sort by priority (lower number = higher priority), then by creation time
    matchingTasks.sort((a, b) => {
      const priorityA = a.priority || 3;
      const priorityB = b.priority || 3;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.createdAt - b.createdAt;
    });

    const matchingTask = matchingTasks[0];
    await this.assignTask(matchingTask.id, agentId);
    return dataStore.getTask(matchingTask.id);
  }

  /**
   * Retry a failed task by resetting it to pending status.
   * Returns true if retry is allowed, false if max retries exceeded.
   */
  static async retryTask(taskId: string): Promise<boolean> {
    return dataStore.incrementTaskRetry(taskId);
  }

  /**
   * Get pending tasks sorted by priority.
   */
  static async getPendingTasksByPriority() {
    const tasks = await dataStore.getAllTasks();
    return tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        const priorityA = a.priority || 3;
        const priorityB = b.priority || 3;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.createdAt - b.createdAt;
      });
  }
}
