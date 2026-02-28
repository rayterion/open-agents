import { Router, Request, Response } from 'express';
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
  router.post('/', auth, validate(createProjectSchema), (req: Request, res: Response) => {
    try {
      const agent = (req as any).agent;
      const project = projectService.createProject(req.body, agent.id);
      res.status(201).json(createApiResponse(project));
    } catch (error) {
      const message = String(error);
      if (message.includes('UNIQUE constraint failed')) {
        res.status(409).json(createErrorResponse('A project with that name already exists'));
      } else {
        res.status(500).json(createErrorResponse('Failed to create project'));
      }
    }
  });

  // GET /projects - List all projects
  router.get('/', validateQuery(paginationSchema), (req: Request, res: Response) => {
    const { page, pageSize } = req.query as any;
    const result = projectService.listProjects(page, pageSize);
    res.json(createApiResponse(result));
  });

  // GET /projects/:id - Get project by ID
  router.get('/:id', (req: Request, res: Response) => {
    const project = projectService.getProject(getParam(req, 'id'));
    if (!project) {
      res.status(404).json(createErrorResponse('Project not found'));
      return;
    }
    res.json(createApiResponse(project));
  });

  // PATCH /projects/:id/status - Update project status (authenticated)
  router.patch(
    '/:id/status',
    auth,
    validate(updateProjectStatusSchema),
    (req: Request, res: Response) => {
      const agent = (req as any).agent;
      const project = projectService.updateProjectStatus(
        getParam(req, 'id'),
        req.body.status,
        agent.id,
      );
      if (!project) {
        res.status(404).json(createErrorResponse('Project not found'));
        return;
      }
      res.json(createApiResponse(project));
    },
  );

  // POST /projects/:id/agents - Assign agent to project (authenticated)
  router.post(
    '/:id/agents',
    auth,
    validate(assignProjectAgentSchema),
    (req: Request, res: Response) => {
      const requestingAgent = (req as any).agent;
      const project = projectService.assignAgent(
        getParam(req, 'id'),
        req.body.agentId,
        requestingAgent.id,
      );
      if (!project) {
        res.status(404).json(createErrorResponse('Project not found'));
        return;
      }
      res.json(createApiResponse(project));
    },
  );

  // DELETE /projects/:id/agents/:agentId - Remove agent from project (authenticated)
  router.delete('/:id/agents/:agentId', auth, (req: Request, res: Response) => {
    const requestingAgent = (req as any).agent;
    const project = projectService.removeAgent(
      getParam(req, 'id'),
      getParam(req, 'agentId'),
      requestingAgent.id,
    );
    if (!project) {
      res.status(404).json(createErrorResponse('Project not found'));
      return;
    }
    res.json(createApiResponse(project));
  });

  // DELETE /projects/:id - Delete project (authenticated)
  router.delete('/:id', auth, (req: Request, res: Response) => {
    const deleted = projectService.deleteProject(getParam(req, 'id'));
    if (!deleted) {
      res.status(404).json(createErrorResponse('Project not found'));
      return;
    }
    res.status(204).send();
  });

  return router;
}
