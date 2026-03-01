import { Client } from '@libsql/client';
import { createTestDatabase, runMigrations } from '../database';
import { AgentRepository } from '../repositories/agent.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { AgentService } from '../services/agent.service';
import { AgentTeam, AgentStatus } from '@open-agents/shared';

describe('AgentService', () => {
  let db: Client;
  let service: AgentService;

  beforeEach(async () => {
    db = createTestDatabase();
    await runMigrations(db);
    const agentRepo = new AgentRepository(db);
    const logRepo = new ActivityLogRepository(db);
    service = new AgentService(agentRepo, logRepo);
  });

  afterEach(() => {
    db.close();
  });

  const registerTestAgent = async (name?: string) => {
    return service.registerAgent({
      name: name ?? 'TestAgent',
      description: 'A test agent',
      team: AgentTeam.CODE_WRITER,
      capabilities: ['typescript'],
    });
  };

  describe('registerAgent', () => {
    it('should register a new agent', async () => {
      const agent = await registerTestAgent();
      expect(agent.name).toBe('TestAgent');
      expect(agent.status).toBe(AgentStatus.PENDING);
    });

    it('should log registration activity', async () => {
      const agent = await registerTestAgent();
      const logRepo = new ActivityLogRepository(db);
      const logs = await logRepo.findByAgent(agent.id, 1, 20);
      expect(logs.logs).toHaveLength(1);
      expect(logs.logs[0].action).toBe('AGENT_REGISTERED');
    });
  });

  describe('getAgent', () => {
    it('should return agent by ID', async () => {
      const agent = await registerTestAgent();
      const found = await service.getAgent(agent.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(agent.id);
    });

    it('should return null for non-existent agent', async () => {
      expect(await service.getAgent('non-existent')).toBeNull();
    });
  });

  describe('authenticateAgent', () => {
    it('should authenticate with valid token', async () => {
      const agent = await registerTestAgent();
      const authenticated = await service.authenticateAgent(agent.authToken);
      expect(authenticated).not.toBeNull();
      expect(authenticated!.id).toBe(agent.id);
    });

    it('should return null for invalid token', async () => {
      expect(await service.authenticateAgent('invalid')).toBeNull();
    });
  });

  describe('listAgents', () => {
    it('should list agents with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await registerTestAgent(`Agent${i}`);
      }

      const result = await service.listAgents(1, 3);
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
    });

    it('should clamp pageSize to max', async () => {
      await registerTestAgent();
      const result = await service.listAgents(1, 200);
      expect(result.pageSize).toBe(100);
    });
  });

  describe('listAgentsByTeam', () => {
    it('should filter by team', async () => {
      await service.registerAgent({
        name: 'Writer',
        description: 'Writer',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
      });
      await service.registerAgent({
        name: 'Creative',
        description: 'Creative',
        team: AgentTeam.CREATIVE,
        capabilities: ['ideas'],
      });

      const writers = await service.listAgentsByTeam(AgentTeam.CODE_WRITER);
      expect(writers.total).toBe(1);

      const creatives = await service.listAgentsByTeam(AgentTeam.CREATIVE);
      expect(creatives.total).toBe(1);
    });
  });

  describe('updateAgent', () => {
    it('should update agent configuration', async () => {
      const agent = await registerTestAgent();
      const updated = await service.updateAgent(agent.id, { name: 'NewName' });
      expect(updated!.name).toBe('NewName');
    });

    it('should return null for non-existent agent', async () => {
      expect(await service.updateAgent('non-existent', { name: 'test' })).toBeNull();
    });

    it('should log update activity', async () => {
      const agent = await registerTestAgent();
      await service.updateAgent(agent.id, { name: 'NewName' });

      const logRepo = new ActivityLogRepository(db);
      const logs = await logRepo.findByAgent(agent.id, 1, 20);
      expect(logs.logs.some((l) => l.action === 'AGENT_UPDATED')).toBe(true);
    });
  });

  describe('activateAgent', () => {
    it('should activate a pending agent', async () => {
      const agent = await registerTestAgent();
      const activated = await service.activateAgent(agent.id);
      expect(activated!.status).toBe(AgentStatus.ACTIVE);
    });

    it('should return null for non-existent agent', async () => {
      expect(await service.activateAgent('non-existent')).toBeNull();
    });

    it('should not activate a suspended agent', async () => {
      const agent = await registerTestAgent();
      await service.suspendAgent(agent.id, 'test');
      const result = await service.activateAgent(agent.id);
      expect(result!.status).toBe(AgentStatus.SUSPENDED);
    });

    it('should activate an idle agent', async () => {
      const agent = await registerTestAgent();
      // First activate, then make idle via token limit
      const agentRepo = new AgentRepository(db);
      await agentRepo.updateStatus(agent.id, AgentStatus.IDLE);

      const result = await service.activateAgent(agent.id);
      expect(result!.status).toBe(AgentStatus.ACTIVE);
    });

    it('should not change an already active agent', async () => {
      const agent = await registerTestAgent();
      const agentRepo = new AgentRepository(db);
      await agentRepo.updateStatus(agent.id, AgentStatus.ACTIVE);

      const result = await service.activateAgent(agent.id);
      expect(result!.status).toBe(AgentStatus.ACTIVE);
    });
  });

  describe('suspendAgent', () => {
    it('should suspend an agent', async () => {
      const agent = await registerTestAgent();
      const suspended = await service.suspendAgent(agent.id, 'Policy violation');
      expect(suspended!.status).toBe(AgentStatus.SUSPENDED);
    });

    it('should return null for non-existent agent', async () => {
      expect(await service.suspendAgent('non-existent', 'test')).toBeNull();
    });
  });

  describe('recordTokenUsage', () => {
    it('should record token usage', async () => {
      const agent = await registerTestAgent();
      const updated = await service.recordTokenUsage(agent.id, 1000);
      expect(updated!.tokenBudget.usedTokensCurrentHour).toBe(1000);
    });

    it('should move active agent to idle when limit exceeded', async () => {
      const agent = await service.registerAgent({
        name: 'LimitedAgent',
        description: 'Limited',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
        maxTokensPerHour: 100,
      });

      // Activate the agent
      const agentRepo = new AgentRepository(db);
      await agentRepo.updateStatus(agent.id, AgentStatus.ACTIVE);

      const result = await service.recordTokenUsage(agent.id, 100);
      expect(result!.status).toBe(AgentStatus.IDLE);
    });

    it('should not move non-active agent to idle', async () => {
      const agent = await service.registerAgent({
        name: 'PendingAgent',
        description: 'Pending',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
        maxTokensPerHour: 100,
      });

      const result = await service.recordTokenUsage(agent.id, 100);
      expect(result!.status).toBe(AgentStatus.PENDING);
    });

    it('should return null for non-existent agent', async () => {
      expect(await service.recordTokenUsage('non-existent', 100)).toBeNull();
    });
  });

  describe('deleteAgent', () => {
    it('should delete an agent', async () => {
      const agent = await registerTestAgent();
      expect(await service.deleteAgent(agent.id)).toBe(true);
      expect(await service.getAgent(agent.id)).toBeNull();
    });

    it('should return false for non-existent agent', async () => {
      expect(await service.deleteAgent('non-existent')).toBe(false);
    });
  });
});
