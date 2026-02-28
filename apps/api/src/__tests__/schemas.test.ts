import {
  createAgentSchema,
  updateAgentSchema,
  createProjectSchema,
  createTaskSchema,
  updateTaskStatusSchema,
  paginationSchema,
  recordTokensSchema,
  suspendAgentSchema,
  assignTaskSchema,
  assignProjectAgentSchema,
  updateProjectStatusSchema,
} from '../schemas';
import { AgentTeam, TaskPriority, TaskStatus, ProjectStatus } from '@open-agents/shared';

describe('Schemas', () => {
  describe('createAgentSchema', () => {
    it('should accept valid data', () => {
      const result = createAgentSchema.safeParse({
        name: 'TestAgent',
        description: 'A test agent',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['typescript'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createAgentSchema.safeParse({
        name: '',
        description: 'A test agent',
        team: AgentTeam.CODE_WRITER,
        capabilities: ['typescript'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid team', () => {
      const result = createAgentSchema.safeParse({
        name: 'Test',
        description: 'A test agent',
        team: 'INVALID_TEAM',
        capabilities: ['typescript'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty capabilities', () => {
      const result = createAgentSchema.safeParse({
        name: 'Test',
        description: 'A test agent',
        team: AgentTeam.CODE_WRITER,
        capabilities: [],
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional token limits', () => {
      const result = createAgentSchema.safeParse({
        name: 'Test',
        description: 'A test',
        team: AgentTeam.MANAGER,
        capabilities: ['manage'],
        maxTokensPerHour: 50000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateAgentSchema', () => {
    it('should accept partial updates', () => {
      expect(updateAgentSchema.safeParse({ name: 'New' }).success).toBe(true);
      expect(updateAgentSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('createProjectSchema', () => {
    it('should accept valid data', () => {
      const result = createProjectSchema.safeParse({
        name: 'Project',
        description: 'Desc',
        repositoryUrl: 'https://github.com/test/repo',
        tags: ['ai'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = createProjectSchema.safeParse({
        name: 'Project',
        description: 'Desc',
        repositoryUrl: 'not-a-url',
        tags: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createTaskSchema', () => {
    it('should accept valid data', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        description: 'Desc',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        priority: TaskPriority.HIGH,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid priority', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        description: 'Desc',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        priority: 'INVALID',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional estimated tokens', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        description: 'Desc',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        priority: TaskPriority.LOW,
        estimatedTokens: 5000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateTaskStatusSchema', () => {
    it('should accept valid status', () => {
      const result = updateTaskStatusSchema.safeParse({ status: TaskStatus.IN_PROGRESS });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateTaskStatusSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectStatusSchema', () => {
    it('should accept valid status', () => {
      const result = updateProjectStatusSchema.safeParse({ status: ProjectStatus.IN_PROGRESS });
      expect(result.success).toBe(true);
    });
  });

  describe('paginationSchema', () => {
    it('should provide defaults', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should coerce string values', () => {
      const result = paginationSchema.parse({ page: '3', pageSize: '10' });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
    });

    it('should reject page size over 100', () => {
      const result = paginationSchema.safeParse({ pageSize: '200' });
      expect(result.success).toBe(false);
    });
  });

  describe('recordTokensSchema', () => {
    it('should accept positive integers', () => {
      expect(recordTokensSchema.safeParse({ tokensUsed: 100 }).success).toBe(true);
    });

    it('should reject zero', () => {
      expect(recordTokensSchema.safeParse({ tokensUsed: 0 }).success).toBe(false);
    });
  });

  describe('suspendAgentSchema', () => {
    it('should accept valid reason', () => {
      expect(suspendAgentSchema.safeParse({ reason: 'Policy violation' }).success).toBe(true);
    });

    it('should reject empty reason', () => {
      expect(suspendAgentSchema.safeParse({ reason: '' }).success).toBe(false);
    });
  });

  describe('assignTaskSchema', () => {
    it('should accept valid UUID', () => {
      expect(
        assignTaskSchema.safeParse({ agentId: '550e8400-e29b-41d4-a716-446655440000' }).success,
      ).toBe(true);
    });

    it('should reject non-UUID', () => {
      expect(assignTaskSchema.safeParse({ agentId: 'not-a-uuid' }).success).toBe(false);
    });
  });

  describe('assignProjectAgentSchema', () => {
    it('should accept valid UUID', () => {
      expect(
        assignProjectAgentSchema.safeParse({ agentId: '550e8400-e29b-41d4-a716-446655440000' })
          .success,
      ).toBe(true);
    });
  });
});
