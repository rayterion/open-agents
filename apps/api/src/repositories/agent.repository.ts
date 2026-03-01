import { Client } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  AgentTeam,
  AgentStatus,
  CreateAgentDto,
  UpdateAgentDto,
  createDefaultTokenBudget,
} from '@open-agents/shared';

export interface AgentRow {
  id: string;
  name: string;
  description: string;
  team: string;
  status: string;
  capabilities: string;
  reputation: number;
  auth_token: string;
  max_tokens_per_hour: number;
  max_tokens_per_day: number;
  max_tokens_per_month: number;
  used_tokens_current_hour: number;
  used_tokens_current_day: number;
  used_tokens_current_month: number;
  hourly_reset_at: string;
  daily_reset_at: string;
  monthly_reset_at: string;
  created_at: string;
  updated_at: string;
}

function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    team: row.team as AgentTeam,
    status: row.status as AgentStatus,
    capabilities: JSON.parse(row.capabilities),
    reputation: row.reputation,
    authToken: row.auth_token,
    tokenBudget: {
      maxTokensPerHour: row.max_tokens_per_hour,
      maxTokensPerDay: row.max_tokens_per_day,
      maxTokensPerMonth: row.max_tokens_per_month,
      usedTokensCurrentHour: row.used_tokens_current_hour,
      usedTokensCurrentDay: row.used_tokens_current_day,
      usedTokensCurrentMonth: row.used_tokens_current_month,
      hourlyResetAt: row.hourly_reset_at,
      dailyResetAt: row.daily_reset_at,
      monthlyResetAt: row.monthly_reset_at,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AgentRepository {
  constructor(private db: Client) {}

  async create(dto: CreateAgentDto): Promise<Agent> {
    const id = uuidv4();
    const authToken = uuidv4();
    const budget = createDefaultTokenBudget({
      maxTokensPerHour: dto.maxTokensPerHour,
      maxTokensPerDay: dto.maxTokensPerDay,
      maxTokensPerMonth: dto.maxTokensPerMonth,
    });

    await this.db.execute({
      sql: `INSERT INTO agents (
        id, name, description, team, status, capabilities, reputation, auth_token,
        max_tokens_per_hour, max_tokens_per_day, max_tokens_per_month,
        used_tokens_current_hour, used_tokens_current_day, used_tokens_current_month,
        hourly_reset_at, daily_reset_at, monthly_reset_at
      ) VALUES (?, ?, ?, ?, 'PENDING', ?, 0, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)`,
      args: [
        id,
        dto.name,
        dto.description,
        dto.team,
        JSON.stringify(dto.capabilities),
        authToken,
        budget.maxTokensPerHour,
        budget.maxTokensPerDay,
        budget.maxTokensPerMonth,
        budget.hourlyResetAt,
        budget.dailyResetAt,
        budget.monthlyResetAt,
      ],
    });

    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Agent | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM agents WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0] as unknown as AgentRow | undefined;
    return row ? rowToAgent(row) : null;
  }

  async findByAuthToken(token: string): Promise<Agent | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM agents WHERE auth_token = ?',
      args: [token],
    });
    const row = result.rows[0] as unknown as AgentRow | undefined;
    return row ? rowToAgent(row) : null;
  }

  async findAll(page: number, pageSize: number): Promise<{ agents: Agent[]; total: number }> {
    const countResult = await this.db.execute('SELECT COUNT(*) as count FROM agents');
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM agents ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [pageSize, (page - 1) * pageSize],
    });

    return { agents: (result.rows as unknown as AgentRow[]).map(rowToAgent), total };
  }

  async findByTeam(team: AgentTeam, page: number, pageSize: number): Promise<{ agents: Agent[]; total: number }> {
    const countResult = await this.db.execute({
      sql: 'SELECT COUNT(*) as count FROM agents WHERE team = ?',
      args: [team],
    });
    const total = Number((countResult.rows[0] as any).count);

    const result = await this.db.execute({
      sql: 'SELECT * FROM agents WHERE team = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [team, pageSize, (page - 1) * pageSize],
    });

    return { agents: (result.rows as unknown as AgentRow[]).map(rowToAgent), total };
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.description !== undefined) { fields.push('description = ?'); values.push(dto.description); }
    if (dto.team !== undefined) { fields.push('team = ?'); values.push(dto.team); }
    if (dto.capabilities !== undefined) { fields.push('capabilities = ?'); values.push(JSON.stringify(dto.capabilities)); }
    if (dto.maxTokensPerHour !== undefined) { fields.push('max_tokens_per_hour = ?'); values.push(dto.maxTokensPerHour); }
    if (dto.maxTokensPerDay !== undefined) { fields.push('max_tokens_per_day = ?'); values.push(dto.maxTokensPerDay); }
    if (dto.maxTokensPerMonth !== undefined) { fields.push('max_tokens_per_month = ?'); values.push(dto.maxTokensPerMonth); }

    if (fields.length === 0) return existing;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await this.db.execute({
      sql: `UPDATE agents SET ${fields.join(', ')} WHERE id = ?`,
      args: values as any,
    });

    return this.findById(id);
  }

  async updateStatus(id: string, status: AgentStatus): Promise<Agent | null> {
    await this.db.execute({
      sql: "UPDATE agents SET status = ?, updated_at = datetime('now') WHERE id = ?",
      args: [status, id],
    });
    return this.findById(id);
  }

  async updateTokenUsage(id: string, tokensUsed: number): Promise<void> {
    await this.db.execute({
      sql: `UPDATE agents SET
          used_tokens_current_hour = used_tokens_current_hour + ?,
          used_tokens_current_day = used_tokens_current_day + ?,
          used_tokens_current_month = used_tokens_current_month + ?,
          updated_at = datetime('now')
        WHERE id = ?`,
      args: [tokensUsed, tokensUsed, tokensUsed, id],
    });
  }

  async updateReputation(id: string, points: number): Promise<void> {
    await this.db.execute({
      sql: "UPDATE agents SET reputation = reputation + ?, updated_at = datetime('now') WHERE id = ?",
      args: [points, id],
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.execute({
      sql: 'DELETE FROM agents WHERE id = ?',
      args: [id],
    });
    return result.rowsAffected > 0;
  }
}
