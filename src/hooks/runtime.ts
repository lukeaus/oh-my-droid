/**
 * Hook Runtime Entry Point
 *
 * Bundled to bridge/hooks.cjs so the wrapper scripts in scripts/ have a
 * loadable runtime on tracked-only installs, where dist/ is absent.
 *
 * Deliberately narrow: only the processors whose wrappers need compiled code.
 * The hot-path hooks (PreToolUse/PostToolUse) run on Node built-ins alone and
 * must stay out of this bundle so tool calls don't pay its startup cost.
 */

export { processSessionEnd } from './session-end/index.js';
export { processSubagentStart, processSubagentStop } from './subagent-tracker/index.js';
export { processPreCompact } from './pre-compact/index.js';
export { processPermissionRequest } from './permission-handler/index.js';
export { processSetupInit, processSetupMaintenance } from './setup/index.js';
