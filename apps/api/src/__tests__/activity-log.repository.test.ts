import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { AgentTeam } from '@open-agents/shared';

describe('ActivityLogRepository', () => {
  let db: Database.Database;
  let logRepo: ActivityLogRepository;
  let agentRepo: AgentRepository;
  let testAgentId: string;

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    logRepo = new ActivityLogRepository(db);
    agentRepo = new AgentRepository(db);

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

  describe('create', () => {
    it('should create an activity log entry', () => {
      const log = logRepo.create({
        agentId: testAgentId,
        action: 'TEST_ACTION',
        details: 'Test details',
        tokensUsed: 100,
      });

      expect(log.id).toBeDefined();
      expect(log.agentId).toBe(testAgentId);
      expect(log.action).toBe('TEST_ACTION');
      expect(log.details).toBe('Test details');
      expect(log.tokensUsed).toBe(100);
      expect(log.projectId).toBeNull();
      expect(log.taskId).toBeNull();
    });

    it('should use defaults for optional fields', () => {
      const log = logRepo.create({
        agentId: testAgentId,
        action: 'SIMPLE_ACTION',
      });

      expect(log.details).toBe('');
      expect(log.tokensUsed).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find a log by ID', () => {
      const created = logRepo.create({
        agentId: testAgentId,
        action: 'TEST_ACTION',
      });

      const found = logRepo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.action).toBe('TEST_ACTION');
    });

    it('should return null for non-existent log', () => {
      expect(logRepo.findById('non-existent')).toBeNull();
    });
  });

  describe('findByAgent', () => {
    it('should find logs by agent ID', () => {
      for (let i = 0; i < 3; i++) {
        logRepo.create({
          agentId: testAgentId,
          action: `ACTION_${i}`,
        });
      }

      const result = logRepo.findByAgent(testAgentId, 1, 20);
      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should paginate results', () => {
      for (let i = 0; i < 5; i++) {
        logRepo.create({
          agentId: testAgentId,
          action: `ACTION_${i}`,
        });
      }

      const page1 = logRepo.findByAgent(testAgentId, 1, 2);
      expect(page1.logs).toHaveLength(2);
      expect(page1.total).toBe(5);
    });
  });

  describe('findByProject', () => {
    it('should find logs by project ID', () => {
      const projectRepo = new ProjectRepository(db);

      const project = projectRepo.create(
        {
          name: 'TestProject',
          description: 'Test project',
          repositoryUrl: 'https://github.com/test/project',
          tags: ['test'],
        },
        testAgentId,
      );

      logRepo.create({
        agentId: testAgentId,
        action: 'PROJECT_ACTION',
        projectId: project.id,
      });

      logRepo.create({
        agentId: testAgentId,
        action: 'OTHER_ACTION',
      });

      const result = logRepo.findByProject(project.id, 1, 20);
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
