import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { ProjectRepository } from '../repositories/project.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentTeam, ProjectStatus } from '@open-agents/shared';

describe('ProjectRepository', () => {
  let db: Database.Database;
  let projectRepo: ProjectRepository;
  let agentRepo: AgentRepository;
  let testAgentId: string;

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    projectRepo = new ProjectRepository(db);
    agentRepo = new AgentRepository(db);

    // Create a test agent for foreign key requirements
    const agent = agentRepo.create({
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
    it('should create a project', () => {
      const project = createTestProject();

      expect(project.id).toBeDefined();
      expect(project.name).toBe('TestProject');
      expect(project.description).toBe('A test project');
      expect(project.repositoryUrl).toBe('https://github.com/test/project');
      expect(project.status).toBe(ProjectStatus.PROPOSED);
      expect(project.tags).toEqual(['ai', 'testing']);
      expect(project.createdByAgentId).toBe(testAgentId);
      expect(project.assignedAgentIds).toContain(testAgentId);
    });

    it('should throw on duplicate project name', () => {
      createTestProject();
      expect(() => createTestProject()).toThrow();
    });
  });

  describe('findById', () => {
    it('should find an existing project', () => {
      const created = createTestProject();
      const found = projectRepo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('TestProject');
    });

    it('should return null for non-existent project', () => {
      expect(projectRepo.findById('non-existent')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', () => {
      for (let i = 0; i < 5; i++) {
        createTestProject(`Project${i}`);
      }

      const result = projectRepo.findAll(1, 3);
      expect(result.projects).toHaveLength(3);
      expect(result.total).toBe(5);
    });
  });

  describe('findByStatus', () => {
    it('should filter projects by status', () => {
      const p1 = createTestProject('Proj1');
      createTestProject('Proj2');

      projectRepo.updateStatus(p1.id, ProjectStatus.IN_PROGRESS);

      const result = projectRepo.findByStatus(ProjectStatus.PROPOSED, 1, 20);
      expect(result.total).toBe(1);

      const inProgress = projectRepo.findByStatus(ProjectStatus.IN_PROGRESS, 1, 20);
      expect(inProgress.total).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should update project status', () => {
      const project = createTestProject();
      const updated = projectRepo.updateStatus(project.id, ProjectStatus.IN_PROGRESS);

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(ProjectStatus.IN_PROGRESS);
    });
  });

  describe('assignAgent / removeAgent', () => {
    it('should assign and remove agents', () => {
      const project = createTestProject();
      const agent2 = agentRepo.create({
        name: 'Agent2',
        description: 'Second agent',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['testing'],
      });

      projectRepo.assignAgent(project.id, agent2.id);
      let found = projectRepo.findById(project.id);
      expect(found!.assignedAgentIds).toContain(agent2.id);
      expect(found!.assignedAgentIds).toHaveLength(2);

      projectRepo.removeAgent(project.id, agent2.id);
      found = projectRepo.findById(project.id);
      expect(found!.assignedAgentIds).not.toContain(agent2.id);
      expect(found!.assignedAgentIds).toHaveLength(1);
    });

    it('should not duplicate assignments', () => {
      const project = createTestProject();
      projectRepo.assignAgent(project.id, testAgentId); // already assigned as creator
      const found = projectRepo.findById(project.id);
      expect(found!.assignedAgentIds).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete a project', () => {
      const project = createTestProject();
      expect(projectRepo.delete(project.id)).toBe(true);
      expect(projectRepo.findById(project.id)).toBeNull();
    });

    it('should return false for non-existent project', () => {
      expect(projectRepo.delete('non-existent')).toBe(false);
    });
  });
});
