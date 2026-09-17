import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DEFAULT_HUD_CONFIG, PRESET_CONFIGS } from '../../hud/types.js';
import { applyPreset, readHudConfig, writeHudConfig } from '../../hud/state.js';

describe('HUD Default Configuration', () => {
  it('does not expose OAuth rate limits in defaults or presets', () => {
    for (const elements of [DEFAULT_HUD_CONFIG.elements, ...Object.values(PRESET_CONFIGS)]) {
      expect(elements).not.toHaveProperty('rateLimits');
    }
  });

  describe('DEFAULT_HUD_CONFIG', () => {
    it('should have cwd disabled by default for backward compatibility', () => {
      expect(DEFAULT_HUD_CONFIG.elements.cwd).toBe(false);
    });

    it('should use text format for reasoning indicator by default', () => {
      expect(DEFAULT_HUD_CONFIG.elements.reasoningFormat).toBe('text');
    });
  });

  describe('PRESET_CONFIGS', () => {
    const presets = ['minimal', 'analytics', 'focused', 'full', 'dense'] as const;

    presets.forEach(preset => {
      it(`${preset} preset should use text reasoningFormat`, () => {
        expect(PRESET_CONFIGS[preset].reasoningFormat).toBe('text');
      });
    });
  });
});

describe('saved HUD reasoning preferences', () => {
  let directory: string;
  let configPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'omd-hud-config-'));
    vi.stubEnv('HOME', directory);
    vi.stubEnv('USERPROFILE', directory);
    const configDir = join(directory, '.factory', '.omd');
    mkdirSync(configDir, { recursive: true });
    configPath = join(configDir, 'hud-config.json');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
  });

  it.each([
    { saved: {}, reasoning: true, format: 'text' },
    { saved: { thinking: false, thinkingFormat: 'bubble' }, reasoning: false, format: 'bubble' },
    { saved: { thinking: true, thinkingFormat: 'face' }, reasoning: true, format: 'face' },
    { saved: { reasoning: false, reasoningFormat: 'brain' }, reasoning: false, format: 'brain' },
    { saved: { thinking: true, reasoning: false, thinkingFormat: 'brain', reasoningFormat: 'text' }, reasoning: false, format: 'text' },
    { saved: { thinking: false, reasoning: true, thinkingFormat: 'text', reasoningFormat: 'face' }, reasoning: true, format: 'face' },
  ])('normalizes $saved to canonical keys, preferring explicit new values', ({ saved, reasoning, format }) => {
    writeFileSync(configPath, JSON.stringify({ elements: { ...saved, cwd: true } }));
    const config = readHudConfig();
    expect(config.elements.reasoning).toBe(reasoning);
    expect(config.elements.reasoningFormat).toBe(format);
    expect(config.elements.cwd).toBe(true);
    expect(config.elements).not.toHaveProperty('thinking');
    expect(config.elements).not.toHaveProperty('thinkingFormat');
    expect(writeHudConfig(config)).toBe(true);
    expect(JSON.parse(readFileSync(configPath, 'utf8')).elements).toEqual(config.elements);
  });

  it('uses defaults for missing or malformed config files', () => {
    expect(readHudConfig()).toEqual(DEFAULT_HUD_CONFIG);
    writeFileSync(configPath, '{');
    expect(readHudConfig()).toEqual(DEFAULT_HUD_CONFIG);
  });

  it('falls back to the default preset for retired saved presets', () => {
    writeFileSync(configPath, JSON.stringify({ preset: 'opencode' }));
    expect(readHudConfig().preset).toBe(DEFAULT_HUD_CONFIG.preset);
  });

  it('coerces retired presets to the default instead of persisting them', () => {
    const config = applyPreset('opencode' as never);
    expect(config.preset).toBe(DEFAULT_HUD_CONFIG.preset);
    expect(readHudConfig().preset).toBe(DEFAULT_HUD_CONFIG.preset);
  });
});
