import { Client } from '@libsql/client';
import { createTestDatabase, runMigrations } from '../database';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentTeam, AgentStatus } from '@open-agents/shared';

describe('AgentRepository', () => {
  let db: Client;
  let repo: AgentRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    await runMigrations(db);
    repo = new AgentRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  const createTestAgent = async (overrides: Partial<{ name: string; team: AgentTeam }> = {}) => {
    return repo.create({
      name: overrides.name ?? 'TestAgent',
      description: 'A test agent',
      team: overrides.team ?? AgentTeam.CODE_WRITER,
      capabilities: ['typescript', 'testing'],
    });
  };

  describe('create', () => {
    it('should create an agent with default values', async () => {
      const agent = await createTestAgent();

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

    it('should create agents with custom token limits', async () => {
      const agent = await repo.create({
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

    it('should throw on duplicate name', async () => {
      await createTestAgent();
      await expect(createTestAgent()).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find an existing agent', async () => {
      const created = await createTestAgent();
      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('TestAgent');
    });

    it('should return null for non-existent agent', async () => {
      const found = await repo.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByAuthToken', () => {
    it('should find an agent by auth token', async () => {
      const created = await createTestAgent();
      const found = await repo.findByAuthToken(created.authToken);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('should return null for invalid token', async () => {
      const found = await repo.findByAuthToken('invalid-token');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty result when no agents', async () => {
      const result = await repo.findAll(1, 20);
      expect(result.agents).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return paginated agents', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestAgent({ name: `Agent${i}` });
      }

      const page1 = await repo.findAll(1, 2);
      expect(page1.agents).toHaveLength(2);
      expect(page1.total).toBe(5);

      const page2 = await repo.findAll(2, 2);
      expect(page2.agents).toHaveLength(2);

      const page3 = await repo.findAll(3, 2);
      expect(page3.agents).toHaveLength(1);
    });
  });

  describe('findByTeam', () => {
    it('should filter agents by team', async () => {
      await createTestAgent({ name: 'Writer1', team: AgentTeam.CODE_WRITER });
      await createTestAgent({ name: 'Creative1', team: AgentTeam.CREATIVE });
      await createTestAgent({ name: 'Writer2', team: AgentTeam.CODE_WRITER });

      const writers = await repo.findByTeam(AgentTeam.CODE_WRITER, 1, 20);
      expect(writers.agents).toHaveLength(2);
      expect(writers.total).toBe(2);

      const creatives = await repo.findByTeam(AgentTeam.CREATIVE, 1, 20);
      expect(creatives.agents).toHaveLength(1);
      expect(creatives.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update agent fields', async () => {
      const agent = await createTestAgent();
      const updated = await repo.update(agent.id, { name: 'UpdatedName', description: 'Updated desc' });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('UpdatedName');
      expect(updated!.description).toBe('Updated desc');
    });

    it('should return null for non-existent agent', async () => {
      const result = await repo.update('non-existent', { name: 'test' });
      expect(result).toBeNull();
    });

    it('should return existing agent when no fields provided', async () => {
      const agent = await createTestAgent();
      const result = await repo.update(agent.id, {});
      expect(result).not.toBeNull();
      expect(result!.name).toBe(agent.name);
    });

    it('should update capabilities', async () => {
      const agent = await createTestAgent();
      const updated = await repo.update(agent.id, { capabilities: ['python', 'rust'] });
      expect(updated!.capabilities).toEqual(['python', 'rust']);
    });

    it('should update team', async () => {
      const agent = await createTestAgent();
      const updated = await repo.update(agent.id, { team: AgentTeam.CREATIVE });
      expect(updated!.team).toBe(AgentTeam.CREATIVE);
    });

    it('should update token limits', async () => {
      const agent = await createTestAgent();
      const updated = await repo.update(agent.id, {
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
    it('should update agent status', async () => {
      const agent = await createTestAgent();
      const updated = await repo.updateStatus(agent.id, AgentStatus.ACTIVE);

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(AgentStatus.ACTIVE);
    });
  });

  describe('updateTokenUsage', () => {
    it('should increment token usage counters', async () => {
      const agent = await createTestAgent();
      await repo.updateTokenUsage(agent.id, 1000);

      const updated = await repo.findById(agent.id);
      expect(updated!.tokenBudget.usedTokensCurrentHour).toBe(1000);
      expect(updated!.tokenBudget.usedTokensCurrentDay).toBe(1000);
      expect(updated!.tokenBudget.usedTokensCurrentMonth).toBe(1000);
    });

    it('should accumulate token usage', async () => {
      const agent = await createTestAgent();
      await repo.updateTokenUsage(agent.id, 500);
      await repo.updateTokenUsage(agent.id, 300);

      const updated = await repo.findById(agent.id);
      expect(updated!.tokenBudget.usedTokensCurrentHour).toBe(800);
    });
  });

  describe('updateReputation', () => {
    it('should add reputation points', async () => {
      const agent = await createTestAgent();
      await repo.updateReputation(agent.id, 10);

      const updated = await repo.findById(agent.id);
      expect(updated!.reputation).toBe(10);
    });

    it('should handle negative reputation points', async () => {
      const agent = await createTestAgent();
      await repo.updateReputation(agent.id, 10);
      await repo.updateReputation(agent.id, -3);

      const updated = await repo.findById(agent.id);
      expect(updated!.reputation).toBe(7);
    });
  });

  describe('delete', () => {
    it('should delete an existing agent', async () => {
      const agent = await createTestAgent();
      const result = await repo.delete(agent.id);

      expect(result).toBe(true);
      expect(await repo.findById(agent.id)).toBeNull();
    });

    it('should return false for non-existent agent', async () => {
      const result = await repo.delete('non-existent');
      expect(result).toBe(false);
    });
  });
});
