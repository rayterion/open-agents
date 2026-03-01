import { Router, Request, Response, NextFunction } from 'express';
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
  router.post('/', validate(createAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await agentService.registerAgent(req.body);
      res.status(201).json(createApiResponse(agent));
    } catch (error) {
      const message = String(error);
      if (message.includes('UNIQUE constraint failed')) {
        res.status(409).json(createErrorResponse('An agent with that name already exists'));
      } else {
        next(error);
      }
    }
  });

  // GET /agents - List all agents
  router.get('/', validateQuery(paginationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize } = req.query as any;
      const result = await agentService.listAgents(page, pageSize);
      res.json(createApiResponse(result));
    } catch (err) { next(err); }
  });

  // GET /agents/team/:team - List agents by team
  router.get('/team/:team', validateQuery(paginationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = getParam(req, 'team');
      const { page, pageSize } = req.query as any;
      const result = await agentService.listAgentsByTeam(team as any, page, pageSize);
      res.json(createApiResponse(result));
    } catch (err) { next(err); }
  });

  // GET /agents/:id - Get agent by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await agentService.getAgent(getParam(req, 'id'));
      if (!agent) { res.status(404).json(createErrorResponse('Agent not found')); return; }
      res.json(createApiResponse(agent));
    } catch (err) { next(err); }
  });

  // PUT /agents/:id - Update agent (authenticated)
  router.put('/:id', auth, validate(updateAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await agentService.updateAgent(getParam(req, 'id'), req.body);
      if (!agent) { res.status(404).json(createErrorResponse('Agent not found')); return; }
      res.json(createApiResponse(agent));
    } catch (err) { next(err); }
  });

  // POST /agents/:id/activate - Activate agent (authenticated)
  router.post('/:id/activate', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await agentService.activateAgent(getParam(req, 'id'));
      if (!agent) { res.status(404).json(createErrorResponse('Agent not found')); return; }
      res.json(createApiResponse(agent));
    } catch (err) { next(err); }
  });

  // POST /agents/:id/suspend - Suspend agent (authenticated)
  router.post('/:id/suspend', auth, validate(suspendAgentSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await agentService.suspendAgent(getParam(req, 'id'), req.body.reason);
      if (!agent) { res.status(404).json(createErrorResponse('Agent not found')); return; }
      res.json(createApiResponse(agent));
    } catch (err) { next(err); }
  });

  // POST /agents/:id/tokens - Record token usage (authenticated)
  router.post('/:id/tokens', auth, validate(recordTokensSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await agentService.recordTokenUsage(getParam(req, 'id'), req.body.tokensUsed);
      if (!agent) { res.status(404).json(createErrorResponse('Agent not found')); return; }
      res.json(createApiResponse(agent));
    } catch (err) { next(err); }
  });

  // DELETE /agents/:id - Delete agent (authenticated)
  router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await agentService.deleteAgent(getParam(req, 'id'));
      if (!deleted) { res.status(404).json(createErrorResponse('Agent not found')); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  });

  return router;
}
