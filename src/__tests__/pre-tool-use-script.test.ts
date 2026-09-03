import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
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

describe('pre-tool-use hook scripts', () => {
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

  describe('templates/hooks/pre-tool-use.mjs', () => {
    it('adds run_in_background for Task calls during ultrawork', () => {
      mkdirSync(join(projectDir, '.omd', 'state'), { recursive: true });
      writeFileSync(
        join(projectDir, '.omd', 'state', 'ultrawork-state.json'),
        JSON.stringify({ active: true, started_at: new Date().toISOString() }, null, 2)
      );

      const scriptPath = join(process.cwd(), 'templates', 'hooks', 'pre-tool-use.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          tool_name: 'Task',
          tool_input: {
            subagent_type: 'oh-my-droid:explore',
            description: 'scan repo',
            prompt: 'find files',
          },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PreToolUse');
      expect(hso?.updatedInput?.run_in_background).toBe(true);
    });

    it('respects explicit run_in_background=false', () => {
      mkdirSync(join(projectDir, '.omd', 'state'), { recursive: true });
      writeFileSync(
        join(projectDir, '.omd', 'state', 'ultrawork-state.json'),
        JSON.stringify({ active: true, started_at: new Date().toISOString() }, null, 2)
      );

      const scriptPath = join(process.cwd(), 'templates', 'hooks', 'pre-tool-use.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          tool_name: 'Task',
          tool_input: {
            subagent_type: 'oh-my-droid:explore',
            description: 'scan repo',
            prompt: 'find files',
            run_in_background: false,
          },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      expect(output.hookSpecificOutput).toBeUndefined();
    });

    it('warns on source modification via Execute command', () => {
      const scriptPath = join(process.cwd(), 'templates', 'hooks', 'pre-tool-use.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          tool_name: 'Execute',
          tool_input: {
            command: 'echo "const x = 1;" > src/index.ts',
          },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PreToolUse');
      expect(hso?.additionalContext).toContain('[DELEGATION NOTICE]');
    });
  });

  describe('scripts/pre-tool-enforcer.mjs', () => {
    it('emits tool-specific reminder for Execute tool', () => {
      const scriptPath = join(process.cwd(), 'scripts', 'pre-tool-enforcer.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          tool_name: 'Execute',
          tool_input: { command: 'npm test' },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PreToolUse');
      expect(hso?.additionalContext).toContain('parallel execution');
    });

    it('emits tool-specific reminder for Create tool', () => {
      const scriptPath = join(process.cwd(), 'scripts', 'pre-tool-enforcer.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          tool_name: 'Create',
          tool_input: { file_path: 'foo.ts' },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.hookEventName).toBe('PreToolUse');
      expect(hso?.additionalContext).toContain('Verify changes work after editing');
    });

    it('reads todo status from payload cwd', () => {
      mkdirSync(join(projectDir, '.omd'), { recursive: true });
      writeFileSync(
        join(projectDir, '.omd', 'todos.json'),
        JSON.stringify({
          todos: [
            { id: '1', status: 'in_progress', text: 'Task 1' },
            { id: '2', status: 'pending', text: 'Task 2' },
          ],
        })
      );

      const scriptPath = join(process.cwd(), 'scripts', 'pre-tool-enforcer.mjs');

      const output = runNodeScript(
        scriptPath,
        {
          cwd: projectDir,
          tool_name: 'Edit',
          tool_input: { file_path: 'foo.ts' },
        },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as any;
      expect(hso?.additionalContext).toContain('[1 active, 1 pending]');
    });

    it('does not read todos from process.cwd() when cwd is omitted', () => {
      const scriptPath = join(process.cwd(), 'scripts', 'pre-tool-enforcer.mjs');
      const output = runNodeScript(
        scriptPath,
        { tool_name: 'Edit', tool_input: { file_path: 'foo.ts' } },
        { ...process.env, HOME: homeDir }
      );

      expect(output.continue).toBe(true);
      const hso = output.hookSpecificOutput as { additionalContext?: string };
      expect(hso?.additionalContext ?? '').not.toMatch(/\[\d+ active/);
    });
  });
});
