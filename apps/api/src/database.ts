import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

/**
 * Get or create the database connection.
 * Uses SQLite for simplicity and portability.
 */
export function getDatabase(dbPath?: string): Database.Database {
  if (db) return db;

  const resolvedPath = dbPath ?? path.join(process.cwd(), 'data', 'open-agents.db');
  db = new Database(resolvedPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Create an in-memory database for testing.
 */
export function createTestDatabase(): Database.Database {
  const testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');
  return testDb;
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Run all migrations to set up the database schema.
 */
export function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      team TEXT NOT NULL CHECK(team IN ('CREATIVE', 'MANAGER', 'CODE_WRITER')),
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('ACTIVE', 'IDLE', 'SUSPENDED', 'PENDING')),
      capabilities TEXT NOT NULL DEFAULT '[]',
      reputation INTEGER NOT NULL DEFAULT 0,
      auth_token TEXT NOT NULL UNIQUE,
      max_tokens_per_hour INTEGER NOT NULL DEFAULT 100000,
      max_tokens_per_day INTEGER NOT NULL DEFAULT 1000000,
      max_tokens_per_month INTEGER NOT NULL DEFAULT 20000000,
      used_tokens_current_hour INTEGER NOT NULL DEFAULT 0,
      used_tokens_current_day INTEGER NOT NULL DEFAULT 0,
      used_tokens_current_month INTEGER NOT NULL DEFAULT 0,
      hourly_reset_at TEXT NOT NULL,
      daily_reset_at TEXT NOT NULL,
      monthly_reset_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      repository_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PROPOSED' CHECK(status IN ('PROPOSED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
      tags TEXT NOT NULL DEFAULT '[]',
      created_by_agent_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by_agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS project_agents (
      project_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      PRIMARY KEY (project_id, agent_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      project_id TEXT NOT NULL,
      assigned_agent_id TEXT,
      created_by_agent_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'BACKLOG' CHECK(status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED')),
      priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      estimated_tokens INTEGER NOT NULL DEFAULT 0,
      actual_tokens_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      tokens_used INTEGER NOT NULL DEFAULT 0,
      project_id TEXT,
      task_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaboration_messages (
      id TEXT PRIMARY KEY,
      from_agent_id TEXT NOT NULL,
      to_agent_id TEXT,
      to_team TEXT CHECK(to_team IS NULL OR to_team IN ('CREATIVE', 'MANAGER', 'CODE_WRITER')),
      project_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_message_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (from_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (to_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_message_id) REFERENCES collaboration_messages(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_agents_team ON agents(team);
    CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_agent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_activity_agent ON activity_logs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_messages_project ON collaboration_messages(project_id);
  `);
}
