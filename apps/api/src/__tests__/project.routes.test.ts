import request from 'supertest';
import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { createApp } from '../app';
import { AgentTeam, ProjectStatus, API } from '@open-agents/shared';

describe('Project Routes', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>['app'];
  let authToken: string;
  let agentId: string;

  beforeEach(async () => {
    db = createTestDatabase();
    runMigrations(db);
    ({ app } = createApp(db));

    // Register and store auth token
    const agentRes = await request(app)
      .post(`${API.PREFIX}/agents`)
      .send({
        name: 'TestAgent',
        description: 'Test agent',
        team: AgentTeam.CREATIVE,
        capabilities: ['testing'],
      });
    authToken = agentRes.body.data.authToken;
    agentId = agentRes.body.data.id;
  });

  afterEach(() => {
    db.close();
  });

  const createProject = async (name?: string) => {
    const res = await request(app)
      .post(`${API.PREFIX}/projects`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: name ?? 'TestProject',
        description: 'A test project',
        repositoryUrl: 'https://github.com/test/project',
        tags: ['ai'],
      });
    return res.body.data;
  };

  describe('POST /projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post(`${API.PREFIX}/projects`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'NewProject',
          description: 'A new project',
          repositoryUrl: 'https://github.com/test/new',
          tags: ['ai', 'ml'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('NewProject');
      expect(res.body.data.status).toBe(ProjectStatus.PROPOSED);
    });

    it('should require authentication', async () => {
      const res = await request(app).post(`${API.PREFIX}/projects`).send({
        name: 'NoAuth',
        description: 'Desc',
        repositoryUrl: 'https://github.com/test/no-auth',
        tags: [],
      });

      expect(res.status).toBe(401);
    });

    it('should validate input', async () => {
      const res = await request(app)
        .post(`${API.PREFIX}/projects`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate name', async () => {
      await createProject('Dup');
      const res = await request(app)
        .post(`${API.PREFIX}/projects`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Dup',
          description: 'Dup',
          repositoryUrl: 'https://github.com/test/dup',
          tags: [],
        });

      expect(res.status).toBe(409);
    });

    it('should return 500 for generic database errors', async () => {
      // Drop tables to simulate a database error
      db.exec('DROP TABLE activity_logs');
      db.exec('DROP TABLE collaboration_messages');
      db.exec('DROP TABLE tasks');
      db.exec('DROP TABLE project_agents');
      db.exec('DROP TABLE projects');

      const res = await request(app)
        .post(`${API.PREFIX}/projects`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'WillFail',
          description: 'Should trigger 500',
          repositoryUrl: 'https://github.com/test/fail',
          tags: [],
        });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /projects', () => {
    it('should list projects', async () => {
      await createProject('P1');
      await createProject('P2');

      const res = await request(app).get(`${API.PREFIX}/projects`);
      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(2);
    });
  });

  describe('GET /projects/:id', () => {
    it('should get project by ID', async () => {
      const project = await createProject();
      const res = await request(app).get(`${API.PREFIX}/projects/${project.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('TestProject');
    });

    it('should return 404 for non-existent', async () => {
      const res = await request(app).get(`${API.PREFIX}/projects/non-existent`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /projects/:id/status', () => {
    it('should update project status', async () => {
      const project = await createProject();
      const res = await request(app)
        .patch(`${API.PREFIX}/projects/${project.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: ProjectStatus.IN_PROGRESS });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ProjectStatus.IN_PROGRESS);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .patch(`${API.PREFIX}/projects/non-existent-id/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: ProjectStatus.IN_PROGRESS });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /projects/:id/agents', () => {
    it('should assign agent to project', async () => {
      // Create a second agent
      const agent2Res = await request(app)
        .post(`${API.PREFIX}/agents`)
        .send({
          name: 'Agent2',
          description: 'Second agent',
          team: AgentTeam.CODE_WRITER,
          capabilities: ['code'],
        });
      const agent2Id = agent2Res.body.data.id;

      const project = await createProject();
      const res = await request(app)
        .post(`${API.PREFIX}/projects/${project.id}/agents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ agentId: agent2Id });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedAgentIds).toContain(agent2Id);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .post(`${API.PREFIX}/projects/non-existent-id/agents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ agentId: agentId });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /projects/:id/agents/:agentId', () => {
    it('should remove agent from project', async () => {
      const agent2Res = await request(app)
        .post(`${API.PREFIX}/agents`)
        .send({
          name: 'Agent2',
          description: 'Second agent',
          team: AgentTeam.CODE_WRITER,
          capabilities: ['code'],
        });
      const agent2Id = agent2Res.body.data.id;

      const project = await createProject();
      await request(app)
        .post(`${API.PREFIX}/projects/${project.id}/agents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ agentId: agent2Id });

      const res = await request(app)
        .delete(`${API.PREFIX}/projects/${project.id}/agents/${agent2Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.assignedAgentIds).not.toContain(agent2Id);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .delete(`${API.PREFIX}/projects/non-existent-id/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete a project', async () => {
      const project = await createProject();
      const res = await request(app)
        .delete(`${API.PREFIX}/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .delete(`${API.PREFIX}/projects/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
