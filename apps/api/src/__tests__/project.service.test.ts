import { Client } from '@libsql/client';
import { createTestDatabase, runMigrations } from '../database';
import { AgentRepository } from '../repositories/agent.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { ProjectService } from '../services/project.service';
import { AgentTeam, ProjectStatus } from '@open-agents/shared';

describe('ProjectService', () => {
  let db: Client;
  let service: ProjectService;
  let testAgentId: string;

  beforeEach(async () => {
    db = createTestDatabase();
    await runMigrations(db);
    const agentRepo = new AgentRepository(db);
    const projectRepo = new ProjectRepository(db);
    const logRepo = new ActivityLogRepository(db);
    service = new ProjectService(projectRepo, logRepo);

    const agent = await agentRepo.create({
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
    it('should create a project', async () => {
      const project = await createTestProject();
      expect(project.name).toBe('TestProject');
      expect(project.createdByAgentId).toBe(testAgentId);
    });

    it('should log creation activity', async () => {
      await createTestProject();
      const logRepo = new ActivityLogRepository(db);
      const logs = await logRepo.findByAgent(testAgentId, 1, 20);
      expect(logs.logs.some((l) => l.action === 'PROJECT_CREATED')).toBe(true);
    });
  });

  describe('getProject', () => {
    it('should find project by ID', async () => {
      const project = await createTestProject();
      const found = await service.getProject(project.id);
      expect(found).not.toBeNull();
    });

    it('should return null for non-existent', async () => {
      expect(await service.getProject('non-existent')).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('should list projects with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestProject(`Project${i}`);
      }
      const result = await service.listProjects(1, 3);
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
    });
  });

  describe('listProjectsByStatus', () => {
    it('should filter by status', async () => {
      const p = await createTestProject();
      await createTestProject('Other');
      await service.updateProjectStatus(p.id, ProjectStatus.IN_PROGRESS, testAgentId);

      const result = await service.listProjectsByStatus(ProjectStatus.PROPOSED);
      expect(result.total).toBe(1);
    });
  });

  describe('updateProjectStatus', () => {
    it('should update status', async () => {
      const project = await createTestProject();
      const updated = await service.updateProjectStatus(
        project.id,
        ProjectStatus.IN_PROGRESS,
        testAgentId,
      );
      expect(updated!.status).toBe(ProjectStatus.IN_PROGRESS);
    });

    it('should return null for non-existent project', async () => {
      const result = await service.updateProjectStatus(
        'non-existent',
        ProjectStatus.COMPLETED,
        testAgentId,
      );
      expect(result).toBeNull();
    });
  });

  describe('assignAgent / removeAgent', () => {
    it('should assign and remove agents', async () => {
      const agentRepo = new AgentRepository(db);
      const agent2 = await agentRepo.create({
        name: 'Agent2',
        description: 'Second',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
      });

      const project = await createTestProject();
      await service.assignAgent(project.id, agent2.id, testAgentId);
      let found = await service.getProject(project.id);
      expect(found!.assignedAgentIds).toContain(agent2.id);

      await service.removeAgent(project.id, agent2.id, testAgentId);
      found = await service.getProject(project.id);
      expect(found!.assignedAgentIds).not.toContain(agent2.id);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const project = await createTestProject();
      expect(await service.deleteProject(project.id)).toBe(true);
    });

    it('should return false for non-existent', async () => {
      expect(await service.deleteProject('non-existent')).toBe(false);
    });
  });
});

