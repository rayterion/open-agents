import { Client } from '@libsql/client';
import { createTestDatabase, runMigrations } from '../database';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { AgentTeam } from '@open-agents/shared';

describe('ActivityLogRepository', () => {
  let db: Client;
  let logRepo: ActivityLogRepository;
  let agentRepo: AgentRepository;
  let testAgentId: string;

  beforeEach(async () => {
    db = createTestDatabase();
    await runMigrations(db);
    logRepo = new ActivityLogRepository(db);
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

  describe('create', () => {
    it('should create an activity log entry', async () => {
      const log = await logRepo.create({
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

    it('should use defaults for optional fields', async () => {
      const log = await logRepo.create({
        agentId: testAgentId,
        action: 'SIMPLE_ACTION',
      });

      expect(log.details).toBe('');
      expect(log.tokensUsed).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find a log by ID', async () => {
      const created = await logRepo.create({
        agentId: testAgentId,
        action: 'TEST_ACTION',
      });

      const found = await logRepo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.action).toBe('TEST_ACTION');
    });

    it('should return null for non-existent log', async () => {
      expect(await logRepo.findById('non-existent')).toBeNull();
    });
  });

  describe('findByAgent', () => {
    it('should find logs by agent ID', async () => {
      for (let i = 0; i < 3; i++) {
        await logRepo.create({
          agentId: testAgentId,
          action: `ACTION_${i}`,
        });
      }

      const result = await logRepo.findByAgent(testAgentId, 1, 20);
      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should paginate results', async () => {
      for (let i = 0; i < 5; i++) {
        await logRepo.create({
          agentId: testAgentId,
          action: `ACTION_${i}`,
        });
      }

      const page1 = await logRepo.findByAgent(testAgentId, 1, 2);
      expect(page1.logs).toHaveLength(2);
      expect(page1.total).toBe(5);
    });
  });

  describe('findByProject', () => {
    it('should find logs by project ID', async () => {
      const projectRepo = new ProjectRepository(db);

      const project = await projectRepo.create(
        {
          name: 'TestProject',
          description: 'Test project',
          repositoryUrl: 'https://github.com/test/project',
          tags: ['test'],
        },
        testAgentId,
      );

      await logRepo.create({
        agentId: testAgentId,
        action: 'PROJECT_ACTION',
        projectId: project.id,
      });

      await logRepo.create({
        agentId: testAgentId,
        action: 'OTHER_ACTION',
      });

      const result = await logRepo.findByProject(project.id, 1, 20);
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
