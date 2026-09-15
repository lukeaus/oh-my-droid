import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

import { spawn } from 'child_process';
import {
  launchTokscaleTUI,
  isTokscaleCLIAvailable,
  getInstallInstructions
} from '../../cli/utils/tokscale-launcher.js';

describe('tokscale-launcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('launchTokscaleTUI', () => {
    it('spawns bunx with -c droid by default', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('close', 0));
        return mockProc;
      }) as any);

      await launchTokscaleTUI();

      expect(spawn).toHaveBeenCalledWith(
        'bunx',
        ['tokscale@latest', 'tui', '-c', 'droid'],
        { stdio: 'inherit' }
      );
    });

    it('omits client filter when droid is false', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('close', 0));
        return mockProc;
      }) as any);

      await launchTokscaleTUI({ droid: false });

      expect(spawn).toHaveBeenCalledWith(
        'bunx',
        ['tokscale@latest', 'tui'],
        { stdio: 'inherit' }
      );
    });

    it('passes --light flag when light is true', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('close', 0));
        return mockProc;
      }) as any);

      await launchTokscaleTUI({ light: true });

      // --light only exists at top level, not on the `tui` subcommand
      expect(spawn).toHaveBeenCalledWith(
        'bunx',
        ['tokscale@latest', '-c', 'droid', '--light'],
        { stdio: 'inherit' }
      );
    });

    it('never passes --droid or invalid positional views', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('close', 0));
        return mockProc;
      }) as any);

      await launchTokscaleTUI({ droid: true, light: true });

      const args = vi.mocked(spawn).mock.calls[0][1];
      expect(args).not.toContain('--droid');
      expect(args).not.toContain('overview');
      expect(args).not.toContain('daily');
      expect(args).not.toContain('stats');
      expect(args).not.toContain('models');
    });

    it('rejects on non-zero exit code', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('close', 1));
        return mockProc;
      }) as any);

      await expect(launchTokscaleTUI()).rejects.toThrow('tokscale exited with code 1');
    });

    it('rejects on process error event', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('error', new Error('spawn ENOENT')));
        return mockProc;
      }) as any);

      await expect(launchTokscaleTUI()).rejects.toThrow('Failed to launch tokscale: spawn ENOENT');
    });
  });

  describe('isTokscaleCLIAvailable', () => {
    it('returns true when exit code is 0', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('close', 0));
        return mockProc;
      }) as any);

      const available = await isTokscaleCLIAvailable();
      expect(available).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        'bunx',
        ['tokscale@latest', '--version'],
        { stdio: 'ignore' }
      );
    });

    it('returns false when exit code is non-zero', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('close', 1));
        return mockProc;
      }) as any);

      const available = await isTokscaleCLIAvailable();
      expect(available).toBe(false);
    });

    it('returns false on process error', async () => {
      const mockProc = new EventEmitter() as any;
      vi.mocked(spawn).mockImplementation((() => {
        queueMicrotask(() => mockProc.emit('error', new Error('spawn ENOENT')));
        return mockProc;
      }) as any);

      const available = await isTokscaleCLIAvailable();
      expect(available).toBe(false);
    });
  });

  describe('getInstallInstructions', () => {
    it('returns instructions containing install commands', () => {
      const instructions = getInstallInstructions();
      expect(instructions).toContain('bun install -g tokscale');
      expect(instructions).toContain('bunx tokscale@latest');
    });
  });
});
