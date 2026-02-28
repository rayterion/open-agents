import path from 'path';
import fs from 'fs';
import { getDatabase, closeDatabase, runMigrations } from '../database';

describe('Database Lifecycle', () => {
  const testDataDir = path.join(process.cwd(), 'data');
  const testDbPath = path.join(testDataDir, 'test-lifecycle.db');

  afterEach(() => {
    closeDatabase();
    // Clean up file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testDataDir)) {
      try {
        fs.rmdirSync(testDataDir);
      } catch {
        // Directory might not be empty
      }
    }
  });

  it('should create a file-based database with getDatabase', () => {
    // Ensure data directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    const db = getDatabase(testDbPath);
    expect(db).toBeDefined();
    expect(db.open).toBe(true);

    // Verify WAL mode
    const journalMode = db.pragma('journal_mode', { simple: true }) as string;
    expect(journalMode).toBe('wal');

    // Verify foreign keys enabled
    const fk = db.pragma('foreign_keys', { simple: true }) as number;
    expect(fk).toBe(1);
  });

  it('should return the same instance on repeated calls', () => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    const db1 = getDatabase(testDbPath);
    const db2 = getDatabase(testDbPath);
    expect(db1).toBe(db2);
  });

  it('should close the database with closeDatabase', () => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    const db = getDatabase(testDbPath);
    expect(db.open).toBe(true);

    closeDatabase();
    expect(db.open).toBe(false);
  });

  it('should handle closing when no database exists', () => {
    // Should not throw
    expect(() => closeDatabase()).not.toThrow();
  });

  it('should run migrations on file-based database', () => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    const db = getDatabase(testDbPath);
    runMigrations(db);

    // Verify tables were created
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('agents');
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('tasks');
    expect(tableNames).toContain('activity_logs');
    expect(tableNames).toContain('collaboration_messages');
  });
});
