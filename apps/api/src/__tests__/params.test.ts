import { Request } from 'express';
import { getParam } from '../utils/params';

describe('getParam', () => {
  it('should return string param directly', () => {
    const req = { params: { id: 'abc-123' } } as unknown as Request;
    expect(getParam(req, 'id')).toBe('abc-123');
  });

  it('should return first element when param is array', () => {
    const req = { params: { id: ['first', 'second'] } } as unknown as Request;
    expect(getParam(req, 'id')).toBe('first');
  });
});
