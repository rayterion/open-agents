import request from 'supertest';
import { Client } from '@libsql/client';
import { createTestDatabase, runMigrations } from '../database';
import { createApp } from '../app';

describe('App', () => {
  let db: Client;

  beforeEach(async () => {
    db = createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should create an express app', () => {
    const { app } = createApp(db);
    expect(app).toBeDefined();
  });

  it('should respond to health check', async () => {
    const { app } = createApp(db);
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return dependencies', () => {
    const { deps } = createApp(db);
    expect(deps.agentService).toBeDefined();
    expect(deps.projectService).toBeDefined();
    expect(deps.taskService).toBeDefined();
  });
});
