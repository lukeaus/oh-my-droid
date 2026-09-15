import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  processSubagentStop,
  readTrackingState,
  getTrackingStats,
  type SubagentStopInput,
} from '../index.js';

describe('subagent-tracker', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-subagent-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('records successful SubagentStop event', () => {
    const input: SubagentStopInput = {
      session_id: 'session-123',
      cwd: tempDir,
      hook_event_name: 'SubagentStop',
      task_name: 'Task explore codebase',
      task_result: 'Found all necessary files',
    };

    const output = processSubagentStop(input);
    expect(output.continue).toBe(true);
    expect(output.hookSpecificOutput?.hookEventName).toBe('SubagentStop');

    const state = readTrackingState(tempDir);
    expect(state.total_spawned).toBe(1);
    expect(state.total_completed).toBe(1);
    expect(state.total_failed).toBe(0);
    expect(state.agents[0].agent_id).toBe('session-123:Task explore codebase');
    expect(state.agents[0].status).toBe('completed');
    expect(state.agents[0].output_summary).toBe('Found all necessary files');
  });

  it('records failed SubagentStop event when task_error is present', () => {
    const input: SubagentStopInput = {
      session_id: 'session-123',
      cwd: tempDir,
      hook_event_name: 'SubagentStop',
      task_name: 'Task run build',
      task_error: 'Command exited with code 1',
    };

    const output = processSubagentStop(input);
    expect(output.continue).toBe(true);

    const state = readTrackingState(tempDir);
    expect(state.total_spawned).toBe(1);
    expect(state.total_completed).toBe(0);
    expect(state.total_failed).toBe(1);
    expect(state.agents[0].status).toBe('failed');
    expect(state.agents[0].output_summary).toBe('Command exited with code 1');
  });

  it('updates existing agent entry if already tracked without inflating counters', () => {
    const input1: SubagentStopInput = {
      session_id: 'session-1',
      cwd: tempDir,
      task_name: 'task-a',
      task_result: 'partial',
    };
    processSubagentStop(input1);

    const input2: SubagentStopInput = {
      session_id: 'session-1',
      cwd: tempDir,
      task_name: 'task-a',
      task_result: 'done',
    };
    processSubagentStop(input2);

    const state = readTrackingState(tempDir);
    expect(state.agents.length).toBe(1);
    expect(state.agents[0].output_summary).toBe('done');
    // Duplicate stops must not double-count: spawned == completed still holds
    expect(state.total_spawned).toBe(1);
    expect(state.total_completed).toBe(1);
    expect(state.total_failed).toBe(0);
    expect(state.total_completed + state.total_failed).toBe(state.total_spawned);
  });

  it('does not count a completed task in both totals when it later reports an error', () => {
    processSubagentStop({
      session_id: 'session-1',
      cwd: tempDir,
      task_name: 'task-b',
      task_result: 'ok',
    });
    processSubagentStop({
      session_id: 'session-1',
      cwd: tempDir,
      task_name: 'task-b',
      task_error: 'late failure',
    });

    const state = readTrackingState(tempDir);
    expect(state.agents.length).toBe(1);
    expect(state.agents[0].status).toBe('failed');
    expect(state.total_spawned).toBe(1);
    expect(state.total_completed + state.total_failed).toBe(state.total_spawned);
  });

  it('provides tracking stats', () => {
    processSubagentStop({
      session_id: 's1',
      cwd: tempDir,
      task_name: 'task-1',
      task_result: 'ok',
    });
    processSubagentStop({
      session_id: 's1',
      cwd: tempDir,
      task_name: 'task-2',
      task_error: 'fail',
    });

    const stats = getTrackingStats(tempDir);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.total).toBe(2);
  });
});
