import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PreToolUsePermissionInput {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  hook_event_name?: 'PreToolUse' | string;
  tool_name?: string;
  tool_input?: {
    command?: string;
    [key: string]: unknown;
  };
  tool_use_id?: string;
}

// Legacy alias for backwards compatibility in tests/callers
export type PermissionRequestInput = PreToolUsePermissionInput;

export interface HookOutput {
  continue: boolean;
  hookSpecificOutput?: {
    hookEventName: string;
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
  };
}

const SAFE_PATTERNS = [
  /^git (status|diff|log|branch|show)/,
  /^ls( |$)/,
];

// Shell metacharacters that enable command chaining and injection
// See GitHub Issue #146 for full list of dangerous characters
// Note: Quotes ("') intentionally excluded - they're needed for paths with spaces
// and command substitution is already caught by $ detection
const DANGEROUS_SHELL_CHARS = /[;&|`$()<>\n\r\t\0\\{}\[\]*?~!#]/;

/**
 * Check if auto-approval of safe commands is enabled in user config.
 * Configured in ~/.factory/.omd-config.json under "autoApproveSafeCommands".
 * Default: false (opt-in for security).
 */
export function isAutoApproveEnabled(customHome?: string): boolean {
  try {
    const baseDir = customHome || process.env.FACTORY_HOME || os.homedir();
    const configPath = path.join(baseDir, '.factory', '.omd-config.json');
    if (!fs.existsSync(configPath)) {
      return false;
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.autoApproveSafeCommands === true;
  } catch {
    return false;
  }
}

/**
 * Check if a command matches safe patterns
 */
export function isSafeCommand(command: string): boolean {
  const trimmed = command.trim();

  // SECURITY: Reject ANY command with shell metacharacters
  // These allow command chaining that bypasses safe pattern checks
  if (DANGEROUS_SHELL_CHARS.test(trimmed)) {
    return false;
  }

  return SAFE_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Helper to construct a typed permission decision output
 */
export function createPermissionDecision(
  permissionDecision: 'allow' | 'deny' | 'ask',
  permissionDecisionReason?: string
): HookOutput {
  return {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision,
      permissionDecisionReason: permissionDecisionReason || 'Safe read-only command',
    },
  };
}

/**
 * Process permission check on PreToolUse for Execute tool
 */
export function processPermissionRequest(input: PreToolUsePermissionInput, customHome?: string): HookOutput {
  // Only process Execute tool for command auto-approval
  if (input.tool_name !== 'Execute') {
    return { continue: true };
  }

  // Auto-approve is opt-in and disabled by default
  if (!isAutoApproveEnabled(customHome)) {
    return { continue: true };
  }

  const command = input.tool_input?.command;
  if (!command || typeof command !== 'string') {
    return { continue: true };
  }

  // Auto-allow safe commands
  if (isSafeCommand(command)) {
    return createPermissionDecision('allow', 'Safe read-only command');
  }

  // Default: let normal permission prompt handle it
  return { continue: true };
}

/**
 * Main hook entry point
 */
export async function handlePermissionRequest(input: PreToolUsePermissionInput, customHome?: string): Promise<HookOutput> {
  return processPermissionRequest(input, customHome);
}
