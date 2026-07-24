import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

describe('plugin runtime', () => {
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

  function setupAndRunHud(): string {
    execFileSync('node', [join(process.cwd(), 'scripts', 'plugin-setup.mjs')], {
      cwd: projectDir,
      env: { ...process.env, HOME: homeDir },
    });

    return execFileSync('node', [join(homeDir, '.factory', 'hud', 'omd-hud.mjs')], {
      cwd: projectDir,
      env: { ...process.env, HOME: homeDir, NODE_PATH: '' },
      encoding: 'utf8',
    });
  }

  it('runs the bundled HUD from a tracked-only plugin install', () => {
    const registryDir = join(homeDir, '.factory', 'plugins');
    const pluginDir = join(
      registryDir,
      'cache',
      'oh-my-droid',
      'oh-my-droid',
      'fixture-install'
    );
    mkdirSync(join(pluginDir, 'bridge'), { recursive: true });
    mkdirSync(registryDir, { recursive: true });
    writeFileSync(join(pluginDir, 'bridge', 'hud.cjs'), 'console.log("fixture HUD");\n');
    writeFileSync(
      join(registryDir, 'installed_plugins.json'),
      JSON.stringify({
        plugins: {
          'oh-my-droid@oh-my-droid': [{ scope: 'user', installPath: pluginDir }],
        },
      })
    );

    expect(setupAndRunHud().trim()).toBe('fixture HUD');
  });

  it('ignores a project registry that points to an arbitrary HUD bundle', () => {
    const pluginDir = join(projectDir, 'plugin');
    const registryDir = join(projectDir, '.factory', 'plugins');
    const markerPath = join(projectDir, 'project-hud-executed');
    mkdirSync(join(pluginDir, 'bridge'), { recursive: true });
    mkdirSync(registryDir, { recursive: true });
    writeFileSync(
      join(pluginDir, 'bridge', 'hud.cjs'),
      `require("node:fs").writeFileSync(${JSON.stringify(markerPath)}, "executed");\n`
    );
    writeFileSync(
      join(registryDir, 'installed_plugins.json'),
      JSON.stringify({
        plugins: {
          'oh-my-droid@oh-my-droid': [{ scope: 'project', installPath: pluginDir }],
        },
      })
    );

    setupAndRunHud();
    expect(existsSync(markerPath)).toBe(false);
  });

  it('rejects a user install outside the canonical plugin cache', () => {
    const pluginDir = join(projectDir, 'plugin');
    const registryDir = join(homeDir, '.factory', 'plugins');
    const markerPath = join(projectDir, 'escaped-hud-executed');
    mkdirSync(join(pluginDir, 'bridge'), { recursive: true });
    mkdirSync(registryDir, { recursive: true });
    writeFileSync(
      join(pluginDir, 'bridge', 'hud.cjs'),
      `require("node:fs").writeFileSync(${JSON.stringify(markerPath)}, "executed");\n`
    );
    writeFileSync(
      join(registryDir, 'installed_plugins.json'),
      JSON.stringify({
        plugins: {
          'oh-my-droid@oh-my-droid': [{ scope: 'user', installPath: pluginDir }],
        },
      })
    );

    setupAndRunHud();
    expect(existsSync(markerPath)).toBe(false);
  });

  it('rejects a symlinked HUD bundle', () => {
    const registryDir = join(homeDir, '.factory', 'plugins');
    const pluginDir = join(
      registryDir,
      'cache',
      'oh-my-droid',
      'oh-my-droid',
      'fixture-install'
    );
    const markerPath = join(projectDir, 'symlinked-hud-executed');
    const targetPath = join(projectDir, 'hud.cjs');
    mkdirSync(join(pluginDir, 'bridge'), { recursive: true });
    writeFileSync(
      targetPath,
      `require("node:fs").writeFileSync(${JSON.stringify(markerPath)}, "executed");\n`
    );
    symlinkSync(targetPath, join(pluginDir, 'bridge', 'hud.cjs'));
    writeFileSync(
      join(registryDir, 'installed_plugins.json'),
      JSON.stringify({
        plugins: {
          'oh-my-droid@oh-my-droid': [{ scope: 'user', installPath: pluginDir }],
        },
      })
    );

    setupAndRunHud();
    expect(existsSync(markerPath)).toBe(false);
  });

  it('ships a self-contained HUD bundle', () => {
    const transcriptPath = join(projectDir, 'transcript.jsonl');
    const bundlePath = join(projectDir, 'plugin', 'bridge', 'hud.cjs');
    mkdirSync(join(projectDir, 'plugin', 'bridge'), { recursive: true });
    copyFileSync(join(process.cwd(), 'bridge', 'hud.cjs'), bundlePath);
    writeFileSync(transcriptPath, '');

    const result = spawnSync('node', [bundlePath], {
      cwd: projectDir,
      env: { ...process.env, HOME: homeDir, NODE_PATH: '' },
      input: JSON.stringify({
        transcript_path: transcriptPath,
        cwd: projectDir,
        model: { id: 'test-model', display_name: 'Test Model' },
        context_window: { context_window_size: 200000, used_percentage: 0 },
      }),
      encoding: 'utf8',
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(existsSync(join(projectDir, 'plugin', 'dist'))).toBe(false);
    expect(existsSync(join(projectDir, 'plugin', 'node_modules'))).toBe(false);
    expect(result.stdout.trim()).not.toBe('');
    expect(result.stdout).not.toContain('run /omd-setup to install properly');
  });

  it('exports the bundled HUD for npm installs', () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    expect(packageJson.exports['./bridge/hud.cjs']).toBe('./bridge/hud.cjs');
  });
});
