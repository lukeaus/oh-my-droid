/**
 * Session Recovery
 *
 * Classifies API errors that break a session (missing tool results, thinking
 * block ordering, empty content) and returns guidance telling the model how to
 * correct itself on the next turn.
 */

import { appendFileSync } from 'node:fs';
import {
  DEBUG,
  DEBUG_FILE,
  RECOVERY_MESSAGES,
} from './constants.js';
import type { RecoveryResult, RecoveryConfig } from './types.js';

/**
 * Recovery error types
 */
export type RecoveryErrorType =
  | 'tool_result_missing'
  | 'thinking_block_order'
  | 'thinking_disabled_violation'
  | 'empty_content'
  | null;

/**
 * Debug logging utility
 */
function debugLog(...args: unknown[]): void {
  if (DEBUG) {
    const msg = `[${new Date().toISOString()}] [session-recovery] ${args
      .map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
      .join(' ')}\n`;
    appendFileSync(DEBUG_FILE, msg);
  }
}

/**
 * Extract error message from various error formats
 */
function getErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error.toLowerCase();

  const errorObj = error as Record<string, unknown>;
  const paths = [
    errorObj.data,
    errorObj.error,
    errorObj,
    (errorObj.data as Record<string, unknown>)?.error,
  ];

  for (const obj of paths) {
    if (obj && typeof obj === 'object') {
      const msg = (obj as Record<string, unknown>).message;
      if (typeof msg === 'string' && msg.length > 0) {
        return msg.toLowerCase();
      }
    }
  }

  try {
    return JSON.stringify(error).toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Detect the type of recoverable error
 */
export function detectErrorType(error: unknown): RecoveryErrorType {
  const message = getErrorMessage(error);

  if (message.includes('tool_use') && message.includes('tool_result')) {
    return 'tool_result_missing';
  }

  if (
    message.includes('thinking') &&
    (message.includes('first block') ||
      message.includes('must start with') ||
      message.includes('preceeding') ||
      message.includes('final block') ||
      message.includes('cannot be thinking') ||
      (message.includes('expected') && message.includes('found')))
  ) {
    return 'thinking_block_order';
  }

  if (message.includes('thinking is disabled') && message.includes('cannot contain')) {
    return 'thinking_disabled_violation';
  }

  if (
    message.includes('empty') &&
    (message.includes('content') || message.includes('message'))
  ) {
    return 'empty_content';
  }

  return null;
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  return detectErrorType(error) !== null;
}

/**
 * Main recovery handler
 *
 * Returns the corrective guidance for a recoverable session error, or an
 * unattempted result when the error is not one we know how to recover from.
 */
export async function handleSessionRecovery(
  sessionID: string,
  error: unknown,
  config?: RecoveryConfig
): Promise<RecoveryResult> {
  debugLog('handleSessionRecovery', { sessionID, error });

  const errorType = detectErrorType(error);
  if (!errorType) {
    debugLog('Not a recoverable error');
    return {
      attempted: false,
      success: false,
    };
  }

  debugLog('Detected recoverable error type', errorType);

  const message =
    config?.customMessages?.[errorType] ||
    RECOVERY_MESSAGES[errorType]?.message ||
    `Session recovery attempted for ${errorType}`;

  return {
    attempted: true,
    success: true,
    message,
    errorType,
  };
}
