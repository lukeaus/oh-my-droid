import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// @ts-expect-error - .mjs module without type declarations
import { normalizeHookInput, extractResponseText } from '../../scripts/lib/hook-input.mjs';
import { getHookScripts } from '../installer/hooks.js';

describe('hook input normalization', () => {
  it('keeps scripts/lib/hook-input.mjs and templates/hooks/lib/hook-input.mjs byte-identical', () => {
    const scriptLib = readFileSync(
      join(process.cwd(), 'scripts', 'lib', 'hook-input.mjs'),
      'utf-8'
    );
    const templateLib = readFileSync(
      join(process.cwd(), 'templates', 'hooks', 'lib', 'hook-input.mjs'),
      'utf-8'
    );
    expect(scriptLib).toBe(templateLib);
  });

  it('includes lib/hook-input.mjs in installer getHookScripts()', () => {
    const hookScripts = getHookScripts();
    expect(hookScripts['lib/hook-input.mjs']).toBeDefined();
    expect(hookScripts['lib/hook-input.mjs']).toContain('export function normalizeHookInput');
  });

  it('normalizes documented snake_case input fields', () => {
    const input = {
      session_id: 'sess_123',
      cwd: '/path/to/project',
      tool_name: 'Execute',
      tool_input: { command: 'git status' },
      tool_response: { stdout: 'clean', exit_code: 0 },
      hook_event_name: 'PostToolUse',
      prompt: 'run tests',
      source: 'startup',
      reason: 'other',
      task_name: 'task_abc',
      task_result: 'done',
      task_error: 'none',
      stop_hook_active: true,
    };

    const norm = normalizeHookInput(input);
    expect(norm.session_id).toBe('sess_123');
    expect(norm.cwd).toBe('/path/to/project');
    expect(norm.tool_name).toBe('Execute');
    expect(norm.tool_input).toEqual({ command: 'git status' });
    expect(norm.tool_response).toEqual({ stdout: 'clean', exit_code: 0 });
    expect(norm.tool_response_text).toBe('clean');
    expect(norm.hook_event_name).toBe('PostToolUse');
    expect(norm.prompt).toBe('run tests');
    expect(norm.source).toBe('startup');
    expect(norm.reason).toBe('other');
    expect(norm.task_name).toBe('task_abc');
    expect(norm.task_result).toBe('done');
    expect(norm.task_error).toBe('none');
    expect(norm.stop_hook_active).toBe(true);
  });

  it('maps legacy camelCase fields as aliases', () => {
    const input = {
      sessionId: 'sess_456',
      directory: '/legacy/dir',
      toolName: 'proxy_Bash',
      toolInput: { command: 'ls' },
      toolOutput: 'file.txt',
      hookEventName: 'PreToolUse',
      taskName: 'task_xyz',
      taskResult: 'success',
      taskError: 'failed',
      stopHookActive: false,
    };

    const norm = normalizeHookInput(input);
    expect(norm.session_id).toBe('sess_456');
    expect(norm.cwd).toBe('/legacy/dir');
    expect(norm.tool_name).toBe('proxy_Bash');
    expect(norm.tool_input).toEqual({ command: 'ls' });
    expect(norm.tool_response).toBe('file.txt');
    expect(norm.tool_response_text).toBe('file.txt');
    expect(norm.hook_event_name).toBe('PreToolUse');
    expect(norm.task_name).toBe('task_xyz');
    expect(norm.task_result).toBe('success');
    expect(norm.task_error).toBe('failed');
    expect(norm.stop_hook_active).toBe(false);
  });

  it('does NOT default cwd to process.cwd() when absent', () => {
    const norm = normalizeHookInput({});
    expect(norm.cwd).toBeUndefined();
  });

  describe('extractResponseText', () => {
    it('handles string responses', () => {
      expect(extractResponseText('plain text output')).toBe('plain text output');
    });

    it('handles stdout and stderr objects', () => {
      expect(extractResponseText({ stdout: 'success', stderr: 'warning' })).toBe(
        'success\nwarning'
      );
      expect(extractResponseText({ stdout: 'only stdout' })).toBe('only stdout');
      expect(extractResponseText({ stderr: 'only stderr' })).toBe('only stderr');
    });

    it('handles output and content properties', () => {
      expect(extractResponseText({ output: 'tool output text' })).toBe('tool output text');
      expect(extractResponseText({ content: 'content block text' })).toBe('content block text');
    });

    it('handles array responses', () => {
      expect(
        extractResponseText([
          { type: 'text', content: 'line 1' },
          { type: 'text', content: 'line 2' },
        ])
      ).toBe('line 1\nline 2');
    });

    it('handles null and undefined safely', () => {
      expect(extractResponseText(null)).toBe('');
      expect(extractResponseText(undefined)).toBe('');
    });
  });
});
