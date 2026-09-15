import { spawn } from 'child_process';

export interface TokscaleLaunchOptions {
  light?: boolean;
  droid?: boolean; // Default true for OMC
}

/**
 * Check if tokscale CLI is available via bunx
 */
export async function isTokscaleCLIAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('bunx', ['tokscale@latest', '--version'], {
      stdio: 'ignore'
    });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * Launch tokscale interactive TUI
 */
export async function launchTokscaleTUI(options: TokscaleLaunchOptions = {}): Promise<void> {
  const args = ['tokscale@latest'];

  // Explicit `tui` subcommand: bare tokscale falls back to a static report
  // when stdout is not a TTY. --light only exists at top level (not on `tui`).
  if (!options.light) {
    args.push('tui');
  }

  // Filter by droid client for OMC unless explicitly disabled
  if (options.droid !== false) {
    args.push('-c', 'droid');
  }

  if (options.light) {
    args.push('--light');
  }

  const proc = spawn('bunx', args, {
    stdio: 'inherit'
  });

  return new Promise((resolve, reject) => {
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tokscale exited with code ${code}`));
      }
    });
    proc.on('error', (err) => {
      reject(new Error(`Failed to launch tokscale: ${err.message}`));
    });
  });
}

/**
 * Get installation instructions for tokscale
 */
export function getInstallInstructions(): string {
  return `
To use the interactive TUI, install tokscale:

  bun install -g tokscale
  # or
  bunx tokscale@latest

Learn more: https://github.com/junhoyeo/tokscale
`;
}
