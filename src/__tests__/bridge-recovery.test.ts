import { describe, it, expect } from 'vitest';
import { processHook } from '../hooks/bridge.js';
import {
  EDIT_ERROR_REMINDER,
  RECOVERY_MESSAGES,
  CONTEXT_LIMIT_SHORT_MESSAGE,
} from '../hooks/recovery/index.js';

describe('bridge recovery routing: post-tool-use edit errors', () => {
  it('injects the edit error reminder when the Edit tool reports a stale assumption', async () => {
    const result = await processHook('post-tool-use', {
      toolName: 'Edit',
      toolOutput: 'Error: oldString not found in file',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBe(EDIT_ERROR_REMINDER);
  });

  it('reads the SDK snake_case payload shape', async () => {
    const result = await processHook('post-tool-use', {
      tool_name: 'Edit',
      tool_response: 'Error: oldString found multiple times',
    } as Parameters<typeof processHook>[1]);

    expect(result.continue).toBe(true);
    expect(result.message).toBe(EDIT_ERROR_REMINDER);
  });

  it('stringifies a structured tool_response before matching', async () => {
    const result = await processHook('post-tool-use', {
      tool_name: 'Edit',
      tool_response: { error: 'oldString and newString must be different' },
    } as Parameters<typeof processHook>[1]);

    expect(result.continue).toBe(true);
    expect(result.message).toBe(EDIT_ERROR_REMINDER);
  });

  it('stays silent for a successful Edit', async () => {
    const result = await processHook('post-tool-use', {
      toolName: 'Edit',
      toolOutput: 'Applied 1 edit to src/index.ts',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('ignores edit error text emitted by other tools', async () => {
    const result = await processHook('post-tool-use', {
      toolName: 'Bash',
      toolOutput: 'Error: oldString not found in file',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('stays silent when there is no tool output', async () => {
    const result = await processHook('post-tool-use', { toolName: 'Edit' });

    expect(result.continue).toBe(true);
    expect(result.message).toBeUndefined();
  });
});

describe('bridge recovery routing: recovery hook', () => {
  it('injects session recovery guidance for a recoverable API error', async () => {
    const result = await processHook('recovery', {
      sessionId: 'test-session',
      error: 'messages: empty content is not permitted',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBe(RECOVERY_MESSAGES.empty_content.message);
  });

  it('injects guidance for a thinking block ordering error', async () => {
    const result = await processHook('recovery', {
      sessionId: 'test-session',
      error: 'expected thinking block but found text block',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBe(RECOVERY_MESSAGES.thinking_block_order.message);
  });

  it('prioritises context window recovery over session recovery', async () => {
    const result = await processHook('recovery', {
      sessionId: 'test-session-ctx',
      error: 'prompt is too long: 200000 tokens > 180000 maximum',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toContain('CONTEXT WINDOW LIMIT REACHED');
  });

  it('falls through to edit error recovery when the error is not recoverable', async () => {
    const result = await processHook('recovery', {
      sessionId: 'test-session',
      toolName: 'Edit',
      toolOutput: 'Error: oldString not found',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBe(EDIT_ERROR_REMINDER);
  });

  it('stays silent for an unrecognised error', async () => {
    const result = await processHook('recovery', {
      sessionId: 'test-session',
      error: 'ENOENT: no such file or directory',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('stays silent when no error is supplied', async () => {
    const result = await processHook('recovery', { sessionId: 'test-session' });

    expect(result.continue).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('tolerates a missing session id', async () => {
    const result = await processHook('recovery', {
      error: 'messages: empty content is not permitted',
    });

    expect(result.continue).toBe(true);
    expect(result.message).toBe(RECOVERY_MESSAGES.empty_content.message);
  });

  it('never blocks, even for an error it cannot classify', async () => {
    const result = await processHook('recovery', { error: { nested: { weird: true } } });

    expect(result.continue).toBe(true);
  });

  it('exposes the context limit message constant used by the recovery path', () => {
    expect(CONTEXT_LIMIT_SHORT_MESSAGE).toContain('Context window limit');
  });
});
