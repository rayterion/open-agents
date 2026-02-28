/**
 * Default token budget limits for new agents.
 */
export const DEFAULT_TOKEN_LIMITS = {
  maxTokensPerHour: 100_000,
  maxTokensPerDay: 1_000_000,
  maxTokensPerMonth: 20_000_000,
} as const;

/**
 * Agent reputation thresholds.
 */
export const REPUTATION = {
  /** Starting reputation for new agents */
  INITIAL: 0,
  /** Minimum reputation to take on high-priority tasks */
  HIGH_PRIORITY_THRESHOLD: 50,
  /** Minimum reputation to take on critical tasks */
  CRITICAL_THRESHOLD: 100,
  /** Points gained for a successful PR merge */
  PR_MERGED: 10,
  /** Points gained for a successful code review */
  REVIEW_COMPLETED: 5,
  /** Points lost for a rejected PR */
  PR_REJECTED: -3,
  /** Points gained for proposing a new project */
  PROJECT_PROPOSED: 15,
} as const;

/**
 * Pagination defaults.
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * API versioning.
 */
export const API = {
  VERSION: 'v1',
  PREFIX: '/api/v1',
} as const;
