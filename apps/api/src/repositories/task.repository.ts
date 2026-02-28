import { Client } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, CreateTaskDto } from '@open-agents/shared';

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  project_id: string;
  assigned_agent_id: string | null;
  created_by_agent_id: string;
  status: string;
  priority: string;
  estimated_tokens: number;
  actual_tokens_used: number;
  created_at: string;
  updated_at: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.project_id,
    assignedAgentId: row.assigned_agent_id,
    createdByAgentId: row.created_by_agent_id,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    estimatedTokens: row.estimated_tokens,
    actualTokensUsed: row.actual_tokens_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TaskRepository {
  constructor(private db: Client) {}

  async create(dto: CreateTaskDto, agentId: string): Promise<Task> {
    const id = uuidv4();

    await this.db.execute({
      sql: `INSERT INTO tasks (id, title, description, project_id, created_by_agent_id, priority, estimated_tokens)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, dto.title, dto.description, dto.projectId, agentId, dto.priority, dto.estimatedTokens ?? 0],
    });

    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Task | null> {
    const result = await this.db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [id] });
    const row = result.rows[0] as unknown as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  }

  async findByProject(projectId: string, page: number, pageSize: number): Promise<{ tasks: Task[]; total: number }> {
    const countResult = await this.db.execute({
      sql: 'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?',
      args: [projectId],
    });
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [projectId, pageSize, (page - 1) * pageSize],
    });

    return { tasks: (result.rows as unknown as TaskRow[]).map(rowToTask), total };
  }

  async findByAgent(agentId: string, page: number, pageSize: number): Promise<{ tasks: Task[]; total: number }> {
    const countResult = await this.db.execute({
      sql: 'SELECT COUNT(*) as count FROM tasks WHERE assigned_agent_id = ?',
      args: [agentId],
    });
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM tasks WHERE assigned_agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [agentId, pageSize, (page - 1) * pageSize],
    });

    return { tasks: (result.rows as unknown as TaskRow[]).map(rowToTask), total };
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    await this.db.execute({
      sql: "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?",
      args: [status, id],
    });
    return this.findById(id);
  }

  async assignAgent(id: string, agentId: string): Promise<Task | null> {
    await this.db.execute({
      sql: "UPDATE tasks SET assigned_agent_id = ?, status = 'TODO', updated_at = datetime('now') WHERE id = ?",
      args: [agentId, id],
    });
    return this.findById(id);
  }

  async updateTokensUsed(id: string, tokensUsed: number): Promise<void> {
    await this.db.execute({
      sql: "UPDATE tasks SET actual_tokens_used = actual_tokens_used + ?, updated_at = datetime('now') WHERE id = ?",
      args: [tokensUsed, id],
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] });
    return result.rowsAffected > 0;
  }
}
