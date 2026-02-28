import request from 'supertest';
import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { createApp } from '../app';
import { AgentTeam, TaskStatus, TaskPriority, API } from '@open-agents/shared';

describe('Task Routes', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>['app'];
  let authToken: string;
  let agentId: string;
  let projectId: string;

  beforeEach(async () => {
    db = createTestDatabase();
    runMigrations(db);
    ({ app } = createApp(db));

    const agentRes = await request(app)
      .post(`${API.PREFIX}/agents`)
      .send({
        name: 'TestAgent',
        description: 'Test agent',
        team: AgentTeam.MANAGER,
        capabilities: ['management'],
      });
    authToken = agentRes.body.data.authToken;
    agentId = agentRes.body.data.id;

    const projectRes = await request(app)
      .post(`${API.PREFIX}/projects`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'TestProject',
        description: 'Test project',
        repositoryUrl: 'https://github.com/test/project',
        tags: ['test'],
      });
    projectId = projectRes.body.data.id;
  });

  afterEach(() => {
    db.close();
  });

  const createTask = async (title?: string) => {
    const res = await request(app)
      .post(`${API.PREFIX}/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: title ?? 'Test Task',
        description: 'A test task',
        projectId,
        priority: TaskPriority.MEDIUM,
      });
    return res.body.data;
  };

  describe('POST /tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post(`${API.PREFIX}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task',
          description: 'Task description',
          projectId,
          priority: TaskPriority.HIGH,
          estimatedTokens: 10000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Task');
      expect(res.body.data.priority).toBe(TaskPriority.HIGH);
    });

    it('should require authentication', async () => {
      const res = await request(app).post(`${API.PREFIX}/tasks`).send({
        title: 'No Auth',
        description: 'Desc',
        projectId,
        priority: TaskPriority.LOW,
      });

      expect(res.status).toBe(401);
    });

    it('should validate input', async () => {
      const res = await request(app)
        .post(`${API.PREFIX}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('should return 500 for database errors', async () => {
      // Drop the tasks table to simulate a database error
      db.exec('DROP TABLE activity_logs');
      db.exec('DROP TABLE collaboration_messages');
      db.exec('DROP TABLE tasks');

      const res = await request(app)
        .post(`${API.PREFIX}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Bad Task',
          description: 'Will fail',
          projectId,
          priority: 'MEDIUM',
        });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /tasks/project/:projectId', () => {
    it('should list tasks by project', async () => {
      await createTask('Task 1');
      await createTask('Task 2');

      const res = await request(app).get(`${API.PREFIX}/tasks/project/${projectId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(2);
    });
  });

  describe('GET /tasks/agent/:agentId', () => {
    it('should list tasks by agent', async () => {
      const task = await createTask();
      await request(app)
        .post(`${API.PREFIX}/tasks/${task.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ agentId });

      const res = await request(app).get(`${API.PREFIX}/tasks/agent/${agentId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should get task by ID', async () => {
      const task = await createTask();
      const res = await request(app).get(`${API.PREFIX}/tasks/${task.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Test Task');
    });

    it('should return 404 for non-existent', async () => {
      const res = await request(app).get(`${API.PREFIX}/tasks/non-existent`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/status', () => {
    it('should update task status', async () => {
      const task = await createTask();
      const res = await request(app)
        .patch(`${API.PREFIX}/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.IN_PROGRESS });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .patch(`${API.PREFIX}/tasks/non-existent-id/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.IN_PROGRESS });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /tasks/:id/assign', () => {
    it('should assign task to agent', async () => {
      const task = await createTask();
      const res = await request(app)
        .post(`${API.PREFIX}/tasks/${task.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ agentId });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedAgentId).toBe(agentId);
      expect(res.body.data.status).toBe(TaskStatus.TODO);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .post(`${API.PREFIX}/tasks/non-existent-id/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ agentId });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const task = await createTask();
      const res = await request(app)
        .delete(`${API.PREFIX}/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent', async () => {
      const res = await request(app)
        .delete(`${API.PREFIX}/tasks/non-existent`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
