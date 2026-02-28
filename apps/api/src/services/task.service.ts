import {
  Task,
  TaskStatus,
  CreateTaskDto,
  PaginatedResponse,
  createPaginatedResponse,
  PAGINATION,
} from '@open-agents/shared';
import { TaskRepository } from '../repositories/task.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private activityLogRepo: ActivityLogRepository,
  ) {}

  /**
   * Create a new task.
   */
  createTask(dto: CreateTaskDto, agentId: string): Task {
    const task = this.taskRepo.create(dto, agentId);

    this.activityLogRepo.create({
      agentId,
      action: 'TASK_CREATED',
      details: `Task "${task.title}" created`,
      projectId: dto.projectId,
      taskId: task.id,
    });

    return task;
  }

  /**
   * Get task by ID.
   */
  getTask(id: string): Task | null {
    return this.taskRepo.findById(id);
  }

  /**
   * List tasks by project.
   */
  listTasksByProject(
    projectId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): PaginatedResponse<Task> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { tasks, total } = this.taskRepo.findByProject(projectId, page, clampedSize);
    return createPaginatedResponse(tasks, total, page, clampedSize);
  }

  /**
   * List tasks by assigned agent.
   */
  listTasksByAgent(
    agentId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): PaginatedResponse<Task> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { tasks, total } = this.taskRepo.findByAgent(agentId, page, clampedSize);
    return createPaginatedResponse(tasks, total, page, clampedSize);
  }

  /**
   * Assign a task to an agent.
   */
  assignTask(taskId: string, agentId: string, requestingAgentId: string): Task | null {
    const task = this.taskRepo.assignAgent(taskId, agentId);

    if (task) {
      this.activityLogRepo.create({
        agentId: requestingAgentId,
        action: 'TASK_ASSIGNED',
        details: `Task assigned to agent ${agentId}`,
        projectId: task.projectId,
        taskId,
      });
    }

    return task;
  }

  /**
   * Update task status.
   */
  updateTaskStatus(id: string, status: TaskStatus, agentId: string): Task | null {
    const task = this.taskRepo.updateStatus(id, status);

    if (task) {
      this.activityLogRepo.create({
        agentId,
        action: 'TASK_STATUS_CHANGED',
        details: `Task status changed to ${status}`,
        projectId: task.projectId,
        taskId: id,
      });
    }

    return task;
  }

  /**
   * Record token usage on a task.
   */
  recordTokenUsage(id: string, tokensUsed: number): void {
    this.taskRepo.updateTokensUsed(id, tokensUsed);
  }

  /**
   * Delete a task.
   */
  deleteTask(id: string): boolean {
    return this.taskRepo.delete(id);
  }
}
