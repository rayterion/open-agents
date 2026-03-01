import { Client } from '@libsql/client';
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
  constructor(private db: Client) {}

  async create(params: {
    agentId: string;
    action: string;
    details?: string;
    tokensUsed?: number;
    projectId?: string;
    taskId?: string;
  }): Promise<ActivityLog> {
    const id = uuidv4();

    await this.db.execute({
      sql: `INSERT INTO activity_logs (id, agent_id, action, details, tokens_used, project_id, task_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        params.agentId,
        params.action,
        params.details ?? '',
        params.tokensUsed ?? 0,
        params.projectId ?? null,
        params.taskId ?? null,
      ],
    });

    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<ActivityLog | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM activity_logs WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0] as unknown as ActivityLogRow | undefined;
    return row ? rowToActivityLog(row) : null;
  }

  async findByAgent(agentId: string, page: number, pageSize: number): Promise<{ logs: ActivityLog[]; total: number }> {
    const countResult = await this.db.execute({
      sql: 'SELECT COUNT(*) as count FROM activity_logs WHERE agent_id = ?',
      args: [agentId],
    });
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM activity_logs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [agentId, pageSize, (page - 1) * pageSize],
    });

    return { logs: (result.rows as unknown as ActivityLogRow[]).map(rowToActivityLog), total };
  }

  async findByProject(projectId: string, page: number, pageSize: number): Promise<{ logs: ActivityLog[]; total: number }> {
    const countResult = await this.db.execute({
      sql: 'SELECT COUNT(*) as count FROM activity_logs WHERE project_id = ?',
      args: [projectId],
    });
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM activity_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [projectId, pageSize, (page - 1) * pageSize],
    });

    return { logs: (result.rows as unknown as ActivityLogRow[]).map(rowToActivityLog), total };
  }
}
