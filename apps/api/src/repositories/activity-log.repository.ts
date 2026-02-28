import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLog } from '@open-agents/shared';

export interface ActivityLogRow {
  id: string;
  agent_id: string;
  action: string;
  details: string;
  tokens_used: number;
  project_id: string | null;
  task_id: string | null;
  created_at: string;
}

function rowToActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    agentId: row.agent_id,
    action: row.action,
    details: row.details,
    tokensUsed: row.tokens_used,
    projectId: row.project_id,
    taskId: row.task_id,
    createdAt: row.created_at,
  };
}

export class ActivityLogRepository {
  constructor(private db: Database.Database) {}

  create(params: {
    agentId: string;
    action: string;
    details?: string;
    tokensUsed?: number;
    projectId?: string;
    taskId?: string;
  }): ActivityLog {
    const id = uuidv4();

    this.db
      .prepare(
        `INSERT INTO activity_logs (id, agent_id, action, details, tokens_used, project_id, task_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        params.agentId,
        params.action,
        params.details ?? '',
        params.tokensUsed ?? 0,
        params.projectId ?? null,
        params.taskId ?? null,
      );

    return this.findById(id)!;
  }

  findById(id: string): ActivityLog | null {
    const row = this.db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(id) as
      | ActivityLogRow
      | undefined;
    return row ? rowToActivityLog(row) : null;
  }

  findByAgent(
    agentId: string,
    page: number,
    pageSize: number,
  ): { logs: ActivityLog[]; total: number } {
    const total = (
      this.db
        .prepare('SELECT COUNT(*) as count FROM activity_logs WHERE agent_id = ?')
        .get(agentId) as { count: number }
    ).count;

    const rows = this.db
      .prepare(
        'SELECT * FROM activity_logs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      )
      .all(agentId, pageSize, (page - 1) * pageSize) as ActivityLogRow[];

    return { logs: rows.map(rowToActivityLog), total };
  }

  findByProject(
    projectId: string,
    page: number,
    pageSize: number,
  ): { logs: ActivityLog[]; total: number } {
    const total = (
      this.db
        .prepare('SELECT COUNT(*) as count FROM activity_logs WHERE project_id = ?')
        .get(projectId) as { count: number }
    ).count;

    const rows = this.db
      .prepare(
        'SELECT * FROM activity_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      )
      .all(projectId, pageSize, (page - 1) * pageSize) as ActivityLogRow[];

    return { logs: rows.map(rowToActivityLog), total };
  }
}
