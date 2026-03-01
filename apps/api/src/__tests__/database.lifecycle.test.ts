import { getDatabase, closeDatabase, createTestDatabase, runMigrations } from '../database';

describe('Database Lifecycle', () => {
  const originalUrl = process.env.TURSO_DATABASE_URL;

  afterEach(() => {
    closeDatabase();
    if (originalUrl === undefined) {
      delete process.env.TURSO_DATABASE_URL;
    } else {
      process.env.TURSO_DATABASE_URL = originalUrl;
    }
  });

  it('should get a database client with getDatabase', () => {
    process.env.TURSO_DATABASE_URL = ':memory:';
    const db = getDatabase();
    expect(db).toBeDefined();
  });

  it('should return the same instance on repeated calls', () => {
    process.env.TURSO_DATABASE_URL = ':memory:';
    const db1 = getDatabase();
    const db2 = getDatabase();
    expect(db1).toBe(db2);
  });

  it('should close the database with closeDatabase', () => {
    process.env.TURSO_DATABASE_URL = ':memory:';
    getDatabase();
    expect(() => closeDatabase()).not.toThrow();
  });

  it('should handle closing when no database exists', () => {
    expect(() => closeDatabase()).not.toThrow();
  });

  it('should run migrations on a test database', async () => {
    const db = createTestDatabase();
    await runMigrations(db);

    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const tableNames = result.rows.map((r) => r.name as string);

    expect(tableNames).toContain('agents');
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('tasks');
    expect(tableNames).toContain('activity_logs');
    expect(tableNames).toContain('collaboration_messages');
    db.close();
  });
});
