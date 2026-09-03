/**
 * Setup Utilities Module
 *
 * State maintenance helpers consumed by the SessionEnd hook
 * (see src/hooks/session-end/index.ts).
 * Functions:
 * - pruneOldStateFiles: Prune old state files
 * - vacuumSwarmDb: Vacuum swarm SQLite database
 */

import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STATE_MAX_AGE_DAYS = 7;

// ============================================================================
// Maintenance Functions
// ============================================================================

/**
 * Prune old state files from .omd/state directory
 */
export function pruneOldStateFiles(directory: string, maxAgeDays: number = DEFAULT_STATE_MAX_AGE_DAYS): number {
  const stateDir = join(directory, '.omd/state');
  if (!existsSync(stateDir)) {
    return 0;
  }

  const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  try {
    const files = readdirSync(stateDir);

    for (const file of files) {
      const filePath = join(stateDir, file);

      try {
        const stats = statSync(filePath);

        // Skip directories
        if (stats.isDirectory()) {
          continue;
        }

        // Check file age
        if (stats.mtimeMs < cutoffTime) {
          // Skip certain critical state files
          if (
            file === 'autopilot-state.json' ||
            file === 'ultrapilot-state.json' ||
            file === 'ralph-state.json' ||
            file === 'ultrawork-state.json' ||
            file === 'swarm-state.json'
          ) {
            continue;
          }

          unlinkSync(filePath);
          deletedCount++;
        }
      } catch {
        // Skip files we can't read/delete
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return deletedCount;
}

/**
 * Run VACUUM on swarm SQLite database if it exists
 */
export function vacuumSwarmDb(directory: string): boolean {
  const swarmDbPath = join(directory, '.omd/state/swarm.db');

  if (!existsSync(swarmDbPath)) {
    return false; // Database doesn't exist
  }

  try {
    // Check if sqlite3 is available
    execSync('which sqlite3', { stdio: 'pipe' });

    // Run VACUUM
    execSync(`sqlite3 "${swarmDbPath}" "VACUUM;"`, {
      stdio: 'pipe',
      timeout: 5000, // 5 second timeout
    });

    return true;
  } catch {
    // sqlite3 not available or vacuum failed
    return false;
  }
}
