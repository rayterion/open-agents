import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { AgentRepository } from '../repositories/agent.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { AgentService } from '../services/agent.service';
import { AgentTeam, AgentStatus } from '@open-agents/shared';

describe('AgentService', () => {
  let db: Database.Database;
  let service: AgentService;

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    const agentRepo = new AgentRepository(db);
    const logRepo = new ActivityLogRepository(db);
    service = new AgentService(agentRepo, logRepo);
  });

  afterEach(() => {
    db.close();
  });

  const registerTestAgent = (name?: string) => {
    return service.registerAgent({
      name: name ?? 'TestAgent',
      description: 'A test agent',
      team: AgentTeam.CODE_WRITER,
      capabilities: ['typescript'],
    });
  };

  describe('registerAgent', () => {
    it('should register a new agent', () => {
      const agent = registerTestAgent();
      expect(agent.name).toBe('TestAgent');
      expect(agent.status).toBe(AgentStatus.PENDING);
    });

    it('should log registration activity', () => {
      const agent = registerTestAgent();
      const logRepo = new ActivityLogRepository(db);
      const logs = logRepo.findByAgent(agent.id, 1, 20);
      expect(logs.logs).toHaveLength(1);
      expect(logs.logs[0].action).toBe('AGENT_REGISTERED');
    });
  });

  describe('getAgent', () => {
    it('should return agent by ID', () => {
      const agent = registerTestAgent();
      const found = service.getAgent(agent.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(agent.id);
    });

    it('should return null for non-existent agent', () => {
      expect(service.getAgent('non-existent')).toBeNull();
    });
  });

  describe('authenticateAgent', () => {
    it('should authenticate with valid token', () => {
      const agent = registerTestAgent();
      const authenticated = service.authenticateAgent(agent.authToken);
      expect(authenticated).not.toBeNull();
      expect(authenticated!.id).toBe(agent.id);
    });

    it('should return null for invalid token', () => {
      expect(service.authenticateAgent('invalid')).toBeNull();
    });
  });

  describe('listAgents', () => {
    it('should list agents with pagination', () => {
      for (let i = 0; i < 5; i++) {
        registerTestAgent(`Agent${i}`);
      }

      const result = service.listAgents(1, 3);
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
    });

    it('should clamp pageSize to max', () => {
      registerTestAgent();
      const result = service.listAgents(1, 200);
      expect(result.pageSize).toBe(100);
    });
  });

  describe('listAgentsByTeam', () => {
    it('should filter by team', () => {
      service.registerAgent({
        name: 'Writer',
        description: 'Writer',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
      });
      service.registerAgent({
        name: 'Creative',
        description: 'Creative',
        team: AgentTeam.CREATIVE,
        capabilities: ['ideas'],
      });

      const writers = service.listAgentsByTeam(AgentTeam.CODE_WRITER);
      expect(writers.total).toBe(1);

      const creatives = service.listAgentsByTeam(AgentTeam.CREATIVE);
      expect(creatives.total).toBe(1);
    });
  });

  describe('updateAgent', () => {
    it('should update agent configuration', () => {
      const agent = registerTestAgent();
      const updated = service.updateAgent(agent.id, { name: 'NewName' });
      expect(updated!.name).toBe('NewName');
    });

    it('should return null for non-existent agent', () => {
      expect(service.updateAgent('non-existent', { name: 'test' })).toBeNull();
    });

    it('should log update activity', () => {
      const agent = registerTestAgent();
      service.updateAgent(agent.id, { name: 'NewName' });

      const logRepo = new ActivityLogRepository(db);
      const logs = logRepo.findByAgent(agent.id, 1, 20);
      expect(logs.logs.some((l) => l.action === 'AGENT_UPDATED')).toBe(true);
    });
  });

  describe('activateAgent', () => {
    it('should activate a pending agent', () => {
      const agent = registerTestAgent();
      const activated = service.activateAgent(agent.id);
      expect(activated!.status).toBe(AgentStatus.ACTIVE);
    });

    it('should return null for non-existent agent', () => {
      expect(service.activateAgent('non-existent')).toBeNull();
    });

    it('should not activate a suspended agent', () => {
      const agent = registerTestAgent();
      service.suspendAgent(agent.id, 'test');
      const result = service.activateAgent(agent.id);
      expect(result!.status).toBe(AgentStatus.SUSPENDED);
    });

    it('should activate an idle agent', () => {
      const agent = registerTestAgent();
      // First activate, then make idle via token limit
      const agentRepo = new AgentRepository(db);
      agentRepo.updateStatus(agent.id, AgentStatus.IDLE);

      const result = service.activateAgent(agent.id);
      expect(result!.status).toBe(AgentStatus.ACTIVE);
    });

    it('should not change an already active agent', () => {
      const agent = registerTestAgent();
      const agentRepo = new AgentRepository(db);
      agentRepo.updateStatus(agent.id, AgentStatus.ACTIVE);

      const result = service.activateAgent(agent.id);
      expect(result!.status).toBe(AgentStatus.ACTIVE);
    });
  });

  describe('suspendAgent', () => {
    it('should suspend an agent', () => {
      const agent = registerTestAgent();
      const suspended = service.suspendAgent(agent.id, 'Policy violation');
      expect(suspended!.status).toBe(AgentStatus.SUSPENDED);
    });

    it('should return null for non-existent agent', () => {
      expect(service.suspendAgent('non-existent', 'test')).toBeNull();
    });
  });

  describe('recordTokenUsage', () => {
    it('should record token usage', () => {
      const agent = registerTestAgent();
      const updated = service.recordTokenUsage(agent.id, 1000);
      expect(updated!.tokenBudget.usedTokensCurrentHour).toBe(1000);
    });

    it('should move active agent to idle when limit exceeded', () => {
      const agent = service.registerAgent({
        name: 'LimitedAgent',
        description: 'Limited',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
        maxTokensPerHour: 100,
      });

      // Activate the agent
      const agentRepo = new AgentRepository(db);
      agentRepo.updateStatus(agent.id, AgentStatus.ACTIVE);

      const result = service.recordTokenUsage(agent.id, 100);
      expect(result!.status).toBe(AgentStatus.IDLE);
    });

    it('should not move non-active agent to idle', () => {
      const agent = service.registerAgent({
        name: 'PendingAgent',
        description: 'Pending',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['code'],
        maxTokensPerHour: 100,
      });

      const result = service.recordTokenUsage(agent.id, 100);
      expect(result!.status).toBe(AgentStatus.PENDING);
    });

    it('should return null for non-existent agent', () => {
      expect(service.recordTokenUsage('non-existent', 100)).toBeNull();
    });
  });

  describe('deleteAgent', () => {
    it('should delete an agent', () => {
      const agent = registerTestAgent();
      expect(service.deleteAgent(agent.id)).toBe(true);
      expect(service.getAgent(agent.id)).toBeNull();
    });

    it('should return false for non-existent agent', () => {
      expect(service.deleteAgent('non-existent')).toBe(false);
    });
  });
});
