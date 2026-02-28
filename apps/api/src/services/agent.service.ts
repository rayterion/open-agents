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

  /**
   * Register a new AI agent.
   */
  registerAgent(dto: CreateAgentDto): Agent {
    const agent = this.agentRepo.create(dto);

    this.activityLogRepo.create({
      agentId: agent.id,
      action: 'AGENT_REGISTERED',
      details: `Agent "${agent.name}" registered to team ${agent.team}`,
    });

    return agent;
  }

  /**
   * Get agent by ID.
   */
  getAgent(id: string): Agent | null {
    return this.agentRepo.findById(id);
  }

  /**
   * Authenticate agent by token.
   */
  authenticateAgent(token: string): Agent | null {
    return this.agentRepo.findByAuthToken(token);
  }

  /**
   * List all agents with pagination.
   */
  listAgents(
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): PaginatedResponse<Agent> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { agents, total } = this.agentRepo.findAll(page, clampedSize);
    return createPaginatedResponse(agents, total, page, clampedSize);
  }

  /**
   * List agents by team.
   */
  listAgentsByTeam(
    team: AgentTeam,
    page: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ): PaginatedResponse<Agent> {
    const clampedSize = Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE);
    const { agents, total } = this.agentRepo.findByTeam(team, page, clampedSize);
    return createPaginatedResponse(agents, total, page, clampedSize);
  }

  /**
   * Update agent configuration.
   */
  updateAgent(id: string, dto: UpdateAgentDto): Agent | null {
    const updated = this.agentRepo.update(id, dto);

    if (updated) {
      this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_UPDATED',
        details: `Agent configuration updated: ${Object.keys(dto).join(', ')}`,
      });
    }

    return updated;
  }

  /**
   * Activate an agent (move from PENDING to ACTIVE).
   */
  activateAgent(id: string): Agent | null {
    const agent = this.agentRepo.findById(id);
    if (!agent) return null;

    if (agent.status !== AgentStatus.PENDING && agent.status !== AgentStatus.IDLE) {
      return agent;
    }

    const updated = this.agentRepo.updateStatus(id, AgentStatus.ACTIVE);

    if (updated) {
      this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_ACTIVATED',
        details: `Agent status changed from ${agent.status} to ACTIVE`,
      });
    }

    return updated;
  }

  /**
   * Suspend an agent.
   */
  suspendAgent(id: string, reason: string): Agent | null {
    const updated = this.agentRepo.updateStatus(id, AgentStatus.SUSPENDED);

    if (updated) {
      this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_SUSPENDED',
        details: `Agent suspended: ${reason}`,
      });
    }

    return updated;
  }

  /**
   * Record token usage and check if agent should be moved to idle.
   */
  recordTokenUsage(id: string, tokensUsed: number): Agent | null {
    this.agentRepo.updateTokenUsage(id, tokensUsed);

    const agent = this.agentRepo.findById(id);
    if (!agent) return null;

    if (isTokenLimitExceeded(agent.tokenBudget) && agent.status === AgentStatus.ACTIVE) {
      this.agentRepo.updateStatus(id, AgentStatus.IDLE);

      this.activityLogRepo.create({
        agentId: id,
        action: 'AGENT_IDLE_TOKEN_LIMIT',
        details: 'Agent moved to idle due to token limit exceeded',
        tokensUsed,
      });

      return this.agentRepo.findById(id);
    }

    return agent;
  }

  /**
   * Delete an agent.
   */
  deleteAgent(id: string): boolean {
    return this.agentRepo.delete(id);
  }
}
