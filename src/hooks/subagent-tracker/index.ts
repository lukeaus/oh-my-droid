/**
 * Subagent Tracker Hook Module
 *
 * Tracks SubagentStop events for comprehensive agent monitoring.
 * Features:
 * - Records subagent task completion / failure
 * - Truncates output summaries
 * - Manages ring buffer of completed subagent history
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface SubagentInfo {
  agent_id: string;
  agent_type: string;
  started_at: string;
  parent_mode: string;
  task_description?: string;
  file_ownership?: string[];
  status: 'running' | 'completed' | 'failed';
  completed_at?: string;
  duration_ms?: number;
  output_summary?: string;
}

export interface SubagentTrackingState {
  agents: SubagentInfo[];
  total_spawned: number;
  total_completed: number;
  total_failed: number;
  last_updated: string;
}

export interface SubagentStopInput {
  session_id: string;
  transcript_path?: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name?: 'SubagentStop';
  task_name: string;
  task_result?: string;
  task_error?: string;
  stop_hook_active?: boolean;
}

export interface HookOutput {
  continue: boolean;
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext?: string;
    agent_count?: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

const STATE_FILE = 'subagent-tracking.json';
const MAX_COMPLETED_AGENTS = 100;
const LOCK_TIMEOUT_MS = 5000; // 5 second lock timeout
const LOCK_RETRY_MS = 50; // Retry every 50ms

/**
 * Synchronous sleep using Atomics.wait
 * Avoids CPU-spinning busy-wait loops
 */
function syncSleep(ms: number): void {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Acquire file lock with timeout and stale lock detection
 */
function acquireLock(directory: string): boolean {
  const lockPath = join(directory, '.omd', 'state', 'subagent-tracker.lock');
  const lockDir = join(directory, '.omd', 'state');

  if (!existsSync(lockDir)) {
    mkdirSync(lockDir, { recursive: true });
  }

  const startTime = Date.now();

  while (Date.now() - startTime < LOCK_TIMEOUT_MS) {
    try {
      // Check for stale lock (older than timeout)
      if (existsSync(lockPath)) {
        const lockContent = readFileSync(lockPath, 'utf-8');
        const lockTime = parseInt(lockContent, 10);
        if (Date.now() - lockTime > LOCK_TIMEOUT_MS) {
          // Stale lock, remove it
          try { unlinkSync(lockPath); } catch { /* ignore */ }
        } else {
          // Lock is held, wait and retry
          syncSleep(LOCK_RETRY_MS);
          continue;
        }
      }

      // Try to create lock atomically
      writeFileSync(lockPath, String(Date.now()), { flag: 'wx' });
      return true;
    } catch (e: any) {
      if (e.code === 'EEXIST') {
        // Lock exists, retry
        syncSleep(LOCK_RETRY_MS);
        continue;
      }
      return false;
    }
  }

  return false; // Timeout
}

/**
 * Release file lock
 */
function releaseLock(directory: string): void {
  const lockPath = join(directory, '.omd', 'state', 'subagent-tracker.lock');
  try {
    unlinkSync(lockPath);
  } catch {
    // Ignore errors
  }
}

/**
 * Get the state file path
 */
export function getStateFilePath(directory: string): string {
  const stateDir = join(directory, '.omd', 'state');
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }
  return join(stateDir, STATE_FILE);
}

/**
 * Read tracking state from file
 */
export function readTrackingState(directory: string): SubagentTrackingState {
  const statePath = getStateFilePath(directory);

  if (!existsSync(statePath)) {
    return {
      agents: [],
      total_spawned: 0,
      total_completed: 0,
      total_failed: 0,
      last_updated: new Date().toISOString(),
    };
  }

  try {
    const content = readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[SubagentTracker] Error reading state:', error);
    return {
      agents: [],
      total_spawned: 0,
      total_completed: 0,
      total_failed: 0,
      last_updated: new Date().toISOString(),
    };
  }
}

/**
 * Write tracking state to file
 */
export function writeTrackingState(directory: string, state: SubagentTrackingState): void {
  const statePath = getStateFilePath(directory);
  state.last_updated = new Date().toISOString();

  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('[SubagentTracker] Error writing state:', error);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect the current parent mode from state files
 */
function detectParentMode(directory: string): string {
  const stateDir = join(directory, '.omd', 'state');

  if (!existsSync(stateDir)) {
    return 'none';
  }

  // Check in order of specificity
  const modeFiles = [
    { file: 'ultrapilot-state.json', mode: 'ultrapilot' },
    { file: 'autopilot-state.json', mode: 'autopilot' },
    { file: 'swarm-state.json', mode: 'swarm' },
    { file: 'ultrawork-state.json', mode: 'ultrawork' },
    { file: 'ralph-state.json', mode: 'ralph' },
  ];

  for (const { file, mode } of modeFiles) {
    const filePath = join(stateDir, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const state = JSON.parse(content);
        if (state.active === true || state.status === 'running' || state.status === 'active') {
          return mode;
        }
      } catch {
        continue;
      }
    }
  }

  return 'none';
}

// ============================================================================
// Hook Processors
// ============================================================================

/**
 * Process SubagentStop event
 */
export function processSubagentStop(input: SubagentStopInput): HookOutput {
  if (!acquireLock(input.cwd)) {
    return { continue: true }; // Fail gracefully
  }

  try {
    const state = readTrackingState(input.cwd);
    const agentKey = `${input.session_id}:${input.task_name}`;
    const now = new Date().toISOString();
    const isFailed = Boolean(input.task_error);
    const status = isFailed ? 'failed' : 'completed';

    const outputSummary = input.task_result
      ? input.task_result.substring(0, 500)
      : input.task_error
      ? input.task_error.substring(0, 500)
      : undefined;

    const agentIndex = state.agents.findIndex((a) => a.agent_id === agentKey);

    if (agentIndex !== -1) {
      const agent = state.agents[agentIndex];
      agent.status = status;
      agent.completed_at = now;
      if (outputSummary) {
        agent.output_summary = outputSummary;
      }
      // Counter was already incremented on the insert path; do not re-increment
      // on duplicate stops or total_completed/total_failed would exceed total_spawned.
    } else {
      const parentMode = detectParentMode(input.cwd);

      const agentInfo: SubagentInfo = {
        agent_id: agentKey,
        agent_type: 'Task',
        started_at: now,
        parent_mode: parentMode,
        task_description: input.task_name ? input.task_name.substring(0, 200) : undefined,
        status,
        completed_at: now,
        output_summary: outputSummary,
      };

      state.agents.push(agentInfo);
      state.total_spawned++;

      if (isFailed) {
        state.total_failed++;
      } else {
        state.total_completed++;
      }
    }

    // Evict oldest completed agents if over limit
    const completedAgents = state.agents.filter(a => a.status === 'completed' || a.status === 'failed');
    if (completedAgents.length > MAX_COMPLETED_AGENTS) {
      completedAgents.sort((a, b) => {
        const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return timeB - timeA; // Newest first
      });

      const toRemove = new Set(completedAgents.slice(MAX_COMPLETED_AGENTS).map(a => a.agent_id));
      state.agents = state.agents.filter(a => !toRemove.has(a.agent_id));
    }

    // Write updated state
    writeTrackingState(input.cwd, state);

    return {
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'SubagentStop',
        additionalContext: `Subagent ${input.task_name} ${status}`,
        agent_count: state.agents.filter((a) => a.status === 'running').length,
      },
    };
  } finally {
    releaseLock(input.cwd);
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get count of active (running) agents
 */
export function getActiveAgentCount(directory: string): number {
  const state = readTrackingState(directory);
  return state.agents.filter((a) => a.status === 'running').length;
}

/**
 * Get agents by type
 */
export function getAgentsByType(directory: string, agentType: string): SubagentInfo[] {
  const state = readTrackingState(directory);
  return state.agents.filter((a) => a.agent_type === agentType);
}

/**
 * Get all running agents
 */
export function getRunningAgents(directory: string): SubagentInfo[] {
  const state = readTrackingState(directory);
  return state.agents.filter((a) => a.status === 'running');
}

/**
 * Get tracking stats
 */
export function getTrackingStats(directory: string): {
  running: number;
  completed: number;
  failed: number;
  total: number;
} {
  const state = readTrackingState(directory);
  return {
    running: state.agents.filter((a) => a.status === 'running').length,
    completed: state.total_completed,
    failed: state.total_failed,
    total: state.total_spawned,
  };
}

// ============================================================================
// Main Entry Points
// ============================================================================

/**
 * Handle SubagentStop hook
 */
export async function handleSubagentStop(input: SubagentStopInput): Promise<HookOutput> {
  return processSubagentStop(input);
}

/**
 * Clear all tracking state (for testing or cleanup)
 */
export function clearTrackingState(directory: string): void {
  const statePath = getStateFilePath(directory);
  if (existsSync(statePath)) {
    try {
      unlinkSync(statePath);
    } catch (error) {
      console.error('[SubagentTracker] Error clearing state:', error);
    }
  }
}
