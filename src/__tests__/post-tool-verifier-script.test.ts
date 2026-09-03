import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function runNodeScript(scriptPath: string, input: unknown, env: NodeJS.ProcessEnv): Record<string, unknown> {
  const stdout = execFileSync('node', [scriptPath], {
    input: JSON.stringify(input),
    env,
    encoding: 'utf8',
  });

  const trimmed = stdout.trim();
  if (!trimmed) throw new Error('No stdout from hook script');
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const lastLine = trimmed.split(/\r?\n/).pop()!;
    return JSON.parse(lastLine) as Record<string, unknown>;
  }
}

describe('post-tool-verifier hook scripts', () => {
  let homeDir: string;
  let projectDir: string;

  beforeEach(() => {
    homeDir = mkdtempSync(join(tmpdir(), 'omd-home-'));
    projectDir = mkdtempSync(join(tmpdir(), 'omd-project-'));
  });

  afterEach(() => {
    rmSync(homeDir, { recursive: true, force: true });
    rmSync(projectDir, { recursive: true, force: true });
  });

  describe('scripts/post-tool-verifier.mjs', () => {
    it('detects Execute command failure from string tool_response', () => {
      const scriptPath = join(process.cwd(), 'scripts', 'post-tool-verifier.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          session_id: 'session_1',
          tool_name: 'Execute',
          tool_input: { command: 'npm test' },
          tool_response: 'error: test suite failed with exit code 1',
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PostToolUse');
      expect(hso?.additionalContext).toContain('Command failed');
    });

    it('detects Execute command failure from structured object tool_response', () => {
      const scriptPath = join(process.cwd(), 'scripts', 'post-tool-verifier.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          session_id: 'session_1',
          tool_name: 'Execute',
          tool_input: { command: 'git pull' },
          tool_response: { stdout: '', stderr: 'fatal: repository not found', exit_code: 128 },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PostToolUse');
      expect(hso?.additionalContext).toContain('Command failed');
    });

    it('detects Create tool success', () => {
      const scriptPath = join(process.cwd(), 'scripts', 'post-tool-verifier.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          session_id: 'session_1',
          tool_name: 'Create',
          tool_input: { file_path: 'src/main.ts' },
          tool_response: 'File created successfully',
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PostToolUse');
      expect(hso?.additionalContext).toContain('File written. Test the changes');
    });

    it('detects TodoWrite updates', () => {
      const scriptPath = join(process.cwd(), 'scripts', 'post-tool-verifier.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          session_id: 'session_1',
          tool_name: 'TodoWrite',
          tool_input: { todos: [] },
          tool_response: 'Task completed',
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PostToolUse');
      expect(hso?.additionalContext).toContain('Task marked complete');
    });
  });

  describe('templates/hooks/post-tool-use.mjs', () => {
    it('processes <remember> tags from Task output into .omd/notepad.md', () => {
      const scriptPath = join(process.cwd(), 'templates', 'hooks', 'post-tool-use.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          session_id: 'session_1',
          tool_name: 'Task',
          tool_input: { prompt: 'research' },
          tool_response: 'Completed task with info <remember>Use port 8080</remember>',
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const notepadContent = readFileSync(join(projectDir, '.omd', 'notepad.md'), 'utf-8');
      expect(notepadContent).toContain('Use port 8080');
    });

    it('processes <remember priority> tags into Priority Context', () => {
      const scriptPath = join(process.cwd(), 'templates', 'hooks', 'post-tool-use.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          session_id: 'session_1',
          tool_name: 'Task',
          tool_input: { prompt: 'research' },
          tool_response: { stdout: '<remember priority>Critical auth key is XYZ</remember>' },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const notepadContent = readFileSync(join(projectDir, '.omd', 'notepad.md'), 'utf-8');
      expect(notepadContent).toContain('Critical auth key is XYZ');
    });
  });
});
