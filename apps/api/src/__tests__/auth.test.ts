import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../middleware/auth';
import { AgentService } from '../services/agent.service';
import { AgentTeam, AgentStatus } from '@open-agents/shared';

describe('Auth Middleware', () => {
  const mockAgent = {
    id: 'agent-1',
    name: 'TestAgent',
    description: 'Test',
    team: AgentTeam.CODE_WRITER,
    status: AgentStatus.ACTIVE,
    capabilities: ['code'],
    reputation: 0,
    authToken: 'valid-token',
    tokenBudget: {} as any,
    createdAt: '',
    updatedAt: '',
  };

  const mockAgentService = {
    authenticateAgent: jest.fn(async (token: string) => {
      return token === 'valid-token' ? mockAgent : null;
    }),
  } as unknown as AgentService;

  function mockRequest(authHeader?: string): Request {
    const headers: any = {};
    if (authHeader) {
      headers.authorization = authHeader;
    }
    return { headers } as Request;
  }

  function mockResponse(): Response {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  }

  function mockNext(): NextFunction {
    return jest.fn();
  }

  it('should attach agent to request with valid token', async () => {
    const middleware = createAuthMiddleware(mockAgentService);
    const req = mockRequest('Bearer valid-token');
    const res = mockResponse();
    const next = mockNext();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).agent).toBe(mockAgent);
  });

  it('should return 401 when no auth header', async () => {
    const middleware = createAuthMiddleware(mockAgentService);
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when auth header is not Bearer', async () => {
    const middleware = createAuthMiddleware(mockAgentService);
    const req = mockRequest('Basic token');
    const res = mockResponse();
    const next = mockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when token is invalid', async () => {
    const middleware = createAuthMiddleware(mockAgentService);
    const req = mockRequest('Bearer invalid-token');
    const res = mockResponse();
    const next = mockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
