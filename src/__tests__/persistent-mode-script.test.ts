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

  const lastLine = stdout.trim().split(/\r?\n/).pop();
  if (!lastLine) throw new Error('No stdout from hook script');
  return JSON.parse(lastLine) as Record<string, unknown>;
}

describe('persistent-mode hook scripts', () => {
  let homeDir: string;
  let projectDir: string;

  beforeEach(() => {
    homeDir = mkdtempSync(join(tmpdir(), 'omd-home-'));
    projectDir = mkdtempSync(join(tmpdir(), 'omd-project-'));

    mkdirSync(join(projectDir, '.omd', 'state'), { recursive: true });
    writeFileSync(
      join(projectDir, '.omd', 'state', 'ultrawork-state.json'),
      JSON.stringify(
        {
          active: true,
          started_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
          original_prompt: 'test ultrawork',
          reinforcement_count: 0,
        },
        null,
        2
      )
    );
  });

  afterEach(() => {
    rmSync(homeDir, { recursive: true, force: true });
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('templates/hooks/persistent-mode.mjs returns {decision:"block", reason:...} when mode active', () => {
    const scriptPath = join(process.cwd(), 'templates', 'hooks', 'persistent-mode.mjs');

    const output = runNodeScript(
      scriptPath,
      { cwd: projectDir, session_id: 'session_1' },
      { ...process.env, HOME: homeDir }
    );

    expect(output.decision).toBe('block');
    expect(typeof output.reason).toBe('string');
    expect(output.reason).toContain('[ULTRAWORK');
  });

  it('scripts/persistent-mode.mjs returns {decision:"block", reason:...} when mode active', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'persistent-mode.mjs');

    const output = runNodeScript(
      scriptPath,
      { cwd: projectDir, session_id: 'session_1' },
      { ...process.env, HOME: homeDir }
    );

    expect(output.decision).toBe('block');
    expect(typeof output.reason).toBe('string');
    expect(output.reason).toContain('[ULTRAWORK');
  });

  it('returns {continue:true} when no modes active and no tasks incomplete', () => {
    rmSync(join(projectDir, '.omd', 'state', 'ultrawork-state.json'), { force: true });

    const scriptPath = join(process.cwd(), 'scripts', 'persistent-mode.mjs');

    const output = runNodeScript(
      scriptPath,
      { cwd: projectDir, session_id: 'session_1' },
      { ...process.env, HOME: homeDir }
    );

    expect(output.continue).toBe(true);
    expect(output.decision).toBeUndefined();
  });

  describe('user abort handling (both surfaces)', () => {
    const abortPayloads = [
      { label: 'user_requested flag', extra: { user_requested: true } },
      { label: 'userRequested flag', extra: { userRequested: true } },
      { label: 'stop_reason ctrl_c', extra: { stop_reason: 'ctrl_c' } },
      { label: 'stop_reason manual_stop', extra: { stop_reason: 'manual_stop' } },
      { label: 'exact stop_reason cancel', extra: { stop_reason: 'cancel' } },
    ];

    for (const { label, extra } of abortPayloads) {
      it(`scripts surface allows stop: ${label}`, () => {
        const scriptPath = join(process.cwd(), 'scripts', 'persistent-mode.mjs');
        const output = runNodeScript(
          scriptPath,
          { cwd: projectDir, session_id: 'session_1', ...extra },
          { ...process.env, HOME: homeDir }
        );
        expect(output.continue).toBe(true);
        expect(output.decision).toBeUndefined();
      });

      it(`templates surface allows stop: ${label}`, () => {
        const scriptPath = join(process.cwd(), 'templates', 'hooks', 'persistent-mode.mjs');
        const output = runNodeScript(
          scriptPath,
          { cwd: projectDir, session_id: 'session_1', ...extra },
          { ...process.env, HOME: homeDir }
        );
        expect(output.continue).toBe(true);
        expect(output.decision).toBeUndefined();
      });
    }
  });

  describe('non-user cancellations must NOT release persistent mode (issue #210 false positives)', () => {
    for (const reason of ['cancelled_operation', 'operation_cancelled_by_timeout', 'interrupted_by_system', 'auto_interrupt']) {
      it(`scripts surface still blocks on stop_reason "${reason}"`, () => {
        const scriptPath = join(process.cwd(), 'scripts', 'persistent-mode.mjs');
        const output = runNodeScript(
          scriptPath,
          { cwd: projectDir, session_id: 'session_1', stop_reason: reason },
          { ...process.env, HOME: homeDir }
        );
        expect(output.decision).toBe('block');
      });
    }
  });

  describe('context-limit stop (issue #213, both surfaces)', () => {
    const allowReasons = [
      'context_limit',
      'max_tokens',
      'conversation_too_long',
      'input_too_long',
      'context_exceeded',
    ];
    const stillBlock = ['content_length', 'max_length', 'output_length', 'length'];

    for (const reason of allowReasons) {
      it(`scripts surface allows stop: ${reason}`, () => {
        const output = runNodeScript(
          join(process.cwd(), 'scripts', 'persistent-mode.mjs'),
          { cwd: projectDir, session_id: 'session_1', stop_reason: reason },
          { ...process.env, HOME: homeDir }
        );
        expect(output.continue).toBe(true);
        expect(output.decision).toBeUndefined();
      });

      it(`templates surface allows stop: ${reason}`, () => {
        const output = runNodeScript(
          join(process.cwd(), 'templates', 'hooks', 'persistent-mode.mjs'),
          { cwd: projectDir, session_id: 'session_1', stop_reason: reason },
          { ...process.env, HOME: homeDir }
        );
        expect(output.continue).toBe(true);
        expect(output.decision).toBeUndefined();
      });
    }

    for (const reason of stillBlock) {
      it(`scripts surface still blocks on stop_reason "${reason}"`, () => {
        const output = runNodeScript(
          join(process.cwd(), 'scripts', 'persistent-mode.mjs'),
          { cwd: projectDir, session_id: 'session_1', stop_reason: reason },
          { ...process.env, HOME: homeDir }
        );
        expect(output.decision).toBe('block');
      });

      it(`templates surface still blocks on stop_reason "${reason}"`, () => {
        const output = runNodeScript(
          join(process.cwd(), 'templates', 'hooks', 'persistent-mode.mjs'),
          { cwd: projectDir, session_id: 'session_1', stop_reason: reason },
          { ...process.env, HOME: homeDir }
        );
        expect(output.decision).toBe('block');
      });
    }
  });

  it('allows stop when cwd is omitted (does not read process.cwd() state)', () => {
    const output = runNodeScript(
      join(process.cwd(), 'scripts', 'persistent-mode.mjs'),
      { session_id: 'session_1' },
      { ...process.env, HOME: homeDir }
    );
    expect(output.continue).toBe(true);
    expect(output.decision).toBeUndefined();
  });

  it('treats a state file with no timestamps as stale (allow stop)', () => {
    writeFileSync(
      join(projectDir, '.omd', 'state', 'ultrawork-state.json'),
      JSON.stringify({ active: true })
    );

    const scriptPath = join(process.cwd(), 'scripts', 'persistent-mode.mjs');
    const output = runNodeScript(
      scriptPath,
      { cwd: projectDir, session_id: 'session_1' },
      { ...process.env, HOME: homeDir }
    );

    expect(output.continue).toBe(true);
    expect(output.decision).toBeUndefined();
  });

  describe('incomplete task counting is an allowlist on both surfaces', () => {
    function writeTask(status: string, name: string): void {
      const taskDir = join(homeDir, '.factory', 'tasks', 'session_1');
      mkdirSync(taskDir, { recursive: true });
      writeFileSync(join(taskDir, `${name}.json`), JSON.stringify({ status }));
    }

    for (const surface of ['scripts', 'templates/hooks'] as const) {
      it(`${surface} counts only pending/in_progress tasks`, () => {
        writeTask('cancelled', 'a');
        writeTask('failed', 'b');
        writeTask('deleted', 'c');
        writeTask('in_progress', 'd');
        writeTask('pending', 'e');

        const output = runNodeScript(
          join(process.cwd(), ...surface.split('/'), 'persistent-mode.mjs'),
          { cwd: projectDir, session_id: 'session_1' },
          { ...process.env, HOME: homeDir }
        );

        expect(output.decision).toBe('block');
        expect(output.reason).toContain('2 incomplete Tasks');
      });

      it(`${surface} ignores terminal-status tasks entirely`, () => {
        writeTask('cancelled', 'a');
        writeTask('failed', 'b');

        const output = runNodeScript(
          join(process.cwd(), ...surface.split('/'), 'persistent-mode.mjs'),
          { cwd: projectDir, session_id: 'session_1' },
          { ...process.env, HOME: homeDir }
        );

        expect(output.decision).toBe('block');
        expect(output.reason).not.toContain('incomplete');
      });
    }
  });

  describe('session-scoped todos accept both array and {todos:[...]} shapes', () => {
    function writeSessionTodos(payload: unknown): void {
      const todoDir = join(homeDir, '.factory', 'todos');
      mkdirSync(todoDir, { recursive: true });
      writeFileSync(join(todoDir, 'session_1.json'), JSON.stringify(payload));
    }

    const shapes: Array<[string, unknown]> = [
      ['bare array', [{ status: 'pending' }, { status: 'completed' }]],
      ['wrapped object', { todos: [{ status: 'pending' }, { status: 'completed' }] }],
    ];

    for (const surface of ['scripts', 'templates/hooks'] as const) {
      for (const [shapeName, payload] of shapes) {
        it(`${surface} counts session todos given as a ${shapeName}`, () => {
          writeSessionTodos(payload);

          const output = runNodeScript(
            join(process.cwd(), ...surface.split('/'), 'persistent-mode.mjs'),
            { cwd: projectDir, session_id: 'session_1' },
            { ...process.env, HOME: homeDir }
          );

          expect(output.decision).toBe('block');
          expect(output.reason).toContain('1 incomplete todos');
        });
      }
    }
  });
});
