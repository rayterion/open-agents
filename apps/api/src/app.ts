import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Client } from '@libsql/client';
import { API } from '@open-agents/shared';
import {
  AgentRepository,
  ProjectRepository,
  TaskRepository,
  ActivityLogRepository,
} from './repositories';
import { AgentService, ProjectService, TaskService } from './services';
import { createAgentRouter, createProjectRouter, createTaskRouter } from './routes';
import { errorHandler } from './middleware';

export interface AppDependencies {
  agentService: AgentService;
  projectService: ProjectService;
  taskService: TaskService;
}

/**
 * Create the Express application with all routes and middleware.
 */
export function createApp(db: Client): { app: Express; deps: AppDependencies } {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Repositories
  const agentRepo = new AgentRepository(db);
  const projectRepo = new ProjectRepository(db);
  const taskRepo = new TaskRepository(db);
  const activityLogRepo = new ActivityLogRepository(db);

  // Services
  const agentService = new AgentService(agentRepo, activityLogRepo);
  const projectService = new ProjectService(projectRepo, activityLogRepo);
  const taskService = new TaskService(taskRepo, activityLogRepo);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use(`${API.PREFIX}/agents`, createAgentRouter(agentService));
  app.use(`${API.PREFIX}/projects`, createProjectRouter(projectService, agentService));
  app.use(`${API.PREFIX}/tasks`, createTaskRouter(taskService, agentService));

  // Error handler
  app.use(errorHandler);

  return { app, deps: { agentService, projectService, taskService } };
}
