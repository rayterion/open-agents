import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { AgentRepository } from '../repositories/agent.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { ProjectService } from '../services/project.service';
import { AgentTeam, ProjectStatus } from '@open-agents/shared';

describe('ProjectService', () => {
  let db: Database.Database;
  let service: ProjectService;
  let testAgentId: string;

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    const agentRepo = new AgentRepository(db);
    const projectRepo = new ProjectRepository(db);
    const logRepo = new ActivityLogRepository(db);
    service = new ProjectService(projectRepo, logRepo);

    const agent = agentRepo.create({
      name: 'TestAgent',
      description: 'Test',
      team: AgentTeam.CREATIVE,
      capabilities: ['testing'],
    });
    testAgentId = agent.id;
  });

  afterEach(() => {
    db.close();
  });

  const createTestProject = (name?: string) => {
    return service.createProject(
      {
        name: name ?? 'TestProject',
        description: 'A test project',
        repositoryUrl: 'https://github.com/test/project',
        tags: ['ai'],
      },
      testAgentId,
    );
  };

  describe('createProject', () => {
    it('should create a project', () => {
      const project = createTestProject();
      expect(project.name).toBe('TestProject');
      expect(project.createdByAgentId).toBe(testAgentId);
    });

    it('should log creation activity', () => {
      createTestProject();
      const logRepo = new ActivityLogRepository(db);
      const logs = logRepo.findByAgent(testAgentId, 1, 20);
      expect(logs.logs.some((l) => l.action === 'PROJECT_CREATED')).toBe(true);
    });
  });

  describe('getProject', () => {
    it('should find project by ID', () => {
      const project = createTestProject();
      const found = service.getProject(project.id);
      expect(found).not.toBeNull();
    });

    it('should return null for non-existent', () => {
      expect(service.getProject('non-existent')).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('should list projects with pagination', () => {
      for (let i = 0; i < 5; i++) {
        createTestProject(`Project${i}`);
      }
      const result = service.listProjects(1, 3);
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
    });
  });

  describe('listProjectsByStatus', () => {
    it('should filter by status', () => {
      const p = createTestProject();
      createTestProject('Other');
      service.updateProjectStatus(p.id, ProjectStatus.IN_PROGRESS, testAgentId);

      const result = service.listProjectsByStatus(ProjectStatus.PROPOSED);
      expect(result.total).toBe(1);
    });
  });

  describe('updateProjectStatus', () => {
    it('should update status', () => {
      const project = createTestProject();
      const updated = service.updateProjectStatus(
        project.id,
        ProjectStatus.IN_PROGRESS,
        testAgentId,
      );
      expect(updated!.status).toBe(ProjectStatus.IN_PROGRESS);
    });

    it('should return null for non-existent project', () => {
      const result = service.updateProjectStatus(
        'non-existent',
        ProjectStatus.COMPLETED,
        testAgentId,
      );
      expect(result).toBeNull();
    });
  });

  describe('assignAgent / removeAgent', () => {
    it('should assign and remove agents', () => {
      const agentRepo = new AgentRepository(db);
      const agent2 = agentRepo.create({
        name: 'Agent2',
        description: 'Second',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
      });

      const project = createTestProject();
      service.assignAgent(project.id, agent2.id, testAgentId);
      let found = service.getProject(project.id);
      expect(found!.assignedAgentIds).toContain(agent2.id);

      service.removeAgent(project.id, agent2.id, testAgentId);
      found = service.getProject(project.id);
      expect(found!.assignedAgentIds).not.toContain(agent2.id);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', () => {
      const project = createTestProject();
      expect(service.deleteProject(project.id)).toBe(true);
    });

    it('should return false for non-existent', () => {
      expect(service.deleteProject('non-existent')).toBe(false);
    });
  });
});
