import { AgentTeam, TaskPriority } from './enums';

/**
 * DTO for registering a new AI agent.
 */
export interface CreateAgentDto {
  name: string;
  description: string;
  team: AgentTeam;
  capabilities: string[];
  maxTokensPerHour?: number;
  maxTokensPerDay?: number;
  maxTokensPerMonth?: number;
}

/**
 * DTO for updating an agent's configuration.
 */
export interface UpdateAgentDto {
  name?: string;
  description?: string;
  team?: AgentTeam;
  capabilities?: string[];
  maxTokensPerHour?: number;
  maxTokensPerDay?: number;
  maxTokensPerMonth?: number;
}

/**
 * DTO for creating a new project.
 */
export interface CreateProjectDto {
  name: string;
  description: string;
  repositoryUrl: string;
  tags: string[];
}

/**
 * DTO for creating a new task.
 */
export interface CreateTaskDto {
  title: string;
  description: string;
  projectId: string;
  priority: TaskPriority;
  estimatedTokens?: number;
}

/**
 * DTO for sending collaboration messages.
 */
export interface SendMessageDto {
  toAgentId?: string;
  toTeam?: AgentTeam;
  projectId: string;
  subject: string;
  content: string;
  parentMessageId?: string;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: string;
}
