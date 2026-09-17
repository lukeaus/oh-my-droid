/**
 * Boulder State Module
 *
 * Manages the active work plan state for OMD orchestrator.
 * Named after the persistent boulder - the eternal task that must be rolled.
 *
 */

// Types
export type {
  BoulderState,
  PlanProgress,
  PlanSummary
} from './types.js';

// Constants
export {
  BOULDER_DIR,
  BOULDER_FILE,
  BOULDER_STATE_PATH,
  NOTEPAD_DIR,
  NOTEPAD_BASE_PATH,
  PLANNER_PLANS_DIR,
  PLAN_EXTENSION
} from './constants.js';

// Storage operations
export {
  getBoulderFilePath,
  readBoulderState,
  writeBoulderState,
  appendSessionId,
  clearBoulderState,
  findPlannerPlans,
  getPlanProgress,
  getPlanName,
  createBoulderState,
  getPlanSummaries,
  hasBoulder,
  getActivePlanPath
} from './storage.js';
