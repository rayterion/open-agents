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

  /**
   * Create a new project.
   */
  createProject(dto: CreateProjectDto, agentId: string): Project {
    const project = this.projectRepo.create(dto, agentId);

    this.activityLogRepo.create({
      agentId,
      action: 'PROJECT_CREATED',
      details: `Project "${project.name}" created`,
      projectId: project.id,
    });

    return project;
  }

  /**
   * Get project by ID.
   */
  getProject(id: string): Project | null {
    return this.projectRepo.findById(id);
  }

  /**
   * List all projects with pagination.
   */
  listProjects(
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): PaginatedResponse<Project> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { projects, total } = this.projectRepo.findAll(page, clampedSize);
    return createPaginatedResponse(projects, total, page, clampedSize);
  }

  /**
   * List projects by status.
   */
  listProjectsByStatus(
    status: ProjectStatus,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): PaginatedResponse<Project> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { projects, total } = this.projectRepo.findByStatus(status, page, clampedSize);
    return createPaginatedResponse(projects, total, page, clampedSize);
  }

  /**
   * Update project status.
   */
  updateProjectStatus(id: string, status: ProjectStatus, agentId: string): Project | null {
    const updated = this.projectRepo.updateStatus(id, status);

    if (updated) {
      this.activityLogRepo.create({
        agentId,
        action: 'PROJECT_STATUS_CHANGED',
        details: `Project status changed to ${status}`,
        projectId: id,
      });
    }

    return updated;
  }

  /**
   * Assign an agent to a project.
   */
  assignAgent(projectId: string, agentId: string, requestingAgentId: string): Project | null {
    const project = this.projectRepo.findById(projectId);
    if (!project) return null;

    this.projectRepo.assignAgent(projectId, agentId);

    this.activityLogRepo.create({
      agentId: requestingAgentId,
      action: 'AGENT_ASSIGNED_TO_PROJECT',
      details: `Agent ${agentId} assigned to project`,
      projectId,
    });

    return this.projectRepo.findById(projectId);
  }

  /**
   * Remove an agent from a project.
   */
  removeAgent(projectId: string, agentId: string, requestingAgentId: string): Project | null {
    const project = this.projectRepo.findById(projectId);
    if (!project) return null;

    this.projectRepo.removeAgent(projectId, agentId);

    this.activityLogRepo.create({
      agentId: requestingAgentId,
      action: 'AGENT_REMOVED_FROM_PROJECT',
      details: `Agent ${agentId} removed from project`,
      projectId,
    });

    return this.projectRepo.findById(projectId);
  }

  /**
   * Delete a project.
   */
  deleteProject(id: string): boolean {
    return this.projectRepo.delete(id);
  }
}
