import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  isSafeCommand,
  isAutoApproveEnabled,
  processPermissionRequest,
  createPermissionDecision,
} from '../index.js';
import type { PreToolUsePermissionInput } from '../index.js';

describe('permission-handler', () => {
  let homeDir: string;
  let omdConfigFile: string;

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-perm-home-'));
    const factoryDir = path.join(homeDir, '.factory');
    fs.mkdirSync(factoryDir, { recursive: true });
    omdConfigFile = path.join(factoryDir, '.omd-config.json');
  });

  afterEach(() => {
    fs.rmSync(homeDir, { recursive: true, force: true });
  });

  describe('isSafeCommand', () => {
    describe('safe read-only commands', () => {
      const safeCases = [
        'git status',
        'git diff',
        'git log',
        'git branch',
        'git show',
        'ls',
        'ls -la',
        // Quoted paths are allowed (needed for paths with spaces)
        'ls "my folder"',
        'ls \'my folder\'',
        'git diff "src/file with spaces.ts"',
      ];

      safeCases.forEach((cmd) => {
        it(`should allow safe command: ${cmd}`, () => {
          expect(isSafeCommand(cmd)).toBe(true);
        });
      });
    });

    describe('project-controlled build/test runners rejected from auto-approve', () => {
      const projectControlled = [
        'npm test',
        'npm run test',
        'npm run lint',
        'npm run build',
        'pnpm test',
        'yarn test',
        'tsc',
        'tsc --noEmit',
        'eslint .',
        'prettier .',
        'cargo test',
        'cargo check',
        'pytest',
        'python -m pytest',
        'git fetch',
      ];

      projectControlled.forEach((cmd) => {
        it(`should reject project-controlled command: ${cmd}`, () => {
          expect(isSafeCommand(cmd)).toBe(false);
        });
      });
    });

    describe('shell metacharacter injection prevention', () => {
      const dangerousCases = [
        'git status; rm -rf /',
        'git status;rm -rf /',
        'git status ; rm -rf /',
        'git status | sh',
        'git status|sh',
        'git status | bash',
        'git status && rm -rf /',
        'git status||rm -rf /',
        'git status `whoami`',
        'git status $(whoami)',
        'git status$HOME',
        'git status > /etc/passwd',
        'git status >> /etc/passwd',
        'git status < /etc/shadow',
        'git status()',
        '(git status)',
        'git status\nrm -rf /',
        'git status\n\nrm -rf /',
        'git status\tmalicious_command',
        'git status\\nrm -rf /',
      ];

      dangerousCases.forEach((cmd) => {
        it(`should reject shell metacharacter injection: ${cmd}`, () => {
          expect(isSafeCommand(cmd)).toBe(false);
        });
      });
    });
  });

  describe('isAutoApproveEnabled', () => {
    it('returns false when config does not exist', () => {
      expect(isAutoApproveEnabled(homeDir)).toBe(false);
    });

    it('returns true when autoApproveSafeCommands is true', () => {
      fs.writeFileSync(omdConfigFile, JSON.stringify({ autoApproveSafeCommands: true }));
      expect(isAutoApproveEnabled(homeDir)).toBe(true);
    });
  });

  describe('createPermissionDecision', () => {
    it('creates allow decision output', () => {
      const output = createPermissionDecision('allow', 'Safe read-only command');
      expect(output.continue).toBe(true);
      expect(output.hookSpecificOutput?.hookEventName).toBe('PreToolUse');
      expect(output.hookSpecificOutput?.permissionDecision).toBe('allow');
      expect(output.hookSpecificOutput?.permissionDecisionReason).toBe('Safe read-only command');
    });

    it('creates deny decision output', () => {
      const output = createPermissionDecision('deny', 'Destructive command blocked');
      expect(output.continue).toBe(true);
      expect(output.hookSpecificOutput?.hookEventName).toBe('PreToolUse');
      expect(output.hookSpecificOutput?.permissionDecision).toBe('deny');
      expect(output.hookSpecificOutput?.permissionDecisionReason).toBe('Destructive command blocked');
    });

    it('creates ask decision output', () => {
      const output = createPermissionDecision('ask', 'User confirmation required');
      expect(output.continue).toBe(true);
      expect(output.hookSpecificOutput?.hookEventName).toBe('PreToolUse');
      expect(output.hookSpecificOutput?.permissionDecision).toBe('ask');
      expect(output.hookSpecificOutput?.permissionDecisionReason).toBe('User confirmation required');
    });
  });

  describe('processPermissionRequest', () => {
    const createInput = (command?: string, tool_name = 'Execute'): PreToolUsePermissionInput => ({
      session_id: 'test-session',
      transcript_path: '/path/to/transcript.jsonl',
      cwd: '/path/to/project',
      permission_mode: 'auto-low',
      hook_event_name: 'PreToolUse',
      tool_name,
      tool_input: command ? { command } : {},
      tool_use_id: 'toolu_123',
    });

    it('returns continue:true when auto-approve is disabled (default)', () => {
      // No config file present
      const input = createInput('git status');
      const result = processPermissionRequest(input, homeDir);
      expect(result).toEqual({ continue: true });
    });

    it('auto-allows safe command when autoApproveSafeCommands is true', () => {
      fs.writeFileSync(omdConfigFile, JSON.stringify({ autoApproveSafeCommands: true }));

      const input = createInput('git status');
      const result = processPermissionRequest(input, homeDir);
      expect(result.continue).toBe(true);
      expect(result.hookSpecificOutput?.hookEventName).toBe('PreToolUse');
      expect(result.hookSpecificOutput?.permissionDecision).toBe('allow');
    });

    it('returns continue:true for non-safe commands even when auto-approve enabled', () => {
      fs.writeFileSync(omdConfigFile, JSON.stringify({ autoApproveSafeCommands: true }));

      const input = createInput('rm -rf /tmp/stuff');
      const result = processPermissionRequest(input, homeDir);
      expect(result).toEqual({ continue: true });
    });

    it('ignores non-Execute tools', () => {
      fs.writeFileSync(omdConfigFile, JSON.stringify({ autoApproveSafeCommands: true }));

      const input = createInput('git status', 'Create');
      const result = processPermissionRequest(input, homeDir);
      expect(result).toEqual({ continue: true });
    });
  });
});
