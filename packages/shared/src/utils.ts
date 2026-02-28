import { TokenBudget, Agent } from './types';
import { PaginatedResponse, ApiResponse } from './dto';
import { DEFAULT_TOKEN_LIMITS, PAGINATION } from './constants';
import { AgentStatus } from './enums';

/**
 * Create a default token budget for a new agent.
 */
export function createDefaultTokenBudget(
  overrides?: Partial<
    Pick<TokenBudget, 'maxTokensPerHour' | 'maxTokensPerDay' | 'maxTokensPerMonth'>
  >,
): TokenBudget {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

  const nextDay = new Date(now);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);

  return {
    maxTokensPerHour: overrides?.maxTokensPerHour ?? DEFAULT_TOKEN_LIMITS.maxTokensPerHour,
    maxTokensPerDay: overrides?.maxTokensPerDay ?? DEFAULT_TOKEN_LIMITS.maxTokensPerDay,
    maxTokensPerMonth: overrides?.maxTokensPerMonth ?? DEFAULT_TOKEN_LIMITS.maxTokensPerMonth,
    usedTokensCurrentHour: 0,
    usedTokensCurrentDay: 0,
    usedTokensCurrentMonth: 0,
    hourlyResetAt: nextHour.toISOString(),
    dailyResetAt: nextDay.toISOString(),
    monthlyResetAt: nextMonth.toISOString(),
  };
}

/**
 * Check if an agent has exceeded any of its token limits.
 */
export function isTokenLimitExceeded(budget: TokenBudget): boolean {
  return (
    budget.usedTokensCurrentHour >= budget.maxTokensPerHour ||
    budget.usedTokensCurrentDay >= budget.maxTokensPerDay ||
    budget.usedTokensCurrentMonth >= budget.maxTokensPerMonth
  );
}

/**
 * Get remaining tokens for each time window.
 */
export function getRemainingTokens(budget: TokenBudget): {
  hourly: number;
  daily: number;
  monthly: number;
} {
  return {
    hourly: Math.max(0, budget.maxTokensPerHour - budget.usedTokensCurrentHour),
    daily: Math.max(0, budget.maxTokensPerDay - budget.usedTokensCurrentDay),
    monthly: Math.max(0, budget.maxTokensPerMonth - budget.usedTokensCurrentMonth),
  };
}

/**
 * Determine if an agent should be moved to idle status.
 */
export function shouldAgentBeIdle(agent: Pick<Agent, 'status' | 'tokenBudget'>): boolean {
  if (agent.status === AgentStatus.SUSPENDED) {
    return false;
  }
  return isTokenLimitExceeded(agent.tokenBudget);
}

/**
 * Create a paginated response object.
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number = PAGINATION.DEFAULT_PAGE,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Create a standardized API response.
 */
export function createApiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error API response.
 */
export function createErrorResponse(error: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error,
    timestamp: new Date().toISOString(),
  };
}
