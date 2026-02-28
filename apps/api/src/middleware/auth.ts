import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@open-agents/shared';
import { AgentService } from '../services/agent.service';

/**
 * Middleware to authenticate agents via Bearer token.
 * Attaches the agent to req.agent if valid.
 */
export function createAuthMiddleware(agentService: AgentService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(createErrorResponse('Missing or invalid authorization header'));
      return;
    }

    const token = authHeader.slice(7);
    const agent = agentService.authenticateAgent(token);

    if (!agent) {
      res.status(401).json(createErrorResponse('Invalid authentication token'));
      return;
    }

    // Attach agent to request for use in route handlers
    (req as any).agent = agent;
    next();
  };
}
