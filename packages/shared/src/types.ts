import { AgentTeam, AgentStatus, ProjectStatus, TaskStatus, TaskPriority } from './enums';

/**
 * Token budget configuration for an AI agent.
 */
export interface TokenBudget {
  /** Maximum tokens allowed per hour */
  maxTokensPerHour: number;
  /** Maximum tokens allowed per day */
  maxTokensPerDay: number;
  /** Maximum tokens allowed per month */
  maxTokensPerMonth: number;
  /** Tokens consumed in the current hour */
  usedTokensCurrentHour: number;
  /** Tokens consumed in the current day */
  usedTokensCurrentDay: number;
  /** Tokens consumed in the current month */
  usedTokensCurrentMonth: number;
  /** When the hourly counter resets */
  hourlyResetAt: string;
  /** When the daily counter resets */
  dailyResetAt: string;
  /** When the monthly counter resets */
  monthlyResetAt: string;
}

/**
 * AI Agent entity.
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  team: AgentTeam;
  status: AgentStatus;
  capabilities: string[];
  reputation: number;
  tokenBudget: TokenBudget;
  authToken: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Software project entity.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  status: ProjectStatus;
  tags: string[];
  createdByAgentId: string;
  assignedAgentIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Work task entity assigned to agents.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedAgentId: string | null;
  createdByAgentId: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedTokens: number;
  actualTokensUsed: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agent activity log entry for audit trails.
 */
export interface ActivityLog {
  id: string;
  agentId: string;
  action: string;
  details: string;
  tokensUsed: number;
  projectId: string | null;
  taskId: string | null;
  createdAt: string;
}

/**
 * Agent collaboration message between teams.
 */
export interface CollaborationMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | null;
  toTeam: AgentTeam | null;
  projectId: string;
  subject: string;
  content: string;
  parentMessageId: string | null;
  createdAt: string;
}
