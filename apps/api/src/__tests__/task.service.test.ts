import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { AgentRepository } from '../repositories/agent.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { TaskRepository } from '../repositories/task.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { TaskService } from '../services/task.service';
import { AgentTeam, TaskStatus, TaskPriority } from '@open-agents/shared';

describe('TaskService', () => {
  let db: Database.Database;
  let service: TaskService;
  let testAgentId: string;
  let testProjectId: string;

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    const agentRepo = new AgentRepository(db);
    const projectRepo = new ProjectRepository(db);
    const taskRepo = new TaskRepository(db);
    const logRepo = new ActivityLogRepository(db);
    service = new TaskService(taskRepo, logRepo);

    const agent = agentRepo.create({
      name: 'TestAgent',
      description: 'Test',
      team: AgentTeam.MANAGER,
      capabilities: ['management'],
    });
    testAgentId = agent.id;

    const project = projectRepo.create(
      {
        name: 'TestProject',
        description: 'Test',
        repositoryUrl: 'https://github.com/test/repo',
        tags: ['test'],
      },
      testAgentId,
    );
    testProjectId = project.id;
  });

  afterEach(() => {
    db.close();
  });

  const createTestTask = (title?: string) => {
    return service.createTask(
      {
        title: title ?? 'Test Task',
        description: 'A test task',
        projectId: testProjectId,
        priority: TaskPriority.MEDIUM,
      },
      testAgentId,
    );
  };

  describe('createTask', () => {
    it('should create a task', () => {
      const task = createTestTask();
      expect(task.title).toBe('Test Task');
      expect(task.projectId).toBe(testProjectId);
    });

    it('should log creation activity', () => {
      createTestTask();
      const logRepo = new ActivityLogRepository(db);
      const logs = logRepo.findByAgent(testAgentId, 1, 20);
      expect(logs.logs.some((l) => l.action === 'TASK_CREATED')).toBe(true);
    });
  });

  describe('getTask', () => {
    it('should find task by ID', () => {
      const task = createTestTask();
      expect(service.getTask(task.id)).not.toBeNull();
    });

    it('should return null for non-existent', () => {
      expect(service.getTask('non-existent')).toBeNull();
    });
  });

  describe('listTasksByProject', () => {
    it('should list tasks by project', () => {
      for (let i = 0; i < 3; i++) {
        createTestTask(`Task ${i}`);
      }
      const result = service.listTasksByProject(testProjectId);
      expect(result.total).toBe(3);
    });
  });

  describe('listTasksByAgent', () => {
    it('should list tasks by agent', () => {
      const task = createTestTask();
      service.assignTask(task.id, testAgentId, testAgentId);
      const result = service.listTasksByAgent(testAgentId);
      expect(result.total).toBe(1);
    });
  });

  describe('assignTask', () => {
    it('should assign task to agent', () => {
      const task = createTestTask();
      const assigned = service.assignTask(task.id, testAgentId, testAgentId);
      expect(assigned!.assignedAgentId).toBe(testAgentId);
      expect(assigned!.status).toBe(TaskStatus.TODO);
    });

    it('should return null for non-existent task', () => {
      expect(service.assignTask('non-existent', testAgentId, testAgentId)).toBeNull();
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', () => {
      const task = createTestTask();
      const updated = service.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS, testAgentId);
      expect(updated!.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should return null for non-existent task', () => {
      const result = service.updateTaskStatus('non-existent', TaskStatus.DONE, testAgentId);
      expect(result).toBeNull();
    });
  });

  describe('recordTokenUsage', () => {
    it('should record token usage', () => {
      const task = createTestTask();
      service.recordTokenUsage(task.id, 500);
      const found = service.getTask(task.id);
      expect(found!.actualTokensUsed).toBe(500);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', () => {
      const task = createTestTask();
      expect(service.deleteTask(task.id)).toBe(true);
    });

    it('should return false for non-existent', () => {
      expect(service.deleteTask('non-existent')).toBe(false);
    });
  });
});
