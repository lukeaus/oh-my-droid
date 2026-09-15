import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  processSessionEnd,
  recordSessionMetrics,
  cleanupTransientState,
  cleanupModeStates,
  type SessionEndInput,
} from '../index.js';

describe('session-end', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-session-end-test-'));
    fs.mkdirSync(path.join(tempDir, '.omd', 'state'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('records metrics and persists session summary', () => {
    const input: SessionEndInput = {
      session_id: 'sess-abc',
      cwd: tempDir,
      hook_event_name: 'SessionEnd',
      reason: 'clear',
    };

    const output = processSessionEnd(input);
    expect(output.continue).toBe(true);

    const sessionFile = path.join(tempDir, '.omd', 'sessions', 'sess-abc.json');
    expect(fs.existsSync(sessionFile)).toBe(true);
    const content = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    expect(content.session_id).toBe('sess-abc');
    expect(content.reason).toBe('clear');
  });

  it('cleans up active mode states on session end', () => {
    const statePath = path.join(tempDir, '.omd', 'state', 'autopilot-state.json');
    fs.writeFileSync(statePath, JSON.stringify({ active: true }));

    const markerPath = path.join(tempDir, '.omd', 'state', 'swarm-active.marker');
    fs.writeFileSync(markerPath, 'active');

    expect(fs.existsSync(statePath)).toBe(true);
    expect(fs.existsSync(markerPath)).toBe(true);

    const result = cleanupModeStates(tempDir);
    expect(result.filesRemoved).toBe(2);
    expect(fs.existsSync(statePath)).toBe(false);
    expect(fs.existsSync(markerPath)).toBe(false);
  });
});
