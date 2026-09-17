import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ULTRATHINK_MESSAGE } from '../installer/hooks.js';

/**
 * Factory Droid omits `cwd` for sessions with no project root. Hooks must not
 * fall back to process.cwd(), but user-scope work that needs no project root
 * must still happen.
 */
function runHook(scriptPath: string, input: unknown, home: string): Record<string, unknown> {
  const stdout = execFileSync('node', [scriptPath], {
    input: JSON.stringify(input),
    // os.homedir() reads USERPROFILE on Windows and HOME elsewhere.
    env: { ...process.env, HOME: home, USERPROFILE: home },
    encoding: 'utf8',
  });

  const lastLine = stdout.trim().split(/\r?\n/).pop();
  if (!lastLine) throw new Error('No stdout from hook script');
  return JSON.parse(lastLine) as Record<string, unknown>;
}

describe('hooks handle a missing cwd', () => {
  let homeDir: string;

  beforeEach(() => {
    homeDir = mkdtempSync(join(tmpdir(), 'omd-nocwd-home-'));
  });

  afterEach(() => {
    rmSync(homeDir, { recursive: true, force: true });
  });

  describe('skill-injector', () => {
    function writeUserSkill(name: string, trigger: string): void {
      const dir = join(homeDir, '.agents', 'skills', 'droid-learned', name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, 'SKILL.md'),
        `---\nname: ${name}\ntriggers:\n  - "${trigger}"\n---\n\n# ${name}\n\nbody\n`
      );
    }

    const scriptPath = join(process.cwd(), 'scripts', 'skill-injector.mjs');

    it('still injects user-scope skills when cwd is absent', () => {
      writeUserSkill('widget-deploy', 'deploy widget');

      const output = runHook(
        scriptPath,
        { prompt: 'how do I deploy widget', session_id: 'nocwd_1' },
        homeDir
      );

      expect(output.continue).toBe(true);
      const hookSpecific = output.hookSpecificOutput as Record<string, unknown> | undefined;
      expect(hookSpecific?.hookEventName).toBe('UserPromptSubmit');
      expect(hookSpecific?.additionalContext).toContain('widget-deploy');
    });

    it('returns a bare continue when no user skill matches and cwd is absent', () => {
      writeUserSkill('widget-deploy', 'deploy widget');

      const output = runHook(
        scriptPath,
        { prompt: 'unrelated question about pastry', session_id: 'nocwd_2' },
        homeDir
      );

      expect(output.continue).toBe(true);
      expect(output.hookSpecificOutput).toBeUndefined();
    });
  });

  describe('keyword-detector', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'keyword-detector.mjs');
    const globalState = (name: string): string =>
      join(homeDir, '.omd', 'state', `${name}-state.json`);

    it('writes global mode state even without a project root', () => {
      runHook(scriptPath, { prompt: 'ultrawork on this', session_id: 'kd_1' }, homeDir);

      expect(existsSync(globalState('ultrawork'))).toBe(true);
    });

    it('clears global mode state on cancel even without a project root', () => {
      mkdirSync(join(homeDir, '.omd', 'state'), { recursive: true });
      writeFileSync(globalState('ultrawork'), JSON.stringify({ active: true }));

      runHook(scriptPath, { prompt: 'cancelomd', session_id: 'kd_2' }, homeDir);

      expect(existsSync(globalState('ultrawork'))).toBe(false);
    });

    describe.each(['scripts', 'templates/hooks'])('%s reasoning guidance', location => {
      const keywordScript = join(process.cwd(), location, 'keyword-detector.mjs');

      it.each(['ultrathink', 'think hard', 'think deeply'])('keeps %s as additionalContext, not model/message mutation', keyword => {
        const output = runHook(keywordScript, {
          prompt: `${keyword} about this`, session_id: 'reasoning', model: 'inherit',
          message: { model: 'inherit', content: [{ type: 'text', text: 'original' }] },
        }, homeDir);
        expect(output).toEqual({
          continue: true,
          hookSpecificOutput: {
            hookEventName: 'UserPromptSubmit',
            additionalContext: expect.stringContaining('<reasoning-guidance>'),
          },
        });
        const guidance = (output.hookSpecificOutput as { additionalContext: string }).additionalContext;
        expect(guidance).toContain('does not change the model or configured reasoning effort');
        expect(guidance).not.toContain('<think-mode>');
        expect(guidance.replace(/\s+/g, ' ').trim()).toBe(ULTRATHINK_MESSAGE.replace(/\s+/g, ' ').trim());
        expect(existsSync(globalState('ultrathink'))).toBe(false);
      });

      it('ignores code and keeps cancellation ahead of reasoning guidance', () => {
        expect(runHook(keywordScript, { prompt: '`ultrathink`' }, homeDir)).toEqual({ continue: true });
        const output = runHook(keywordScript, { prompt: 'cancelomd ultrathink' }, homeDir);
        const guidance = (output.hookSpecificOutput as { additionalContext: string }).additionalContext;
        expect(guidance).toContain('Skill: cancel');
        expect(guidance).not.toContain('<reasoning-guidance>');
      });

      it('combines guidance with existing skill priority', () => {
        const output = runHook(keywordScript, { prompt: 'ultrathink research tdd' }, homeDir);
        const guidance = (output.hookSpecificOutput as { additionalContext: string }).additionalContext;
        expect(guidance).toContain('<reasoning-guidance>');
        expect(guidance).toContain('Skill: tdd');
        expect(guidance).toContain('Skill: research');
        expect(guidance.indexOf('Skill: tdd')).toBeLessThan(guidance.indexOf('Skill: research'));
        expect(guidance).not.toContain('Skill: ultrathink');
      });
    });
  });
});
