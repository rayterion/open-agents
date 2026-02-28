import { Request } from 'express';

/**
 * Safely extract a route parameter as a string.
 * Express 5 types params as string | string[]; this ensures we get a string.
 */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
