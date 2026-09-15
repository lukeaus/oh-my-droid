import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isNonInteractive } from '../hooks/non-interactive-env/detector.js';

const originalTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

beforeEach(() => {
  vi.stubEnv('CI', undefined);
  vi.stubEnv('GITHUB_ACTIONS', undefined);
  vi.stubEnv('CLAUDE_CODE_RUN', 'true');
  vi.stubEnv('CLAUDE_CODE_NON_INTERACTIVE', 'true');
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalTTY) {
    Object.defineProperty(process.stdout, 'isTTY', originalTTY);
  } else {
    Reflect.deleteProperty(process.stdout, 'isTTY');
  }
});

describe('isNonInteractive', () => {
  it('ignores legacy Claude flags in an interactive terminal', () => {
    expect(isNonInteractive()).toBe(false);
  });

  it.each([['CI', 'true'], ['CI', '1'], ['GITHUB_ACTIONS', 'true']])(
    'detects %s=%s even with a TTY', (name, value) => {
      vi.stubEnv(name, value);
      expect(isNonInteractive()).toBe(true);
    },
  );

  it.each([false, undefined])('detects non-TTY stdout (%s)', (isTTY) => {
    Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, configurable: true });
    expect(isNonInteractive()).toBe(true);
  });
});
