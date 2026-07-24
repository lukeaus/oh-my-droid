import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/**
 * HUD Windows Compatibility Tests
 *
 * These tests verify Windows compatibility fixes for HUD:
 * - File naming (omd-hud.mjs)
 * - Windows dynamic import() requires file:// URLs (pathToFileURL)
 *
 * Related: GitHub Issue #138, PR #139, PR #140
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..', '..');

describe('HUD Windows Compatibility', () => {
  describe('File Naming', () => {
    it('session-start.mjs should reference omd-hud.mjs', () => {
      const sessionStartPath = join(packageRoot, 'scripts', 'session-start.mjs');
      expect(existsSync(sessionStartPath)).toBe(true);

      const content = readFileSync(sessionStartPath, 'utf-8');
      expect(content).toContain('omd-hud.mjs');
      expect(content).not.toContain('sisyphus-hud.mjs');
    });

    it('installer should create omd-hud.mjs', () => {
      const installerPath = join(packageRoot, 'src', 'installer', 'index.ts');
      expect(existsSync(installerPath)).toBe(true);

      const content = readFileSync(installerPath, 'utf-8');
      expect(content).toContain('omd-hud.mjs');
      expect(content).not.toContain('sisyphus-hud.mjs');
    });
  });

  describe('pathToFileURL for Dynamic Import', () => {
    it('installer HUD script should import pathToFileURL', () => {
      const installerPath = join(packageRoot, 'src', 'installer', 'index.ts');
      const content = readFileSync(installerPath, 'utf-8');

      // Should have pathToFileURL import in the generated script
      expect(content).toContain('import { pathToFileURL } from "node:url"');
    });

    it('installer HUD script should use pathToFileURL for dev path import', () => {
      const installerPath = join(packageRoot, 'src', 'installer', 'index.ts');
      const content = readFileSync(installerPath, 'utf-8');

      // Should use pathToFileURL for devPath
      expect(content).toContain('pathToFileURL(devPath).href');
    });

    it('installer HUD script should use pathToFileURL for plugin path import', () => {
      const installerPath = join(packageRoot, 'src', 'installer', 'index.ts');
      const content = readFileSync(installerPath, 'utf-8');

      // Should use pathToFileURL for pluginPath
      expect(content).toContain('pathToFileURL(bundleRealPath).href');
    });

    it('pathToFileURL should correctly convert Unix paths', () => {
      const unixPath = '/home/user/test.js';
      expect(pathToFileURL(unixPath).href).toBe(
        process.platform === 'win32'
          ? 'file:///C:/home/user/test.js'
          : 'file:///home/user/test.js'
      );
    });

    it('pathToFileURL should encode spaces in paths', () => {
      const spacePath = '/path/with spaces/file.js';
      expect(pathToFileURL(spacePath).href).toBe(
        process.platform === 'win32'
          ? 'file:///C:/path/with%20spaces/file.js'
          : 'file:///path/with%20spaces/file.js'
      );
    });
  });
});
