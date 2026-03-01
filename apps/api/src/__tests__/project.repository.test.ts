import { Client } from '@libsql/client';
import { createTestDatabase, runMigrations } from '../database';
import { ProjectRepository } from '../repositories/project.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentTeam, ProjectStatus } from '@open-agents/shared';

describe('ProjectRepository', () => {
  let db: Client;
  let projectRepo: ProjectRepository;
  let agentRepo: AgentRepository;
  let testAgentId: string;

  beforeEach(async () => {
    db = createTestDatabase();
    await runMigrations(db);
    projectRepo = new ProjectRepository(db);
    agentRepo = new AgentRepository(db);

    const agent = await agentRepo.create({
      name: 'TestAgent',
      description: 'Test agent',
      team: AgentTeam.CREATIVE,
      capabilities: ['testing'],
    });
    testAgentId = agent.id;
  });

  afterEach(() => {
    db.close();
  });

  const createTestProject = (name?: string) => {
    return projectRepo.create(
      {
        name: name ?? 'TestProject',
        description: 'A test project',
        repositoryUrl: 'https://github.com/test/project',
        tags: ['ai', 'testing'],
      },
      testAgentId,
    );
  };

  describe('create', () => {
    it('should create a project', async () => {
      const project = await createTestProject();

      expect(project.id).toBeDefined();
      expect(project.name).toBe('TestProject');
      expect(project.description).toBe('A test project');
      expect(project.repositoryUrl).toBe('https://github.com/test/project');
      expect(project.status).toBe(ProjectStatus.PROPOSED);
      expect(project.tags).toEqual(['ai', 'testing']);
      expect(project.createdByAgentId).toBe(testAgentId);
      expect(project.assignedAgentIds).toContain(testAgentId);
    });

    it('should throw on duplicate project name', async () => {
      await createTestProject();
      await expect(createTestProject()).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find an existing project', async () => {
      const created = await createTestProject();
      const found = await projectRepo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('TestProject');
    });

    it('should return null for non-existent project', async () => {
      expect(await projectRepo.findById('non-existent')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestProject(`Project${i}`);
      }

      const result = await projectRepo.findAll(1, 3);
      expect(result.projects).toHaveLength(3);
      expect(result.total).toBe(5);
    });
  });

  describe('findByStatus', () => {
    it('should filter projects by status', async () => {
      const p1 = await createTestProject('Proj1');
      await createTestProject('Proj2');

      await projectRepo.updateStatus(p1.id, ProjectStatus.IN_PROGRESS);

      const result = await projectRepo.findByStatus(ProjectStatus.PROPOSED, 1, 20);
      expect(result.total).toBe(1);

      const inProgress = await projectRepo.findByStatus(ProjectStatus.IN_PROGRESS, 1, 20);
      expect(inProgress.total).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should update project status', async () => {
      const project = await createTestProject();
      const updated = await projectRepo.updateStatus(project.id, ProjectStatus.IN_PROGRESS);

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(ProjectStatus.IN_PROGRESS);
    });
  });

  describe('assignAgent / removeAgent', () => {
    it('should assign and remove agents', async () => {
      const project = await createTestProject();
      const agent2 = await agentRepo.create({
        name: 'Agent2',
        description: 'Second agent',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['testing'],
      });

      await projectRepo.assignAgent(project.id, agent2.id);
      let found = await projectRepo.findById(project.id);
      expect(found!.assignedAgentIds).toContain(agent2.id);
      expect(found!.assignedAgentIds).toHaveLength(2);

      await projectRepo.removeAgent(project.id, agent2.id);
      found = await projectRepo.findById(project.id);
      expect(found!.assignedAgentIds).not.toContain(agent2.id);
      expect(found!.assignedAgentIds).toHaveLength(1);
    });

    it('should not duplicate assignments', async () => {
      const project = await createTestProject();
      await projectRepo.assignAgent(project.id, testAgentId); // already assigned as creator
      const found = await projectRepo.findById(project.id);
      expect(found!.assignedAgentIds).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      const project = await createTestProject();
      expect(await projectRepo.delete(project.id)).toBe(true);
      expect(await projectRepo.findById(project.id)).toBeNull();
    });

    it('should return false for non-existent project', async () => {
      expect(await projectRepo.delete('non-existent')).toBe(false);
    });
  });
});
