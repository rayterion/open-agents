import { Router, Request, Response, NextFunction } from 'express';
import { createApiResponse, createErrorResponse } from '@open-agents/shared';
import { TaskService } from '../services/task.service';
import { AgentService } from '../services/agent.service';
import { validate, validateQuery, createAuthMiddleware } from '../middleware';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  paginationSchema,
} from '../schemas';
import { getParam } from '../utils';

export function createTaskRouter(taskService: TaskService, agentService: AgentService): Router {
  const router = Router();
  const auth = createAuthMiddleware(agentService);

  // POST /tasks - Create a new task (authenticated)
  router.post('/', auth, validate(createTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = (req as any).agent;
      const task = await taskService.createTask(req.body, agent.id);
      res.status(201).json(createApiResponse(task));
    } catch (err) { next(err); }
  });

  // GET /tasks/project/:projectId - List tasks by project
  router.get('/project/:projectId', validateQuery(paginationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize } = req.query as any;
      const result = await taskService.listTasksByProject(getParam(req, 'projectId'), page, pageSize);
      res.json(createApiResponse(result));
    } catch (err) { next(err); }
  });

  // GET /tasks/agent/:agentId - List tasks by agent
  router.get('/agent/:agentId', validateQuery(paginationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize } = req.query as any;
      const result = await taskService.listTasksByAgent(getParam(req, 'agentId'), page, pageSize);
      res.json(createApiResponse(result));
    } catch (err) { next(err); }
  });

  // GET /tasks/:id - Get task by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getTask(getParam(req, 'id'));
      if (!task) { res.status(404).json(createErrorResponse('Task not found')); return; }
      res.json(createApiResponse(task));
    } catch (err) { next(err); }
  });

  // PATCH /tasks/:id/status - Update task status (authenticated)
  router.patch('/:id/status', auth, validate(updateTaskStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = (req as any).agent;
      const task = await taskService.updateTaskStatus(getParam(req, 'id'), req.body.status, agent.id);
      if (!task) { res.status(404).json(createErrorResponse('Task not found')); return; }
      res.json(createApiResponse(task));
    } catch (err) { next(err); }
  });

  // POST /tasks/:id/assign - Assign task to agent (authenticated)
  router.post('/:id/assign', auth, validate(assignTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestingAgent = (req as any).agent;
      const task = await taskService.assignTask(getParam(req, 'id'), req.body.agentId, requestingAgent.id);
      if (!task) { res.status(404).json(createErrorResponse('Task not found')); return; }
      res.json(createApiResponse(task));
    } catch (err) { next(err); }
  });

  // DELETE /tasks/:id - Delete task (authenticated)
  router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await taskService.deleteTask(getParam(req, 'id'));
      if (!deleted) { res.status(404).json(createErrorResponse('Task not found')); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  });

  return router;
}
