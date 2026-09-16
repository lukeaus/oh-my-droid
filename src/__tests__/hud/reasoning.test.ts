import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { renderReasoning } from '../../hud/elements/reasoning.js';
import { parseTranscript } from '../../hud/transcript.js';
import { render } from '../../hud/render.js';
import { DEFAULT_HUD_CONFIG, type HudRenderContext, type ReasoningState } from '../../hud/types.js';

describe('renderReasoning', () => {
  const activeState: ReasoningState = { active: true };
  const inactiveState: ReasoningState = { active: false };

  it('returns null for null state', () => {
    expect(renderReasoning(null)).toBeNull();
  });

  it('returns null for inactive state', () => {
    expect(renderReasoning(inactiveState)).toBeNull();
  });

  it('returns styled "reasoning" for text format (default)', () => {
    const result = renderReasoning(activeState);
    expect(result).toContain('reasoning');
    expect(result).toContain('\x1b[36m'); // cyan
  });

  it('returns 💭 for bubble format', () => {
    expect(renderReasoning(activeState, 'bubble')).toBe('💭');
  });

  it('returns 🧠 for brain format', () => {
    expect(renderReasoning(activeState, 'brain')).toBe('🧠');
  });

  it('returns 🤔 for face format', () => {
    expect(renderReasoning(activeState, 'face')).toBe('🤔');
  });

  it('returns styled "reasoning" for explicit text format', () => {
    const result = renderReasoning(activeState, 'text');
    expect(result).toContain('reasoning');
    expect(result).toContain('\x1b[36m'); // cyan
  });
});

describe('reasoning activity from transcripts', () => {
  let directory: string;
  const now = Date.parse('2026-07-24T12:00:00Z');

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'omd-reasoning-'));
    vi.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  });

  it.each(['thinking', 'reasoning'])('reads external %s blocks and expires activity after 30 seconds', async type => {
    const path = join(directory, 'transcript.jsonl');
    for (const age of [0, 30_000, 30_001]) {
      const timestamp = new Date(now - age);
      writeFileSync(path, JSON.stringify({
        timestamp: timestamp.toISOString(),
        message: { content: [{ type }] },
      }) + '\n');

      const transcript = await parseTranscript(path);
      expect(transcript.reasoningState).toEqual({ active: age <= 30_000, lastSeen: timestamp });
      expect(transcript).not.toHaveProperty('thinkingState');

      const context: HudRenderContext = {
        contextPercent: 0, modelName: 'inherit', cwd: directory,
        ralph: null, ultrawork: null, prd: null, autopilot: null, team: null,
        activeAgents: [], todos: [], backgroundTasks: [], lastSkill: null,
        pendingPermission: null, sessionHealth: null,
        reasoningState: transcript.reasoningState ?? null,
      };
      expect((await render(context, DEFAULT_HUD_CONFIG)).includes('reasoning')).toBe(age <= 30_000);
      expect(await render(context, {
        ...DEFAULT_HUD_CONFIG,
        elements: { ...DEFAULT_HUD_CONFIG.elements, reasoning: false },
      })).not.toContain('reasoning');
      expect((await render(context, {
        ...DEFAULT_HUD_CONFIG,
        elements: { ...DEFAULT_HUD_CONFIG.elements, reasoningFormat: 'brain' },
      })).includes('🧠')).toBe(age <= 30_000);
    }
  });

  it('does not infer activity or effort from ordinary text', async () => {
    const path = join(directory, 'transcript.jsonl');
    writeFileSync(path, JSON.stringify({
      message: { content: [{ type: 'text', text: 'ultrathink reasoningEffort: max' }] },
    }) + '\n');
    expect((await parseTranscript(path)).reasoningState).toBeUndefined();
  });
});
