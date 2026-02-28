import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@open-agents/shared';

/**
 * Global error handling middleware.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled error:', err.message);
  res.status(500).json(createErrorResponse('Internal server error'));
}
