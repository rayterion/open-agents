import {
  Agent,
  AgentTeam,
  AgentStatus,
  CreateAgentDto,
  UpdateAgentDto,
  PaginatedResponse,
  createPaginatedResponse,
  isTokenLimitExceeded,
  PAGINATION,
} from '@open-agents/shared';
import { AgentRepository } from '../repositories/agent.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';

export class AgentService {
  constructor(
    private agentRepo: AgentRepository,
    private activityLogRepo: ActivityLogRepository,
  ) {}

  async registerAgent(dto: CreateAgentDto): Promise<Agent> {
    const agent = await this.agentRepo.create(dto);

    await this.activityLogRepo.create({
      agentId: agent.id,
      action: 'AGENT_REGISTERED',
      details: `Agent "${agent.name}" registered to team ${agent.team}`,
    });

    return agent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    return this.agentRepo.findById(id);
  }

  async authenticateAgent(token: string): Promise<Agent | null> {
    return this.agentRepo.findByAuthToken(token);
  }

  async listAgents(
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResponse<Agent>> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { agents, total } = await this.agentRepo.findAll(page, clampedSize);
    return createPaginatedResponse(agents, total, page, clampedSize);
  }

  async listAgentsByTeam(
    team: AgentTeam,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResponse<Agent>> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { agents, total } = await this.agentRepo.findByTeam(team, page, clampedSize);
    return createPaginatedResponse(agents, total, page, clampedSize);
  }

  async updateAgent(id: string, dto: UpdateAgentDto): Promise<Agent | null> {
    const updated = await this.agentRepo.update(id, dto);

    if (updated) {
      await this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_UPDATED',
        details: `Agent configuration updated: ${Object.keys(dto).join(', ')}`,
      });
    }

    return updated;
  }

  async activateAgent(id: string): Promise<Agent | null> {
    const agent = await this.agentRepo.findById(id);
    if (!agent) return null;

    if (agent.status !== AgentStatus.PENDING && agent.status !== AgentStatus.IDLE) {
      return agent;
    }

    const updated = await this.agentRepo.updateStatus(id, AgentStatus.ACTIVE);

    if (updated) {
      await this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_ACTIVATED',
        details: `Agent status changed from ${agent.status} to ACTIVE`,
      });
    }

    return updated;
  }

  async suspendAgent(id: string, reason: string): Promise<Agent | null> {
    const updated = await this.agentRepo.updateStatus(id, AgentStatus.SUSPENDED);

    if (updated) {
      await this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_SUSPENDED',
        details: `Agent suspended: ${reason}`,
      });
    }

    return updated;
  }

  async recordTokenUsage(id: string, tokensUsed: number): Promise<Agent | null> {
    await this.agentRepo.updateTokenUsage(id, tokensUsed);

    const agent = await this.agentRepo.findById(id);
    if (!agent) return null;

    if (isTokenLimitExceeded(agent.tokenBudget) && agent.status === AgentStatus.ACTIVE) {
      await this.agentRepo.updateStatus(id, AgentStatus.IDLE);

      await this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_IDLE_TOKEN_LIMIT',
        details: 'Agent moved to idle due to token limit exceeded',
        tokensUsed,
      });

      return this.agentRepo.findById(id);
    }

    return agent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agentRepo.delete(id);
  }
}
