import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../middleware/error-handler';

describe('Error Handler', () => {
  function mockResponse(): Response {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  }

  it('should return 500 with error response', () => {
    const err = new Error('Something broke');
    const req = {} as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    // Suppress console.error in test
    const spy = jest.spyOn(console, 'error').mockImplementation();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Internal server error',
      }),
    );

    spy.mockRestore();
  });
});
