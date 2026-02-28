import request from 'supertest';
import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { createApp } from '../app';
import { AgentTeam, AgentStatus, API } from '@open-agents/shared';

describe('Agent Routes', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>['app'];

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    ({ app } = createApp(db));
  });

  afterEach(() => {
    db.close();
  });

  const registerAgent = async (name?: string) => {
    const res = await request(app)
      .post(`${API.PREFIX}/agents`)
      .send({
        name: name ?? 'TestAgent',
        description: 'A test agent',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['typescript'],
      });
    return res.body.data;
  };

  describe('POST /agents', () => {
    it('should register a new agent', async () => {
      const res = await request(app)
        .post(`${API.PREFIX}/agents`)
        .send({
          name: 'NewAgent',
          description: 'A new agent',
          team: AgentTeam.CREATIVE,
          capabilities: ['innovation'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('NewAgent');
      expect(res.body.data.team).toBe(AgentTeam.CREATIVE);
      expect(res.body.data.status).toBe(AgentStatus.PENDING);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app).post(`${API.PREFIX}/agents`).send({
        name: '',
        team: 'INVALID',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate name', async () => {
      await registerAgent('Duplicate');
      const res = await request(app)
        .post(`${API.PREFIX}/agents`)
        .send({
          name: 'Duplicate',
          description: 'Dup',
          team: AgentTeam.CODE_WRITER,
          capabilities: ['code'],
        });

      expect(res.status).toBe(409);
    });

    it('should return 500 for generic database errors', async () => {
      // Drop the table to simulate a database error
      db.exec('DROP TABLE activity_logs');
      db.exec('DROP TABLE collaboration_messages');
      db.exec('DROP TABLE project_agents');
      db.exec('DROP TABLE tasks');
      db.exec('DROP TABLE projects');
      db.exec('DROP TABLE agents');

      const res = await request(app)
        .post(`${API.PREFIX}/agents`)
        .send({
          name: 'WillFail',
          description: 'Should trigger 500',
          team: AgentTeam.CODE_WRITER,
          capabilities: ['code'],
        });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /agents', () => {
    it('should list agents', async () => {
      await registerAgent('Agent1');
      await registerAgent('Agent2');

      const res = await request(app).get(`${API.PREFIX}/agents`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await registerAgent(`Agent${i}`);
      }

      const res = await request(app).get(`${API.PREFIX}/agents?page=1&pageSize=2`);
      expect(res.body.data.data).toHaveLength(2);
      expect(res.body.data.totalPages).toBe(3);
    });
  });

  describe('GET /agents/team/:team', () => {
    it('should list agents by team', async () => {
      await registerAgent('Writer');
      const res2 = await request(app)
        .post(`${API.PREFIX}/agents`)
        .send({
          name: 'CreativeAgent',
          description: 'Creative',
          team: AgentTeam.CREATIVE,
          capabilities: ['ideas'],
        });

      const res = await request(app).get(`${API.PREFIX}/agents/team/${AgentTeam.CREATIVE}`);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('GET /agents/:id', () => {
    it('should get agent by ID', async () => {
      const agent = await registerAgent();
      const res = await request(app).get(`${API.PREFIX}/agents/${agent.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('TestAgent');
    });

    it('should return 404 for non-existent agent', async () => {
      const res = await request(app).get(`${API.PREFIX}/agents/non-existent`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /agents/:id (authenticated)', () => {
    it('should update agent with valid auth', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .put(`${API.PREFIX}/agents/${agent.id}`)
        .set('Authorization', `Bearer ${agent.authToken}`)
        .send({ name: 'UpdatedName' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('UpdatedName');
    });

    it('should return 401 without auth', async () => {
      const agent = await registerAgent();
      const res = await request(app).put(`${API.PREFIX}/agents/${agent.id}`).send({ name: 'Bad' });

      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .put(`${API.PREFIX}/agents/${agent.id}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'Bad' });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent agent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .put(`${API.PREFIX}/agents/non-existent-id`)
        .set('Authorization', `Bearer ${agent.authToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /agents/:id/activate', () => {
    it('should activate a pending agent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .post(`${API.PREFIX}/agents/${agent.id}/activate`)
        .set('Authorization', `Bearer ${agent.authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(AgentStatus.ACTIVE);
    });

    it('should return 404 for non-existent agent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .post(`${API.PREFIX}/agents/non-existent-id/activate`)
        .set('Authorization', `Bearer ${agent.authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /agents/:id/suspend', () => {
    it('should suspend an agent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .post(`${API.PREFIX}/agents/${agent.id}/suspend`)
        .set('Authorization', `Bearer ${agent.authToken}`)
        .send({ reason: 'Policy violation' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(AgentStatus.SUSPENDED);
    });

    it('should return 404 for non-existent agent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .post(`${API.PREFIX}/agents/non-existent-id/suspend`)
        .set('Authorization', `Bearer ${agent.authToken}`)
        .send({ reason: 'Testing' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /agents/:id/tokens', () => {
    it('should record token usage', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .post(`${API.PREFIX}/agents/${agent.id}/tokens`)
        .set('Authorization', `Bearer ${agent.authToken}`)
        .send({ tokensUsed: 5000 });

      expect(res.status).toBe(200);
      expect(res.body.data.tokenBudget.usedTokensCurrentHour).toBe(5000);
    });

    it('should return 404 for non-existent agent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .post(`${API.PREFIX}/agents/non-existent-id/tokens`)
        .set('Authorization', `Bearer ${agent.authToken}`)
        .send({ tokensUsed: 100 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /agents/:id', () => {
    it('should delete an agent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .delete(`${API.PREFIX}/agents/${agent.id}`)
        .set('Authorization', `Bearer ${agent.authToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent', async () => {
      const agent = await registerAgent();
      const res = await request(app)
        .delete(`${API.PREFIX}/agents/non-existent`)
        .set('Authorization', `Bearer ${agent.authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
