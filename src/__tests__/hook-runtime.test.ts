import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * Every command in hooks/hooks.json must run on a tracked-only install, where
 * Factory copies repository files without dist/ or node_modules/.
 *
 * The fixture copies only tracked directories, then asserts dist/ and
 * node_modules/ are unreachable before running each registration.
 */
describe('hook registrations on a tracked-only install', () => {
  let homeDir: string;
  let pluginDir: string;

  beforeEach(() => {
    homeDir = mkdtempSync(join(tmpdir(), 'omd-hooks-home-'));
    pluginDir = mkdtempSync(join(tmpdir(), 'omd-hooks-plugin-'));
    for (const dir of ['scripts', 'bridge', 'hooks', 'skills']) {
      cpSync(join(process.cwd(), dir), join(pluginDir, dir), { recursive: true });
    }
    mkdirSync(join(pluginDir, '.omd'), { recursive: true });
  });

  afterEach(() => {
    rmSync(homeDir, { recursive: true, force: true });
    rmSync(pluginDir, { recursive: true, force: true });
  });

  function registeredCommands(): { event: string; args: string[] }[] {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), 'hooks', 'hooks.json'), 'utf8')
    );
    return Object.entries(config.hooks as Record<string, { hooks: { command: string }[] }[]>)
      .flatMap(([event, matchers]) =>
        matchers.flatMap((matcher) =>
          matcher.hooks.map((hook) => ({
            event,
            args: hook.command
              .replace('${DROID_PLUGIN_ROOT}', pluginDir)
              .split(' ')
              .slice(1),
          }))
        )
      );
  }

  const payload = JSON.stringify({
    session_id: 'fixture',
    transcript_path: '',
    permission_mode: 'default',
    hook_event_name: 'Fixture',
    prompt: 'fixture prompt',
    reason: 'other',
    task_name: 'fixture-task',
    tool_name: 'Execute',
    tool_input: { command: 'git status' },
    tool_use_id: 'use-1',
  });

  it('exits 0 with JSON on stdout for all hook registrations', () => {
    expect(existsSync(join(pluginDir, 'dist'))).toBe(false);
    expect(existsSync(join(pluginDir, 'node_modules'))).toBe(false);

    const commands = registeredCommands();
    expect(commands).toHaveLength(10);

    for (const { event, args } of commands) {
      const result = spawnSync('node', args, {
        cwd: pluginDir,
        env: {
          ...process.env,
          HOME: homeDir,
          USERPROFILE: homeDir,
          NODE_PATH: '',
        },
        input: JSON.stringify({ ...JSON.parse(payload), cwd: pluginDir }),
        encoding: 'utf8',
      });

      const label = `${event} ${args.join(' ')}`;
      expect(result.status, `${label} stderr: ${result.stderr}`).toBe(0);
      expect(() => JSON.parse(result.stdout), `${label} stdout: ${result.stdout}`).not.toThrow();
      expect(JSON.parse(result.stdout).continue, label).toBe(true);
    }
  }, 30000);

  it('exits 1 with a diagnostic, never 2, when the runtime bundle is missing', () => {
    rmSync(join(pluginDir, 'bridge', 'hooks.cjs'));

    const result = spawnSync('node', [join(pluginDir, 'scripts', 'session-end.mjs')], {
      cwd: pluginDir,
      env: { ...process.env, HOME: homeDir, USERPROFILE: homeDir, NODE_PATH: '' },
      input: payload,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Hook runtime unavailable');
  });
});
