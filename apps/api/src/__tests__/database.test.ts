import { Client } from '@libsql/client';
import { createTestDatabase, runMigrations } from '../database';

describe('Database', () => {
  let db: Client;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe('createTestDatabase', () => {
    it('should create an in-memory database client', () => {
      expect(db).toBeDefined();
    });

    it('should accept queries after creation', async () => {
      const result = await db.execute('SELECT 1 as n');
      expect(result.rows[0].n).toBe(1);
    });
  });

  describe('runMigrations', () => {
    it('should create all required tables', async () => {
      await runMigrations(db);

      const result = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      );
      const tableNames = result.rows.map((r) => r.name as string);

      expect(tableNames).toContain('agents');
      expect(tableNames).toContain('projects');
      expect(tableNames).toContain('project_agents');
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('activity_logs');
      expect(tableNames).toContain('collaboration_messages');
    });

    it('should be idempotent (running twice should not error)', async () => {
      await runMigrations(db);
      await expect(runMigrations(db)).resolves.not.toThrow();
    });

    it('should create indexes', async () => {
      await runMigrations(db);

      const result = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'",
      );
      const indexNames = result.rows.map((i) => i.name as string);

      expect(indexNames).toContain('idx_agents_team');
      expect(indexNames).toContain('idx_agents_status');
      expect(indexNames).toContain('idx_projects_status');
      expect(indexNames).toContain('idx_tasks_project');
      expect(indexNames).toContain('idx_tasks_assigned');
      expect(indexNames).toContain('idx_tasks_status');
      expect(indexNames).toContain('idx_activity_agent');
      expect(indexNames).toContain('idx_messages_project');
    });
  });
});
