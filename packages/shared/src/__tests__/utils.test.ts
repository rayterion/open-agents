import {
  createDefaultTokenBudget,
  isTokenLimitExceeded,
  getRemainingTokens,
  shouldAgentBeIdle,
  createPaginatedResponse,
  createApiResponse,
  createErrorResponse,
} from '../utils';
import { AgentStatus } from '../enums';
import { DEFAULT_TOKEN_LIMITS, PAGINATION } from '../constants';
import { TokenBudget } from '../types';

describe('Utils', () => {
  describe('createDefaultTokenBudget', () => {
    it('should create a token budget with default limits', () => {
      const budget = createDefaultTokenBudget();

      expect(budget.maxTokensPerHour).toBe(DEFAULT_TOKEN_LIMITS.maxTokensPerHour);
      expect(budget.maxTokensPerDay).toBe(DEFAULT_TOKEN_LIMITS.maxTokensPerDay);
      expect(budget.maxTokensPerMonth).toBe(DEFAULT_TOKEN_LIMITS.maxTokensPerMonth);
      expect(budget.usedTokensCurrentHour).toBe(0);
      expect(budget.usedTokensCurrentDay).toBe(0);
      expect(budget.usedTokensCurrentMonth).toBe(0);
    });

    it('should allow overriding limits', () => {
      const budget = createDefaultTokenBudget({
        maxTokensPerHour: 50_000,
        maxTokensPerDay: 500_000,
      });

      expect(budget.maxTokensPerHour).toBe(50_000);
      expect(budget.maxTokensPerDay).toBe(500_000);
      expect(budget.maxTokensPerMonth).toBe(DEFAULT_TOKEN_LIMITS.maxTokensPerMonth);
    });

    it('should set valid reset timestamps', () => {
      const before = new Date();
      const budget = createDefaultTokenBudget();
      const after = new Date();

      const hourlyReset = new Date(budget.hourlyResetAt);
      const dailyReset = new Date(budget.dailyResetAt);
      const monthlyReset = new Date(budget.monthlyResetAt);

      expect(hourlyReset.getTime()).toBeGreaterThan(before.getTime());
      expect(dailyReset.getTime()).toBeGreaterThan(before.getTime());
      expect(monthlyReset.getTime()).toBeGreaterThan(before.getTime());
    });

    it('should allow partial overrides', () => {
      const budget = createDefaultTokenBudget({ maxTokensPerMonth: 5_000_000 });

      expect(budget.maxTokensPerHour).toBe(DEFAULT_TOKEN_LIMITS.maxTokensPerHour);
      expect(budget.maxTokensPerDay).toBe(DEFAULT_TOKEN_LIMITS.maxTokensPerDay);
      expect(budget.maxTokensPerMonth).toBe(5_000_000);
    });
  });

  describe('isTokenLimitExceeded', () => {
    const baseBudget: TokenBudget = {
      maxTokensPerHour: 100,
      maxTokensPerDay: 1000,
      maxTokensPerMonth: 10000,
      usedTokensCurrentHour: 0,
      usedTokensCurrentDay: 0,
      usedTokensCurrentMonth: 0,
      hourlyResetAt: new Date().toISOString(),
      dailyResetAt: new Date().toISOString(),
      monthlyResetAt: new Date().toISOString(),
    };

    it('should return false when no limits exceeded', () => {
      expect(isTokenLimitExceeded(baseBudget)).toBe(false);
    });

    it('should return true when hourly limit exceeded', () => {
      const budget = { ...baseBudget, usedTokensCurrentHour: 100 };
      expect(isTokenLimitExceeded(budget)).toBe(true);
    });

    it('should return true when daily limit exceeded', () => {
      const budget = { ...baseBudget, usedTokensCurrentDay: 1000 };
      expect(isTokenLimitExceeded(budget)).toBe(true);
    });

    it('should return true when monthly limit exceeded', () => {
      const budget = { ...baseBudget, usedTokensCurrentMonth: 10000 };
      expect(isTokenLimitExceeded(budget)).toBe(true);
    });

    it('should return true when usage exceeds the limit', () => {
      const budget = { ...baseBudget, usedTokensCurrentHour: 150 };
      expect(isTokenLimitExceeded(budget)).toBe(true);
    });
  });

  describe('getRemainingTokens', () => {
    it('should calculate remaining tokens correctly', () => {
      const budget: TokenBudget = {
        maxTokensPerHour: 100,
        maxTokensPerDay: 1000,
        maxTokensPerMonth: 10000,
        usedTokensCurrentHour: 30,
        usedTokensCurrentDay: 200,
        usedTokensCurrentMonth: 5000,
        hourlyResetAt: new Date().toISOString(),
        dailyResetAt: new Date().toISOString(),
        monthlyResetAt: new Date().toISOString(),
      };

      const remaining = getRemainingTokens(budget);

      expect(remaining.hourly).toBe(70);
      expect(remaining.daily).toBe(800);
      expect(remaining.monthly).toBe(5000);
    });

    it('should return 0 when usage exceeds limit', () => {
      const budget: TokenBudget = {
        maxTokensPerHour: 100,
        maxTokensPerDay: 1000,
        maxTokensPerMonth: 10000,
        usedTokensCurrentHour: 150,
        usedTokensCurrentDay: 1200,
        usedTokensCurrentMonth: 12000,
        hourlyResetAt: new Date().toISOString(),
        dailyResetAt: new Date().toISOString(),
        monthlyResetAt: new Date().toISOString(),
      };

      const remaining = getRemainingTokens(budget);

      expect(remaining.hourly).toBe(0);
      expect(remaining.daily).toBe(0);
      expect(remaining.monthly).toBe(0);
    });

    it('should return full budget when no tokens used', () => {
      const budget: TokenBudget = {
        maxTokensPerHour: 100,
        maxTokensPerDay: 1000,
        maxTokensPerMonth: 10000,
        usedTokensCurrentHour: 0,
        usedTokensCurrentDay: 0,
        usedTokensCurrentMonth: 0,
        hourlyResetAt: new Date().toISOString(),
        dailyResetAt: new Date().toISOString(),
        monthlyResetAt: new Date().toISOString(),
      };

      const remaining = getRemainingTokens(budget);

      expect(remaining.hourly).toBe(100);
      expect(remaining.daily).toBe(1000);
      expect(remaining.monthly).toBe(10000);
    });
  });

  describe('shouldAgentBeIdle', () => {
    const baseBudget: TokenBudget = {
      maxTokensPerHour: 100,
      maxTokensPerDay: 1000,
      maxTokensPerMonth: 10000,
      usedTokensCurrentHour: 0,
      usedTokensCurrentDay: 0,
      usedTokensCurrentMonth: 0,
      hourlyResetAt: new Date().toISOString(),
      dailyResetAt: new Date().toISOString(),
      monthlyResetAt: new Date().toISOString(),
    };

    it('should return false for active agent with budget', () => {
      const agent = { status: AgentStatus.ACTIVE, tokenBudget: baseBudget };
      expect(shouldAgentBeIdle(agent)).toBe(false);
    });

    it('should return true when agent exceeds token limits', () => {
      const agent = {
        status: AgentStatus.ACTIVE,
        tokenBudget: { ...baseBudget, usedTokensCurrentHour: 100 },
      };
      expect(shouldAgentBeIdle(agent)).toBe(true);
    });

    it('should return false for suspended agent even with exceeded limits', () => {
      const agent = {
        status: AgentStatus.SUSPENDED,
        tokenBudget: { ...baseBudget, usedTokensCurrentHour: 100 },
      };
      expect(shouldAgentBeIdle(agent)).toBe(false);
    });

    it('should return true for idle agent exceeding limits', () => {
      const agent = {
        status: AgentStatus.IDLE,
        tokenBudget: { ...baseBudget, usedTokensCurrentDay: 1000 },
      };
      expect(shouldAgentBeIdle(agent)).toBe(true);
    });

    it('should return true for pending agent exceeding limits', () => {
      const agent = {
        status: AgentStatus.PENDING,
        tokenBudget: { ...baseBudget, usedTokensCurrentMonth: 10000 },
      };
      expect(shouldAgentBeIdle(agent)).toBe(true);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create a paginated response with defaults', () => {
      const data = [1, 2, 3];
      const result = createPaginatedResponse(data, 50);

      expect(result.data).toEqual([1, 2, 3]);
      expect(result.total).toBe(50);
      expect(result.page).toBe(PAGINATION.DEFAULT_PAGE);
      expect(result.pageSize).toBe(PAGINATION.DEFAULT_PAGE_SIZE);
      expect(result.totalPages).toBe(3);
    });

    it('should create a paginated response with custom page and size', () => {
      const data = ['a', 'b'];
      const result = createPaginatedResponse(data, 100, 5, 10);

      expect(result.data).toEqual(['a', 'b']);
      expect(result.total).toBe(100);
      expect(result.page).toBe(5);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(10);
    });

    it('should handle empty data', () => {
      const result = createPaginatedResponse([], 0);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly for partial pages', () => {
      const result = createPaginatedResponse([1], 21, 1, 10);

      expect(result.totalPages).toBe(3);
    });
  });

  describe('createApiResponse', () => {
    it('should create a successful API response', () => {
      const result = createApiResponse({ id: '1', name: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '1', name: 'test' });
      expect(result.error).toBeNull();
      expect(result.timestamp).toBeDefined();
    });

    it('should include a valid ISO timestamp', () => {
      const before = new Date().toISOString();
      const result = createApiResponse('data');
      const after = new Date().toISOString();

      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it('should handle null data', () => {
      const result = createApiResponse(null);
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error API response', () => {
      const result = createErrorResponse('Something went wrong');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Something went wrong');
      expect(result.timestamp).toBeDefined();
    });

    it('should include a valid ISO timestamp', () => {
      const before = new Date().toISOString();
      const result = createErrorResponse('error');
      const after = new Date().toISOString();

      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });
  });
});
