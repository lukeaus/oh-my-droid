import { describe, it, expect } from 'vitest';
import {
  detectErrorType,
  isRecoverableError,
  handleSessionRecovery,
} from '../hooks/recovery/session-recovery.js';
import { handleRecovery, createRecoveryHook } from '../hooks/recovery/index.js';
import { RECOVERY_MESSAGES } from '../hooks/recovery/constants.js';

describe('session recovery error classification', () => {
  it('classifies each recoverable error type', () => {
    expect(detectErrorType('tool_use was called without tool_result')).toBe('tool_result_missing');
    expect(detectErrorType('expected thinking but found text')).toBe('thinking_block_order');
    expect(detectErrorType('thinking is disabled and cannot contain thinking blocks')).toBe(
      'thinking_disabled_violation'
    );
    expect(detectErrorType('empty content in message')).toBe('empty_content');
  });

  it('returns null for unrelated errors', () => {
    expect(detectErrorType('unrelated syntax error')).toBeNull();
    expect(detectErrorType('')).toBeNull();
    expect(detectErrorType(undefined)).toBeNull();
    expect(detectErrorType(null)).toBeNull();
  });

  it('unwraps nested error shapes', () => {
    expect(detectErrorType({ message: 'empty content in message' })).toBe('empty_content');
    expect(detectErrorType({ error: { message: 'empty content in message' } })).toBe(
      'empty_content'
    );
    expect(detectErrorType({ data: { message: 'empty content in message' } })).toBe(
      'empty_content'
    );
    expect(detectErrorType(new Error('empty content in message'))).toBe('empty_content');
  });

  it('mirrors detectErrorType in isRecoverableError', () => {
    expect(isRecoverableError('empty content in message')).toBe(true);
    expect(isRecoverableError('unrelated syntax error')).toBe(false);
  });
});

describe('session recovery guidance', () => {
  it('returns the corrective guidance for a recoverable error', async () => {
    const result = await handleSessionRecovery('test-session', 'empty message content');

    expect(result.attempted).toBe(true);
    expect(result.success).toBe(true);
    expect(result.errorType).toBe('empty_content');
    expect(result.message).toBe(RECOVERY_MESSAGES.empty_content.message);
  });

  it('does not attempt recovery for unrecognised errors', async () => {
    const result = await handleSessionRecovery('test-session', 'unrelated syntax error');

    expect(result.attempted).toBe(false);
    expect(result.success).toBe(false);
    expect(result.message).toBeUndefined();
  });

  it('prefers a caller-supplied custom message', async () => {
    const result = await handleSessionRecovery('test-session', 'empty message content', {
      customMessages: { empty_content: 'custom guidance' },
    });

    expect(result.message).toBe('custom guidance');
  });

  it('never touches the filesystem for any recoverable type', async () => {
    const errors = [
      'tool_use was called without tool_result',
      'expected thinking but found text',
      'thinking is disabled and cannot contain thinking blocks',
      'empty content in message',
    ];

    for (const error of errors) {
      const result = await handleSessionRecovery('test-session', error);
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toBeTruthy();
    }
  });
});

describe('unified recovery routing', () => {
  it('routes a session error through handleRecovery', async () => {
    const result = await handleRecovery({
      sessionId: 'test-session',
      error: 'empty content in message',
    });

    expect(result.attempted).toBe(true);
    expect(result.errorType).toBe('empty_content');
  });

  it('reports nothing attempted when no recovery applies', async () => {
    const result = await handleRecovery({
      sessionId: 'test-session',
      error: 'unrelated syntax error',
    });

    expect(result.attempted).toBe(false);
    expect(result.success).toBe(false);
  });

  it('exposes session recovery through the hook onError entry point', async () => {
    const hook = createRecoveryHook();
    const result = await hook.onError({
      session_id: 'test-session',
      error: 'empty content in message',
    });

    expect(result.attempted).toBe(true);
    expect(result.errorType).toBe('empty_content');
  });
});
