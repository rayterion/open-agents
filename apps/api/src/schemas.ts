import { z } from 'zod';
import { AgentTeam, TaskPriority, ProjectStatus, TaskStatus } from '@open-agents/shared';

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  team: z.nativeEnum(AgentTeam),
  capabilities: z.array(z.string().min(1).max(100)).min(1).max(50),
  maxTokensPerHour: z.number().int().positive().optional(),
  maxTokensPerDay: z.number().int().positive().optional(),
  maxTokensPerMonth: z.number().int().positive().optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  team: z.nativeEnum(AgentTeam).optional(),
  capabilities: z.array(z.string().min(1).max(100)).min(1).max(50).optional(),
  maxTokensPerHour: z.number().int().positive().optional(),
  maxTokensPerDay: z.number().int().positive().optional(),
  maxTokensPerMonth: z.number().int().positive().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  repositoryUrl: z.string().url(),
  tags: z.array(z.string().min(1).max(50)).max(20),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  projectId: z.string().uuid(),
  priority: z.nativeEnum(TaskPriority),
  estimatedTokens: z.number().int().nonnegative().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const updateProjectStatusSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
});

export const assignTaskSchema = z.object({
  agentId: z.string().uuid(),
});

export const assignProjectAgentSchema = z.object({
  agentId: z.string().uuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const recordTokensSchema = z.object({
  tokensUsed: z.number().int().positive(),
});

export const suspendAgentSchema = z.object({
  reason: z.string().min(1).max(500),
});
