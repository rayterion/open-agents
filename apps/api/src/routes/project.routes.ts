import { Router, Request, Response, NextFunction } from 'express';
import { createApiResponse, createErrorResponse } from '@open-agents/shared';
import { ProjectService } from '../services/project.service';
import { AgentService } from '../services/agent.service';
import { validate, validateQuery, createAuthMiddleware } from '../middleware';
import {
  createProjectSchema,
  updateProjectStatusSchema,
  assignProjectAgentSchema,
  paginationSchema,
} from '../schemas';
import { getParam } from '../utils';

export function createProjectRouter(
  projectService: ProjectService,
  agentService: AgentService,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(agentService);

  // POST /projects - Create a new project (authenticated)
  router.post('/', auth, validate(createProjectSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = (req as any).agent;
      const project = await projectService.createProject(req.body, agent.id);
      res.status(201).json(createApiResponse(project));
    } catch (error) {
      const message = String(error);
      if (message.includes('UNIQUE constraint failed')) {
        res.status(409).json(createErrorResponse('A project with that name already exists'));
      } else {
        next(error);
      }
    }
  });

  // GET /projects - List all projects
  router.get('/', validateQuery(paginationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize } = req.query as any;
      const result = await projectService.listProjects(page, pageSize);
      res.json(createApiResponse(result));
    } catch (err) { next(err); }
  });

  // GET /projects/:id - Get project by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectService.getProject(getParam(req, 'id'));
      if (!project) { res.status(404).json(createErrorResponse('Project not found')); return; }
      res.json(createApiResponse(project));
    } catch (err) { next(err); }
  });

  // PATCH /projects/:id/status - Update project status (authenticated)
  router.patch('/:id/status', auth, validate(updateProjectStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = (req as any).agent;
      const project = await projectService.updateProjectStatus(getParam(req, 'id'), req.body.status, agent.id);
      if (!project) { res.status(404).json(createErrorResponse('Project not found')); return; }
      res.json(createApiResponse(project));
    } catch (err) { next(err); }
  });

  // POST /projects/:id/agents - Assign agent to project (authenticated)
  router.post('/:id/agents', auth, validate(assignProjectAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestingAgent = (req as any).agent;
      const project = await projectService.assignAgent(getParam(req, 'id'), req.body.agentId, requestingAgent.id);
      if (!project) { res.status(404).json(createErrorResponse('Project not found')); return; }
      res.json(createApiResponse(project));
    } catch (err) { next(err); }
  });

  // DELETE /projects/:id/agents/:agentId - Remove agent from project (authenticated)
  router.delete('/:id/agents/:agentId', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestingAgent = (req as any).agent;
      const project = await projectService.removeAgent(getParam(req, 'id'), getParam(req, 'agentId'), requestingAgent.id);
      if (!project) { res.status(404).json(createErrorResponse('Project not found')); return; }
      res.json(createApiResponse(project));
    } catch (err) { next(err); }
  });

  // DELETE /projects/:id - Delete project (authenticated)
  router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await projectService.deleteProject(getParam(req, 'id'));
      if (!deleted) { res.status(404).json(createErrorResponse('Project not found')); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  });

  return router;
}
