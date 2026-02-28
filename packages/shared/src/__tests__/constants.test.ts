import { DEFAULT_TOKEN_LIMITS, REPUTATION, PAGINATION, API } from '../constants';

describe('Constants', () => {
  describe('DEFAULT_TOKEN_LIMITS', () => {
    it('should have positive hourly limit', () => {
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerHour).toBeGreaterThan(0);
    });

    it('should have positive daily limit', () => {
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerDay).toBeGreaterThan(0);
    });

    it('should have positive monthly limit', () => {
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerMonth).toBeGreaterThan(0);
    });

    it('should have daily limit greater than hourly', () => {
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerDay).toBeGreaterThan(
        DEFAULT_TOKEN_LIMITS.maxTokensPerHour,
      );
    });

    it('should have monthly limit greater than daily', () => {
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerMonth).toBeGreaterThan(
        DEFAULT_TOKEN_LIMITS.maxTokensPerDay,
      );
    });

    it('should have expected values', () => {
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerHour).toBe(100_000);
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerDay).toBe(1_000_000);
      expect(DEFAULT_TOKEN_LIMITS.maxTokensPerMonth).toBe(20_000_000);
    });
  });

  describe('REPUTATION', () => {
    it('should start with 0 initial reputation', () => {
      expect(REPUTATION.INITIAL).toBe(0);
    });

    it('should have positive threshold for high priority tasks', () => {
      expect(REPUTATION.HIGH_PRIORITY_THRESHOLD).toBeGreaterThan(0);
    });

    it('should have critical threshold higher than high priority', () => {
      expect(REPUTATION.CRITICAL_THRESHOLD).toBeGreaterThan(REPUTATION.HIGH_PRIORITY_THRESHOLD);
    });

    it('should reward PR merges with positive points', () => {
      expect(REPUTATION.PR_MERGED).toBeGreaterThan(0);
    });

    it('should reward reviews with positive points', () => {
      expect(REPUTATION.REVIEW_COMPLETED).toBeGreaterThan(0);
    });

    it('should penalize rejected PRs with negative points', () => {
      expect(REPUTATION.PR_REJECTED).toBeLessThan(0);
    });

    it('should reward project proposals', () => {
      expect(REPUTATION.PROJECT_PROPOSED).toBeGreaterThan(0);
    });
  });

  describe('PAGINATION', () => {
    it('should have default page of 1', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    });

    it('should have a reasonable default page size', () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(PAGINATION.MAX_PAGE_SIZE);
    });

    it('should have max page size greater than default', () => {
      expect(PAGINATION.MAX_PAGE_SIZE).toBeGreaterThan(PAGINATION.DEFAULT_PAGE_SIZE);
    });
  });

  describe('API', () => {
    it('should have version string', () => {
      expect(API.VERSION).toBe('v1');
    });

    it('should have prefix starting with /api/', () => {
      expect(API.PREFIX).toMatch(/^\/api\//);
    });

    it('should have prefix containing version', () => {
      expect(API.PREFIX).toContain(API.VERSION);
    });
  });
});
