import { Client } from '@libsql/client';
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
  constructor(private db: Client) {}

  async create(dto: CreateProjectDto, agentId: string): Promise<Project> {
    const id = uuidv4();

    await this.db.execute({
      sql: `INSERT INTO projects (id, name, description, repository_url, tags, created_by_agent_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, dto.name, dto.description, dto.repositoryUrl, JSON.stringify(dto.tags), agentId],
    });

    // Assign creator to the project
    await this.db.execute({
      sql: 'INSERT INTO project_agents (project_id, agent_id) VALUES (?, ?)',
      args: [id, agentId],
    });

    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Project | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });

    if (!result.rows[0]) return null;

    const row = result.rows[0] as unknown as ProjectRow;
    const agentIds = await this.getAssignedAgentIds(id);
    return rowToProject(row, agentIds);
  }

  async findAll(page: number, pageSize: number): Promise<{ projects: Project[]; total: number }> {
    const countResult = await this.db.execute('SELECT COUNT(*) as count FROM projects');
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [pageSize, (page - 1) * pageSize],
    });

    const projects = await Promise.all(
      (result.rows as unknown as ProjectRow[]).map(async (row) => {
        const agentIds = await this.getAssignedAgentIds(row.id);
        return rowToProject(row, agentIds);
      }),
    );

    return { projects, total };
  }

  async findByStatus(status: ProjectStatus, page: number, pageSize: number): Promise<{ projects: Project[]; total: number }> {
    const countResult = await this.db.execute({
      sql: 'SELECT COUNT(*) as count FROM projects WHERE status = ?',
      args: [status],
    });
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [status, pageSize, (page - 1) * pageSize],
    });

    const projects = await Promise.all(
      (result.rows as unknown as ProjectRow[]).map(async (row) => {
        const agentIds = await this.getAssignedAgentIds(row.id);
        return rowToProject(row, agentIds);
      }),
    );

    return { projects, total };
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project | null> {
    await this.db.execute({
      sql: "UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?",
      args: [status, id],
    });
    return this.findById(id);
  }

  async assignAgent(projectId: string, agentId: string): Promise<void> {
    await this.db.execute({
      sql: 'INSERT OR IGNORE INTO project_agents (project_id, agent_id) VALUES (?, ?)',
      args: [projectId, agentId],
    });
  }

  async removeAgent(projectId: string, agentId: string): Promise<void> {
    await this.db.execute({
      sql: 'DELETE FROM project_agents WHERE project_id = ? AND agent_id = ?',
      args: [projectId, agentId],
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.execute({
      sql: 'DELETE FROM projects WHERE id = ?',
      args: [id],
    });
    return result.rowsAffected > 0;
  }

  private async getAssignedAgentIds(projectId: string): Promise<string[]> {
    const result = await this.db.execute({
      sql: 'SELECT agent_id FROM project_agents WHERE project_id = ?',
      args: [projectId],
    });
    return (result.rows as unknown as { agent_id: string }[]).map((r) => r.agent_id);
  }
}
