/**
 * Background Agent Feature
 *
 * Manages background tasks for the OMD multi-agent system.
 * Provides concurrency control and task state management.
 *
 */

export * from './types.js';
export { BackgroundManager, getBackgroundManager, resetBackgroundManager } from './manager.js';
export { ConcurrencyManager } from './concurrency.js';
