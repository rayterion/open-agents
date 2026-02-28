import { Router, Request, Response } from 'express';
import { createApiResponse, createErrorResponse } from '@open-agents/shared';
import { AgentService } from '../services/agent.service';
import { validate, validateQuery, createAuthMiddleware } from '../middleware';
import {
  createAgentSchema,
  updateAgentSchema,
  paginationSchema,
  recordTokensSchema,
  suspendAgentSchema,
} from '../schemas';
import { getParam } from '../utils';

export function createAgentRouter(agentService: AgentService): Router {
  const router = Router();
  const auth = createAuthMiddleware(agentService);

  // POST /agents - Register a new agent (public)
  router.post('/', validate(createAgentSchema), (req: Request, res: Response) => {
    try {
      const agent = agentService.registerAgent(req.body);
      res.status(201).json(createApiResponse(agent));
    } catch (error) {
      const message = String(error);
      if (message.includes('UNIQUE constraint failed')) {
        res.status(409).json(createErrorResponse('An agent with that name already exists'));
      } else {
        res.status(500).json(createErrorResponse('Failed to create agent'));
      }
    }
  });

  // GET /agents - List all agents
  router.get('/', validateQuery(paginationSchema), (req: Request, res: Response) => {
    const { page, pageSize } = req.query as any;
    const result = agentService.listAgents(page, pageSize);
    res.json(createApiResponse(result));
  });

  // GET /agents/team/:team - List agents by team
  router.get('/team/:team', validateQuery(paginationSchema), (req: Request, res: Response) => {
    const team = getParam(req, 'team');
    const { page, pageSize } = req.query as any;
    const result = agentService.listAgentsByTeam(team as any, page, pageSize);
    res.json(createApiResponse(result));
  });

  // GET /agents/:id - Get agent by ID
  router.get('/:id', (req: Request, res: Response) => {
    const agent = agentService.getAgent(getParam(req, 'id'));
    if (!agent) {
      res.status(404).json(createErrorResponse('Agent not found'));
      return;
    }
    res.json(createApiResponse(agent));
  });

  // PUT /agents/:id - Update agent (authenticated)
  router.put('/:id', auth, validate(updateAgentSchema), (req: Request, res: Response) => {
    const agent = agentService.updateAgent(getParam(req, 'id'), req.body);
    if (!agent) {
      res.status(404).json(createErrorResponse('Agent not found'));
      return;
    }
    res.json(createApiResponse(agent));
  });

  // POST /agents/:id/activate - Activate agent (authenticated)
  router.post('/:id/activate', auth, (req: Request, res: Response) => {
    const agent = agentService.activateAgent(getParam(req, 'id'));
    if (!agent) {
      res.status(404).json(createErrorResponse('Agent not found'));
      return;
    }
    res.json(createApiResponse(agent));
  });

  // POST /agents/:id/suspend - Suspend agent (authenticated)
  router.post('/:id/suspend', auth, validate(suspendAgentSchema), (req: Request, res: Response) => {
    const agent = agentService.suspendAgent(getParam(req, 'id'), req.body.reason);
    if (!agent) {
      res.status(404).json(createErrorResponse('Agent not found'));
      return;
    }
    res.json(createApiResponse(agent));
  });

  // POST /agents/:id/tokens - Record token usage (authenticated)
  router.post('/:id/tokens', auth, validate(recordTokensSchema), (req: Request, res: Response) => {
    const agent = agentService.recordTokenUsage(getParam(req, 'id'), req.body.tokensUsed);
    if (!agent) {
      res.status(404).json(createErrorResponse('Agent not found'));
      return;
    }
    res.json(createApiResponse(agent));
  });

  // DELETE /agents/:id - Delete agent (authenticated)
  router.delete('/:id', auth, (req: Request, res: Response) => {
    const deleted = agentService.deleteAgent(getParam(req, 'id'));
    if (!deleted) {
      res.status(404).json(createErrorResponse('Agent not found'));
      return;
    }
    res.status(204).send();
  });

  return router;
}
