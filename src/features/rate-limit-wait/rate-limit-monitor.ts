/**
 * Rate Limit Monitor
 *
 * Rate limit status availability and display formatting.
 */

import type { RateLimitStatus } from './types.js';

/**
 * Check current rate limit status
 *
 * @returns Rate limit status or null if API unavailable
 */
export async function checkRateLimitStatus(): Promise<RateLimitStatus | null> {
  // ponytail: Factory quota API is unsupported; add monitoring when a supported API exists.
  return null;
}

/**
 * Format time until reset for display
 */
export function formatTimeUntilReset(ms: number): string {
  if (ms <= 0) return 'now';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Get a human-readable rate limit status message
 */
export function formatRateLimitStatus(status: RateLimitStatus): string {
  if (!status.isLimited) {
    return 'Not rate limited';
  }

  const parts: string[] = [];

  if (status.fiveHourLimited) {
    parts.push('5-hour limit reached');
  }
  if (status.weeklyLimited) {
    parts.push('Weekly limit reached');
  }

  let message = parts.join(' and ');

  if (status.timeUntilResetMs !== null) {
    message += ` (resets in ${formatTimeUntilReset(status.timeUntilResetMs)})`;
  }

  return message;
}
