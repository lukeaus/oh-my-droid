/**
 * Tests for rate-limit-monitor.ts
 */

import { describe, it, expect } from 'vitest';
import {
  checkRateLimitStatus,
  formatTimeUntilReset,
  formatRateLimitStatus,
} from '../../features/rate-limit-wait/rate-limit-monitor.js';
import type { RateLimitStatus } from '../../features/rate-limit-wait/types.js';

describe('rate-limit-monitor', () => {
  describe('checkRateLimitStatus', () => {
    it('should resolve to null while the Factory quota API is unsupported', async () => {
      await expect(checkRateLimitStatus()).resolves.toBeNull();
    });
  });

  describe('formatTimeUntilReset', () => {
    it('should format hours and minutes', () => {
      const twoHours = 2 * 60 * 60 * 1000 + 30 * 60 * 1000; // 2h 30m
      expect(formatTimeUntilReset(twoHours)).toBe('2h 30m');
    });

    it('should format minutes and seconds', () => {
      const fiveMinutes = 5 * 60 * 1000 + 45 * 1000; // 5m 45s
      expect(formatTimeUntilReset(fiveMinutes)).toBe('5m 45s');
    });

    it('should format seconds only', () => {
      const thirtySeconds = 30 * 1000;
      expect(formatTimeUntilReset(thirtySeconds)).toBe('30s');
    });

    it('should return "now" for zero or negative', () => {
      expect(formatTimeUntilReset(0)).toBe('now');
      expect(formatTimeUntilReset(-1000)).toBe('now');
    });
  });

  describe('formatRateLimitStatus', () => {
    it('should format not limited status', () => {
      const status: RateLimitStatus = {
        fiveHourLimited: false,
        weeklyLimited: false,
        isLimited: false,
        fiveHourResetsAt: null,
        weeklyResetsAt: null,
        nextResetAt: null,
        timeUntilResetMs: null,
        lastCheckedAt: new Date(),
      };

      expect(formatRateLimitStatus(status)).toBe('Not rate limited');
    });

    it('should format 5-hour limit', () => {
      const status: RateLimitStatus = {
        fiveHourLimited: true,
        weeklyLimited: false,
        isLimited: true,
        fiveHourResetsAt: new Date(),
        weeklyResetsAt: null,
        nextResetAt: new Date(),
        timeUntilResetMs: 3600000, // 1 hour
        lastCheckedAt: new Date(),
      };

      const result = formatRateLimitStatus(status);
      expect(result).toContain('5-hour limit reached');
      expect(result).toContain('1h 0m');
    });

    it('should format weekly limit', () => {
      const status: RateLimitStatus = {
        fiveHourLimited: false,
        weeklyLimited: true,
        isLimited: true,
        fiveHourResetsAt: null,
        weeklyResetsAt: new Date(),
        nextResetAt: new Date(),
        timeUntilResetMs: 86400000, // 1 day
        lastCheckedAt: new Date(),
      };

      const result = formatRateLimitStatus(status);
      expect(result).toContain('Weekly limit reached');
      expect(result).toContain('24h 0m');
    });

    it('should format both limits', () => {
      const status: RateLimitStatus = {
        fiveHourLimited: true,
        weeklyLimited: true,
        isLimited: true,
        fiveHourResetsAt: new Date(),
        weeklyResetsAt: new Date(),
        nextResetAt: new Date(),
        timeUntilResetMs: 3600000,
        lastCheckedAt: new Date(),
      };

      const result = formatRateLimitStatus(status);
      expect(result).toContain('5-hour limit reached');
      expect(result).toContain('Weekly limit reached');
    });
  });
});
