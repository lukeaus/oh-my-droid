import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkRateLimitStatus,
  detectBlockedPanes,
  stopDaemon,
} from '../features/rate-limit-wait/index.js';
import {
  waitCommand,
  waitDaemonCommand,
  waitDetectCommand,
  waitStatusCommand,
} from '../cli/commands/wait.js';

vi.mock('../features/rate-limit-wait/index.js', () => ({
  checkRateLimitStatus: vi.fn().mockResolvedValue(null),
  formatRateLimitStatus: vi.fn(),
  isTmuxAvailable: vi.fn().mockReturnValue(true),
  isInsideTmux: vi.fn().mockReturnValue(false),
  isDaemonRunning: vi.fn().mockReturnValue(false),
  getDaemonStatus: vi.fn().mockReturnValue({ success: true, message: 'Daemon has never been started' }),
  startDaemon: vi.fn().mockReturnValue({ success: true, message: 'Daemon started' }),
  stopDaemon: vi.fn().mockReturnValue({ success: true, message: 'Daemon stopped' }),
  detectBlockedPanes: vi.fn(),
  runDaemonForeground: vi.fn(),
}));

describe('wait commands without a supported Factory quota API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([waitCommand, waitStatusCommand])('%s explains unsupported monitoring', async (command) => {
    await command({});
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(output).toContain('Factory quota monitoring and automatic resume are unavailable');
    expect(output).not.toMatch(/OAuth|Pro\/Max|Install tmux for auto-resume/);
  });

  it.each([waitCommand, waitStatusCommand])('%s preserves null quota status in JSON', async (command) => {
    await command({ json: true });
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(vi.mocked(console.log).mock.calls[0][0])).toMatchObject({
      rateLimit: null,
      tmux: { available: true, insideSession: false },
    });
  });

  it('still stops an existing daemon without checking quotas', async () => {
    await waitCommand({ stop: true });
    expect(stopDaemon).toHaveBeenCalledTimes(1);
    expect(checkRateLimitStatus).not.toHaveBeenCalled();
  });

  it('does not promise automatic resume after starting the daemon', async () => {
    await waitDaemonCommand('start', {});
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(output).toContain('Factory quota monitoring and automatic resume are unavailable');
    expect(output).not.toMatch(/The daemon will|Auto-resume sessions/);
  });

  it('recommends manual resume for detected panes', async () => {
    vi.mocked(detectBlockedPanes).mockResolvedValue({
      success: true,
      message: 'Found 1 blocked session',
      state: {
        isRunning: false, pid: null, startedAt: null, lastPollAt: null,
        rateLimitStatus: null, resumedPaneIds: [], totalResumeAttempts: 0,
        successfulResumes: 0, errorCount: 0,
        blockedPanes: [{
          id: '%0', session: 'main', windowIndex: 0, windowName: 'dev', paneIndex: 0,
          isActive: true, firstDetectedAt: new Date(), resumeAttempted: false,
          analysis: { hasDroid: true, hasRateLimitMessage: true, isBlocked: true, confidence: 1 },
        }],
      },
    });
    await waitDetectCommand({});
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(output).toContain('Resume blocked sessions manually');
    expect(output).not.toContain('omd wait daemon start');
  });
});
