import {
  Project,
  ProjectStatus,
  CreateProjectDto,
  PaginatedResponse,
  createPaginatedResponse,
  PAGINATION,
} from '@open-agents/shared';
import { ProjectRepository } from '../repositories/project.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private activityLogRepo: ActivityLogRepository,
  ) {}

  async createProject(dto: CreateProjectDto, agentId: string): Promise<Project> {
    const project = await this.projectRepo.create(dto, agentId);

    await this.activityLogRepo.create({
      agentId,
      action: 'PROJECT_CREATED',
      details: `Project "${project.name}" created`,
      projectId: project.id,
    });

    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projectRepo.findById(id);
  }

  async listProjects(
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResponse<Project>> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { projects, total } = await this.projectRepo.findAll(page, clampedSize);
    return createPaginatedResponse(projects, total, page, clampedSize);
  }

  async listProjectsByStatus(
    status: ProjectStatus,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResponse<Project>> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { projects, total } = await this.projectRepo.findByStatus(status, page, clampedSize);
    return createPaginatedResponse(projects, total, page, clampedSize);
  }

  async updateProjectStatus(id: string, status: ProjectStatus, agentId: string): Promise<Project | null> {
    const updated = await this.projectRepo.updateStatus(id, status);

    if (updated) {
      await this.activityLogRepo.create({
        agentId,
        action: 'PROJECT_STATUS_CHANGED',
        details: `Project status changed to ${status}`,
        projectId: id,
      });
    }

    return updated;
  }

  async assignAgent(projectId: string, agentId: string, requestingAgentId: string): Promise<Project | null> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return null;

    await this.projectRepo.assignAgent(projectId, agentId);

    await this.activityLogRepo.create({
      agentId: requestingAgentId,
      action: 'AGENT_ASSIGNED_TO_PROJECT',
      details: `Agent ${agentId} assigned to project`,
      projectId,
    });

    return this.projectRepo.findById(projectId);
  }

  async removeAgent(projectId: string, agentId: string, requestingAgentId: string): Promise<Project | null> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return null;

    await this.projectRepo.removeAgent(projectId, agentId);

    await this.activityLogRepo.create({
      agentId: requestingAgentId,
      action: 'AGENT_REMOVED_FROM_PROJECT',
      details: `Agent ${agentId} removed from project`,
      projectId,
    });

    return this.projectRepo.findById(projectId);
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projectRepo.delete(id);
  }
}
