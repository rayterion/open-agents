import Database from 'better-sqlite3';
import { createTestDatabase, runMigrations } from '../database';
import { TaskRepository } from '../repositories/task.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { AgentTeam, TaskStatus, TaskPriority } from '@open-agents/shared';

describe('TaskRepository', () => {
  let db: Database.Database;
  let taskRepo: TaskRepository;
  let agentRepo: AgentRepository;
  let projectRepo: ProjectRepository;
  let testAgentId: string;
  let testProjectId: string;

  beforeEach(() => {
    db = createTestDatabase();
    runMigrations(db);
    taskRepo = new TaskRepository(db);
    agentRepo = new AgentRepository(db);
    projectRepo = new ProjectRepository(db);

    const agent = agentRepo.create({
      name: 'TestAgent',
      description: 'Test agent',
      team: AgentTeam.MANAGER,
      capabilities: ['management'],
    });
    testAgentId = agent.id;

    const project = projectRepo.create(
      {
        name: 'TestProject',
        description: 'Test project',
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
    return taskRepo.create(
      {
        title: title ?? 'Test Task',
        description: 'A test task',
        projectId: testProjectId,
        priority: TaskPriority.MEDIUM,
        estimatedTokens: 5000,
      },
      testAgentId,
    );
  };

  describe('create', () => {
    it('should create a task', () => {
      const task = createTestTask();

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('A test task');
      expect(task.projectId).toBe(testProjectId);
      expect(task.createdByAgentId).toBe(testAgentId);
      expect(task.status).toBe(TaskStatus.BACKLOG);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.estimatedTokens).toBe(5000);
      expect(task.actualTokensUsed).toBe(0);
      expect(task.assignedAgentId).toBeNull();
    });

    it('should default estimatedTokens to 0', () => {
      const task = taskRepo.create(
        {
          title: 'No estimate',
          description: 'No estimate',
          projectId: testProjectId,
          priority: TaskPriority.LOW,
        },
        testAgentId,
      );
      expect(task.estimatedTokens).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find a task by ID', () => {
      const created = createTestTask();
      const found = taskRepo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Test Task');
    });

    it('should return null for non-existent task', () => {
      expect(taskRepo.findById('non-existent')).toBeNull();
    });
  });

  describe('findByProject', () => {
    it('should find tasks by project', () => {
      for (let i = 0; i < 3; i++) {
        createTestTask(`Task ${i}`);
      }

      const result = taskRepo.findByProject(testProjectId, 1, 20);
      expect(result.tasks).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should paginate results', () => {
      for (let i = 0; i < 5; i++) {
        createTestTask(`Task ${i}`);
      }

      const page1 = taskRepo.findByProject(testProjectId, 1, 2);
      expect(page1.tasks).toHaveLength(2);
      expect(page1.total).toBe(5);
    });
  });

  describe('findByAgent', () => {
    it('should find tasks by assigned agent', () => {
      const task = createTestTask();
      taskRepo.assignAgent(task.id, testAgentId);

      const result = taskRepo.findByAgent(testAgentId, 1, 20);
      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should update task status', () => {
      const task = createTestTask();
      const updated = taskRepo.updateStatus(task.id, TaskStatus.IN_PROGRESS);

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('assignAgent', () => {
    it('should assign agent and set status to TODO', () => {
      const task = createTestTask();
      const assigned = taskRepo.assignAgent(task.id, testAgentId);

      expect(assigned).not.toBeNull();
      expect(assigned!.assignedAgentId).toBe(testAgentId);
      expect(assigned!.status).toBe(TaskStatus.TODO);
    });
  });

  describe('updateTokensUsed', () => {
    it('should increment tokens used', () => {
      const task = createTestTask();
      taskRepo.updateTokensUsed(task.id, 2000);
      taskRepo.updateTokensUsed(task.id, 1000);

      const found = taskRepo.findById(task.id);
      expect(found!.actualTokensUsed).toBe(3000);
    });
  });

  describe('delete', () => {
    it('should delete a task', () => {
      const task = createTestTask();
      expect(taskRepo.delete(task.id)).toBe(true);
      expect(taskRepo.findById(task.id)).toBeNull();
    });

    it('should return false for non-existent task', () => {
      expect(taskRepo.delete('non-existent')).toBe(false);
    });
  });
});
