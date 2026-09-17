/**
 * Integration Tests for Rate Limit Wait Feature
 *
 * These tests simulate real-world scenarios without hitting actual rate limits.
 * They verify pane detection and daemon-state formatting without a quota API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { DaemonState } from '../../features/rate-limit-wait/types.js';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawnSync: vi.fn(),
  spawn: vi.fn(),
}));

import { execSync, spawnSync } from 'child_process';
import {
  checkRateLimitStatus,
  analyzePaneContent,
  scanForBlockedPanes,
  formatDaemonState,
} from '../../features/rate-limit-wait/index.js';

describe('Rate Limit Wait Integration Tests', () => {
  const testDir = join(tmpdir(), 'omd-integration-test-' + Date.now());

  beforeEach(() => {
    vi.clearAllMocks();
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('reports unavailable quota status through the public API', async () => {
    await expect(checkRateLimitStatus()).resolves.toBeNull();
  });

  describe('Scenario: tmux pane analysis accuracy', () => {
    it('should correctly identify Factory Droid rate limit message', () => {
      const realWorldContent = `
╭─────────────────────────────────────────────────────────────────╮
│  Factory Droid                                                     │
╰─────────────────────────────────────────────────────────────────╯

You've reached your usage limit for the 5-hour period.
Your limit will reset at 3:45 PM.

What would you like to do?

  [1] Wait and continue automatically when limit resets
  [2] Switch to a different conversation
  [3] Exit

> `;

      const result = analyzePaneContent(realWorldContent);

      expect(result.hasDroid).toBe(true);
      expect(result.hasRateLimitMessage).toBe(true);
      expect(result.isBlocked).toBe(true);
      expect(result.rateLimitType).toBe('five_hour');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should correctly identify weekly rate limit message', () => {
      const weeklyLimitContent = `
Factory Droid v1.0.0

⚠️  Weekly usage limit reached

You've used your weekly allocation of tokens.
Limit resets on Monday at 12:00 AM UTC.

Options:
  [1] Continue when limit resets
  [2] Exit

Enter choice: `;

      const result = analyzePaneContent(weeklyLimitContent);

      expect(result.hasDroid).toBe(true);
      expect(result.hasRateLimitMessage).toBe(true);
      expect(result.isBlocked).toBe(true);
      expect(result.rateLimitType).toBe('weekly');
    });

    it('should NOT flag normal Factory Droid output as blocked', () => {
      const normalContent = `
Factory Droid

> What would you like to build today?

I can help you with:
- Writing code
- Debugging
- Refactoring
- Documentation

Just describe what you need!
`;

      const result = analyzePaneContent(normalContent);

      expect(result.hasDroid).toBe(true);
      expect(result.hasRateLimitMessage).toBe(false);
      expect(result.isBlocked).toBe(false);
    });

    it('should NOT flag unrelated rate limit messages', () => {
      const unrelatedContent = `
$ curl https://api.github.com/users/test
{
  "message": "API rate limit exceeded for IP",
  "documentation_url": "https://docs.github.com"
}
$ `;

      const result = analyzePaneContent(unrelatedContent);

      expect(result.hasDroid).toBe(false);
      expect(result.hasRateLimitMessage).toBe(true);
      expect(result.isBlocked).toBe(false); // No Droid context
    });

    it('should handle edge case: old rate limit message scrolled up', () => {
      // Only last 15 lines should be analyzed
      // Rate limit message from earlier should be ignored if not in recent content
      const scrolledContent = `
User: fix the bug
Assistant: I'll fix that for you.
[Edit] src/main.ts
Done! The bug is fixed.

User: thanks
Assistant: You're welcome!

User: what else?
Assistant: I can help with more tasks.

> `;

      const result = analyzePaneContent(scrolledContent);

      expect(result.isBlocked).toBe(false);
    });
  });

  describe('Scenario: Full daemon state lifecycle', () => {
    it('should format daemon state correctly for user display', () => {
      const state: DaemonState = {
        isRunning: true,
        pid: 12345,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        lastPollAt: new Date('2024-01-01T10:05:00Z'),
        rateLimitStatus: {
          fiveHourLimited: true,
          weeklyLimited: false,
          isLimited: true,
          fiveHourResetsAt: new Date('2024-01-01T15:00:00Z'),
          weeklyResetsAt: null,
          nextResetAt: new Date('2024-01-01T15:00:00Z'),
          timeUntilResetMs: 3600000,
          lastCheckedAt: new Date('2024-01-01T10:05:00Z'),
        },
        blockedPanes: [
          {
            id: '%0',
            session: 'dev',
            windowIndex: 0,
            windowName: 'droid',
            paneIndex: 0,
            isActive: true,
            analysis: {
              hasDroid: true,
              hasRateLimitMessage: true,
              isBlocked: true,
              rateLimitType: 'five_hour',
              confidence: 0.95,
            },
            firstDetectedAt: new Date('2024-01-01T10:01:00Z'),
            resumeAttempted: false,
          },
        ],
        resumedPaneIds: [],
        totalResumeAttempts: 0,
        successfulResumes: 0,
        errorCount: 0,
      };

      const output = formatDaemonState(state);

      // Verify key information is present
      expect(output).toContain('Daemon running');
      expect(output).toContain('12345');
      expect(output).toContain('5-hour limit');
      expect(output).toContain('Found 1 blocked');
      expect(output).toContain('%0');
    });

    it('should track resume attempts correctly', () => {
      const stateAfterResume: DaemonState = {
        isRunning: true,
        pid: 12345,
        startedAt: new Date(),
        lastPollAt: new Date(),
        rateLimitStatus: {
          fiveHourLimited: false,
          weeklyLimited: false,
          isLimited: false,
          fiveHourResetsAt: null,
          weeklyResetsAt: null,
          nextResetAt: null,
          timeUntilResetMs: null,
          lastCheckedAt: new Date(),
        },
        blockedPanes: [],
        resumedPaneIds: ['%0', '%1'],
        totalResumeAttempts: 2,
        successfulResumes: 2,
        errorCount: 0,
      };

      const output = formatDaemonState(stateAfterResume);

      expect(output).toContain('Resume attempts: 2');
      expect(output).toContain('Successful: 2');
      expect(output).toContain('Not rate limited');
    });
  });

  describe('Scenario: Error handling and edge cases', () => {
    it('should handle tmux not installed', () => {
      vi.mocked(spawnSync).mockReturnValue({
        status: 1,
        stdout: '',
        stderr: 'tmux: command not found',
        signal: null,
        pid: 0,
        output: [],
      });

      // scanForBlockedPanes should return empty array, not throw
      const blocked = scanForBlockedPanes();
      expect(blocked).toEqual([]);
    });

    it('should handle malformed tmux output', () => {
      vi.mocked(spawnSync).mockReturnValue({
        status: 0,
        stdout: '/usr/bin/tmux',
        stderr: '',
        signal: null,
        pid: 1234,
        output: [],
      });

      vi.mocked(execSync).mockReturnValue('malformed output without proper format');

      // Should not throw, just return empty
      const blocked = scanForBlockedPanes();
      expect(blocked).toEqual([]);
    });
  });

  describe('Scenario: Confidence scoring', () => {
    it('should give higher confidence for multiple indicators', () => {
      const highConfidenceContent = `
Factory Droid
Rate limit reached
5-hour usage limit
[1] Continue
[2] Exit
`;

      const lowConfidenceContent = `
Droid
rate limit
`;

      const highResult = analyzePaneContent(highConfidenceContent);
      const lowResult = analyzePaneContent(lowConfidenceContent);

      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });

    it('should require minimum confidence to mark as blocked', () => {
      const ambiguousContent = `
some droid reference
limit mentioned
`;

      const result = analyzePaneContent(ambiguousContent);

      // Even if some patterns match, confidence should be too low
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.isBlocked).toBe(false);
    });
  });
});
