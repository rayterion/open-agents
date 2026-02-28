import Database from 'better-sqlite3';
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
  constructor(private db: Database.Database) {}

  create(dto: CreateTaskDto, agentId: string): Task {
    const id = uuidv4();

    this.db
      .prepare(
        `INSERT INTO tasks (id, title, description, project_id, created_by_agent_id, priority, estimated_tokens)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        dto.title,
        dto.description,
        dto.projectId,
        agentId,
        dto.priority,
        dto.estimatedTokens ?? 0,
      );

    return this.findById(id)!;
  }

  findById(id: string): Task | null {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  }

  findByProject(
    projectId: string,
    page: number,
    pageSize: number,
  ): { tasks: Task[]; total: number } {
    const total = (
      this.db
        .prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?')
        .get(projectId) as {
        count: number;
      }
    ).count;

    const rows = this.db
      .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(projectId, pageSize, (page - 1) * pageSize) as TaskRow[];

    return { tasks: rows.map(rowToTask), total };
  }

  findByAgent(agentId: string, page: number, pageSize: number): { tasks: Task[]; total: number } {
    const total = (
      this.db
        .prepare('SELECT COUNT(*) as count FROM tasks WHERE assigned_agent_id = ?')
        .get(agentId) as { count: number }
    ).count;

    const rows = this.db
      .prepare(
        'SELECT * FROM tasks WHERE assigned_agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      )
      .all(agentId, pageSize, (page - 1) * pageSize) as TaskRow[];

    return { tasks: rows.map(rowToTask), total };
  }

  updateStatus(id: string, status: TaskStatus): Task | null {
    this.db
      .prepare("UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, id);
    return this.findById(id);
  }

  assignAgent(id: string, agentId: string): Task | null {
    this.db
      .prepare(
        "UPDATE tasks SET assigned_agent_id = ?, status = 'TODO', updated_at = datetime('now') WHERE id = ?",
      )
      .run(agentId, id);
    return this.findById(id);
  }

  updateTokensUsed(id: string, tokensUsed: number): void {
    this.db
      .prepare(
        "UPDATE tasks SET actual_tokens_used = actual_tokens_used + ?, updated_at = datetime('now') WHERE id = ?",
      )
      .run(tokensUsed, id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
