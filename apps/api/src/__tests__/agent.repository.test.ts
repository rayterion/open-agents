import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentTeam, AgentStatus } from '@open-agents/shared';

describe('AgentRepository', () => {
  let db: Database.Database;
  let repo: AgentRepository;

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    repo = new AgentRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  const createTestAgent = (overrides: Partial<{ name: string; team: AgentTeam }> = {}) => {
    return repo.create({
      name: overrides.name ?? 'TestAgent',
      description: 'A test agent',
      team: overrides.team ?? AgentTeam.CODE_WRITER,
      capabilities: ['typescript', 'testing'],
    });
  };

  describe('create', () => {
    it('should create an agent with default values', () => {
      const agent = createTestAgent();

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('TestAgent');
      expect(agent.description).toBe('A test agent');
      expect(agent.team).toBe(AgentTeam.CODE_WRITER);
      expect(agent.status).toBe(AgentStatus.PENDING);
      expect(agent.capabilities).toEqual(['typescript', 'testing']);
      expect(agent.reputation).toBe(0);
      expect(agent.authToken).toBeDefined();
      expect(agent.tokenBudget).toBeDefined();
      expect(agent.tokenBudget.usedTokensCurrentHour).toBe(0);
    });

    it('should create agents with custom token limits', () => {
      const agent = repo.create({
        name: 'CustomAgent',
        description: 'Custom limits',
        team: AgentTeam.MANAGER,
        capabilities: ['management'],
        maxTokensPerHour: 50000,
        maxTokensPerDay: 500000,
      });

      expect(agent.tokenBudget.maxTokensPerHour).toBe(50000);
      expect(agent.tokenBudget.maxTokensPerDay).toBe(500000);
    });

    it('should throw on duplicate name', () => {
      createTestAgent();
      expect(() => createTestAgent()).toThrow();
    });
  });

  describe('findById', () => {
    it('should find an existing agent', () => {
      const created = createTestAgent();
      const found = repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('TestAgent');
    });

    it('should return null for non-existent agent', () => {
      const found = repo.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByAuthToken', () => {
    it('should find an agent by auth token', () => {
      const created = createTestAgent();
      const found = repo.findByAuthToken(created.authToken);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('should return null for invalid token', () => {
      const found = repo.findByAuthToken('invalid-token');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty result when no agents', () => {
      const result = repo.findAll(1, 20);
      expect(result.agents).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return paginated agents', () => {
      for (let i = 0; i < 5; i++) {
        createTestAgent({ name: `Agent${i}` });
      }

      const page1 = repo.findAll(1, 2);
      expect(page1.agents).toHaveLength(2);
      expect(page1.total).toBe(5);

      const page2 = repo.findAll(2, 2);
      expect(page2.agents).toHaveLength(2);

      const page3 = repo.findAll(3, 2);
      expect(page3.agents).toHaveLength(1);
    });
  });

  describe('findByTeam', () => {
    it('should filter agents by team', () => {
      createTestAgent({ name: 'Writer1', team: AgentTeam.CODE_WRITER });
      createTestAgent({ name: 'Creative1', team: AgentTeam.CREATIVE });
      createTestAgent({ name: 'Writer2', team: AgentTeam.CODE_WRITER });

      const writers = repo.findByTeam(AgentTeam.CODE_WRITER, 1, 20);
      expect(writers.agents).toHaveLength(2);
      expect(writers.total).toBe(2);

      const creatives = repo.findByTeam(AgentTeam.CREATIVE, 1, 20);
      expect(creatives.agents).toHaveLength(1);
      expect(creatives.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update agent fields', () => {
      const agent = createTestAgent();
      const updated = repo.update(agent.id, { name: 'UpdatedName', description: 'Updated desc' });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('UpdatedName');
      expect(updated!.description).toBe('Updated desc');
    });

    it('should return null for non-existent agent', () => {
      const result = repo.update('non-existent', { name: 'test' });
      expect(result).toBeNull();
    });

    it('should return existing agent when no fields provided', () => {
      const agent = createTestAgent();
      const result = repo.update(agent.id, {});
      expect(result).not.toBeNull();
      expect(result!.name).toBe(agent.name);
    });

    it('should update capabilities', () => {
      const agent = createTestAgent();
      const updated = repo.update(agent.id, { capabilities: ['python', 'rust'] });
      expect(updated!.capabilities).toEqual(['python', 'rust']);
    });

    it('should update team', () => {
      const agent = createTestAgent();
      const updated = repo.update(agent.id, { team: AgentTeam.CREATIVE });
      expect(updated!.team).toBe(AgentTeam.CREATIVE);
    });

    it('should update token limits', () => {
      const agent = createTestAgent();
      const updated = repo.update(agent.id, {
        maxTokensPerHour: 200000,
        maxTokensPerDay: 2000000,
        maxTokensPerMonth: 40000000,
      });
      expect(updated!.tokenBudget.maxTokensPerHour).toBe(200000);
      expect(updated!.tokenBudget.maxTokensPerDay).toBe(2000000);
      expect(updated!.tokenBudget.maxTokensPerMonth).toBe(40000000);
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', () => {
      const agent = createTestAgent();
      const updated = repo.updateStatus(agent.id, AgentStatus.ACTIVE);

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(AgentStatus.ACTIVE);
    });
  });

  describe('updateTokenUsage', () => {
    it('should increment token usage counters', () => {
      const agent = createTestAgent();
      repo.updateTokenUsage(agent.id, 1000);

      const updated = repo.findById(agent.id);
      expect(updated!.tokenBudget.usedTokensCurrentHour).toBe(1000);
      expect(updated!.tokenBudget.usedTokensCurrentDay).toBe(1000);
      expect(updated!.tokenBudget.usedTokensCurrentMonth).toBe(1000);
    });

    it('should accumulate token usage', () => {
      const agent = createTestAgent();
      repo.updateTokenUsage(agent.id, 500);
      repo.updateTokenUsage(agent.id, 300);

      const updated = repo.findById(agent.id);
      expect(updated!.tokenBudget.usedTokensCurrentHour).toBe(800);
    });
  });

  describe('updateReputation', () => {
    it('should add reputation points', () => {
      const agent = createTestAgent();
      repo.updateReputation(agent.id, 10);

      const updated = repo.findById(agent.id);
      expect(updated!.reputation).toBe(10);
    });

    it('should handle negative reputation points', () => {
      const agent = createTestAgent();
      repo.updateReputation(agent.id, 10);
      repo.updateReputation(agent.id, -3);

      const updated = repo.findById(agent.id);
      expect(updated!.reputation).toBe(7);
    });
  });

  describe('delete', () => {
    it('should delete an existing agent', () => {
      const agent = createTestAgent();
      const result = repo.delete(agent.id);

      expect(result).toBe(true);
      expect(repo.findById(agent.id)).toBeNull();
    });

    it('should return false for non-existent agent', () => {
      const result = repo.delete('non-existent');
      expect(result).toBe(false);
    });
  });
});
