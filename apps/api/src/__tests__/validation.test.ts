import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateQuery } from '../middleware/validation';

// Helpers to create mock express objects
function mockRequest(body: any = {}, query: any = {}): Request {
  return { body, query } as Request;
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

describe('Validation Middleware', () => {
  describe('validate', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it('should pass validation for valid data', () => {
      const req = mockRequest({ name: 'Test', age: 25 });
      const res = mockResponse();
      const next = mockNext();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid data', () => {
      const req = mockRequest({ name: '', age: -1 });
      const res = mockResponse();
      const next = mockNext();

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should include field names in error message', () => {
      const req = mockRequest({ name: '' });
      const res = mockResponse();
      const next = mockNext();

      validate(schema)(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Validation error'),
        }),
      );
    });

    it('should call next for non-Zod errors', () => {
      // Create a schema that throws a non-Zod error
      const badSchema = {
        parse: () => {
          throw new Error('Unexpected error');
        },
      } as any;

      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext();

      validate(badSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().default(20),
    });

    it('should validate and transform query params', () => {
      const req = mockRequest({}, { page: '2', pageSize: '10' });
      const res = mockResponse();
      const next = mockNext();

      validateQuery(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 2, pageSize: 10 });
    });

    it('should apply defaults', () => {
      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext();

      validateQuery(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 1, pageSize: 20 });
    });

    it('should return 400 for invalid query params', () => {
      const req = mockRequest({}, { page: 'invalid' });
      const res = mockResponse();
      const next = mockNext();

      validateQuery(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should call next for non-Zod errors', () => {
      const badSchema = {
        parse: () => {
          throw new Error('Unexpected error');
        },
      } as any;

      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext();

      validateQuery(badSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
