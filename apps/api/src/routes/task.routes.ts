import { Router, Request, Response } from 'express';
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
  router.post('/', auth, validate(createTaskSchema), (req: Request, res: Response) => {
    try {
      const agent = (req as any).agent;
      const task = taskService.createTask(req.body, agent.id);
      res.status(201).json(createApiResponse(task));
    } catch (error) {
      res.status(500).json(createErrorResponse('Failed to create task'));
    }
  });

  // GET /tasks/project/:projectId - List tasks by project
  router.get(
    '/project/:projectId',
    validateQuery(paginationSchema),
    (req: Request, res: Response) => {
      const { page, pageSize } = req.query as any;
      const result = taskService.listTasksByProject(getParam(req, 'projectId'), page, pageSize);
      res.json(createApiResponse(result));
    },
  );

  // GET /tasks/agent/:agentId - List tasks by agent
  router.get('/agent/:agentId', validateQuery(paginationSchema), (req: Request, res: Response) => {
    const { page, pageSize } = req.query as any;
    const result = taskService.listTasksByAgent(getParam(req, 'agentId'), page, pageSize);
    res.json(createApiResponse(result));
  });

  // GET /tasks/:id - Get task by ID
  router.get('/:id', (req: Request, res: Response) => {
    const task = taskService.getTask(getParam(req, 'id'));
    if (!task) {
      res.status(404).json(createErrorResponse('Task not found'));
      return;
    }
    res.json(createApiResponse(task));
  });

  // PATCH /tasks/:id/status - Update task status (authenticated)
  router.patch(
    '/:id/status',
    auth,
    validate(updateTaskStatusSchema),
    (req: Request, res: Response) => {
      const agent = (req as any).agent;
      const task = taskService.updateTaskStatus(getParam(req, 'id'), req.body.status, agent.id);
      if (!task) {
        res.status(404).json(createErrorResponse('Task not found'));
        return;
      }
      res.json(createApiResponse(task));
    },
  );

  // POST /tasks/:id/assign - Assign task to agent (authenticated)
  router.post('/:id/assign', auth, validate(assignTaskSchema), (req: Request, res: Response) => {
    const requestingAgent = (req as any).agent;
    const task = taskService.assignTask(getParam(req, 'id'), req.body.agentId, requestingAgent.id);
    if (!task) {
      res.status(404).json(createErrorResponse('Task not found'));
      return;
    }
    res.json(createApiResponse(task));
  });

  // DELETE /tasks/:id - Delete task (authenticated)
  router.delete('/:id', auth, (req: Request, res: Response) => {
    const deleted = taskService.deleteTask(getParam(req, 'id'));
    if (!deleted) {
      res.status(404).json(createErrorResponse('Task not found'));
      return;
    }
    res.status(204).send();
  });

  return router;
}
