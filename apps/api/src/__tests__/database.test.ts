import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';

describe('Database', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe('createTestDatabase', () => {
    it('should create an in-memory database', () => {
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
    });

    it('should have foreign keys enabled', () => {
      const result = db.pragma('foreign_keys') as { foreign_keys: number }[];
      expect(result[0].foreign_keys).toBe(1);
    });
  });

  describe('runMigrations', () => {
    it('should create all required tables', () => {
      runMigrations(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('agents');
      expect(tableNames).toContain('projects');
      expect(tableNames).toContain('project_agents');
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('activity_logs');
      expect(tableNames).toContain('collaboration_messages');
    });

    it('should be idempotent (running twice should not error)', () => {
      runMigrations(db);
      expect(() => runMigrations(db)).not.toThrow();
    });

    it('should create indexes', () => {
      runMigrations(db);

      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
        .all() as { name: string }[];

      const indexNames = indexes.map((i) => i.name);
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
