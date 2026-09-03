/**
 * Pinned Factory Droid Hook Contract Constants
 *
 * Verified against: https://docs.factory.ai/harness/hooks.md
 * Verification date: 2026-09-03 (Factory Droid 0.210.0)
 */

/**
 * All official hook lifecycle events supported by Factory Droid.
 */
export const DOCUMENTED_HOOK_EVENTS = [
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'Stop',
  'SubagentStop',
  'PreCompact',
  'Notification',
] as const;

export type DocumentedHookEvent = (typeof DOCUMENTED_HOOK_EVENTS)[number];

/**
 * Documented events that are currently unused by oh-my-droid.
 */
export const DOCUMENTED_UNUSED_EVENTS = [
  'Notification',
] as const;

/**
 * Common tool matchers documented by Factory Droid.
 * Matchers may also be '*' or regex patterns (e.g. 'mcp__.*', 'Create|Edit|ApplyPatch').
 */
export const DOCUMENTED_TOOL_MATCHERS = [
  'Execute',
  'Read',
  'Edit',
  'Create',
  'ApplyPatch',
  'LS',
  'Glob',
  'Grep',
  'Task',
  'FetchUrl',
  'WebSearch',
] as const;

export type DocumentedToolMatcher = (typeof DOCUMENTED_TOOL_MATCHERS)[number];

/**
 * Check if an event name is officially supported by Factory Droid.
 */
export function isDocumentedHookEvent(event: string): event is DocumentedHookEvent {
  return (DOCUMENTED_HOOK_EVENTS as readonly string[]).includes(event);
}
