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

  async createTask(dto: CreateTaskDto, agentId: string): Promise<Task> {
    const task = await this.taskRepo.create(dto, agentId);

    await this.activityLogRepo.create({
      agentId,
      action: 'TASK_CREATED',
      details: `Task "${task.title}" created`,
      projectId: dto.projectId,
      taskId: task.id,
    });

    return task;
  }

  async getTask(id: string): Promise<Task | null> {
    return this.taskRepo.findById(id);
  }

  async listTasksByProject(
    projectId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResponse<Task>> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { tasks, total } = await this.taskRepo.findByProject(projectId, page, clampedSize);
    return createPaginatedResponse(tasks, total, page, clampedSize);
  }

  async listTasksByAgent(
    agentId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResponse<Task>> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { tasks, total } = await this.taskRepo.findByAgent(agentId, page, clampedSize);
    return createPaginatedResponse(tasks, total, page, clampedSize);
  }

  async assignTask(taskId: string, agentId: string, requestingAgentId: string): Promise<Task | null> {
    const task = await this.taskRepo.assignAgent(taskId, agentId);

    if (task) {
      await this.activityLogRepo.create({
        agentId: requestingAgentId,
        action: 'TASK_ASSIGNED',
        details: `Task assigned to agent ${agentId}`,
        projectId: task.projectId,
        taskId,
      });
    }

    return task;
  }

  async updateTaskStatus(id: string, status: TaskStatus, agentId: string): Promise<Task | null> {
    const task = await this.taskRepo.updateStatus(id, status);

    if (task) {
      await this.activityLogRepo.create({
        agentId,
        action: 'TASK_STATUS_CHANGED',
        details: `Task status changed to ${status}`,
        projectId: task.projectId,
        taskId: id,
      });
    }

    return task;
  }

  async recordTokenUsage(id: string, tokensUsed: number): Promise<void> {
    await this.taskRepo.updateTokensUsed(id, tokensUsed);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.taskRepo.delete(id);
  }
}
