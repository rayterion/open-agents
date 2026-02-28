import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectStatus, CreateProjectDto } from '@open-agents/shared';

export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  repository_url: string;
  status: string;
  tags: string;
  created_by_agent_id: string;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow, assignedAgentIds: string[] = []): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    repositoryUrl: row.repository_url,
    status: row.status as ProjectStatus,
    tags: JSON.parse(row.tags),
    createdByAgentId: row.created_by_agent_id,
    assignedAgentIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProjectRepository {
  constructor(private db: Database.Database) {}

  create(dto: CreateProjectDto, agentId: string): Project {
    const id = uuidv4();

    this.db
      .prepare(
        `INSERT INTO projects (id, name, description, repository_url, tags, created_by_agent_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, dto.name, dto.description, dto.repositoryUrl, JSON.stringify(dto.tags), agentId);

    // Assign creator to the project
    this.db
      .prepare('INSERT INTO project_agents (project_id, agent_id) VALUES (?, ?)')
      .run(id, agentId);

    return this.findById(id)!;
  }

  findById(id: string): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
      | ProjectRow
      | undefined;

    if (!row) return null;

    const agentIds = this.getAssignedAgentIds(id);
    return rowToProject(row, agentIds);
  }

  findAll(page: number, pageSize: number): { projects: Project[]; total: number } {
    const total = (
      this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }
    ).count;

    const rows = this.db
      .prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(pageSize, (page - 1) * pageSize) as ProjectRow[];

    const projects = rows.map((row) => {
      const agentIds = this.getAssignedAgentIds(row.id);
      return rowToProject(row, agentIds);
    });

    return { projects, total };
  }

  findByStatus(
    status: ProjectStatus,
    page: number,
    pageSize: number,
  ): { projects: Project[]; total: number } {
    const total = (
      this.db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get(status) as {
        count: number;
      }
    ).count;

    const rows = this.db
      .prepare('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(status, pageSize, (page - 1) * pageSize) as ProjectRow[];

    const projects = rows.map((row) => {
      const agentIds = this.getAssignedAgentIds(row.id);
      return rowToProject(row, agentIds);
    });

    return { projects, total };
  }

  updateStatus(id: string, status: ProjectStatus): Project | null {
    this.db
      .prepare("UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, id);
    return this.findById(id);
  }

  assignAgent(projectId: string, agentId: string): void {
    this.db
      .prepare('INSERT OR IGNORE INTO project_agents (project_id, agent_id) VALUES (?, ?)')
      .run(projectId, agentId);
  }

  removeAgent(projectId: string, agentId: string): void {
    this.db
      .prepare('DELETE FROM project_agents WHERE project_id = ? AND agent_id = ?')
      .run(projectId, agentId);
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  }

  private getAssignedAgentIds(projectId: string): string[] {
    const rows = this.db
      .prepare('SELECT agent_id FROM project_agents WHERE project_id = ?')
      .all(projectId) as { agent_id: string }[];
    return rows.map((r) => r.agent_id);
  }
}
