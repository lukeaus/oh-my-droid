/**
 * Shared runtime loader for the hook wrapper scripts.
 *
 * bridge/hooks.cjs is tracked, so it is present on git-marketplace installs
 * where dist/ never ships. dist/ is only tried as a fallback for local dev
 * trees that have run `tsc` but not the bundle step.
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

async function loadHookRuntime(label, distModule) {
  try {
    return require('../../bridge/hooks.cjs');
  } catch (bundleError) {
    try {
      return await import(`../../dist/hooks/${distModule}/index.js`);
    } catch {
      // Exit 1, never 2: exit 2 is blocking per the hooks reference, so exit 2
      // here would turn a packaging fault into a hard block on the event.
      console.error(
        `[${label}] Hook runtime unavailable (bridge/hooks.cjs): ${bundleError.message}`
      );
      process.exit(1);
    }
  }
}

async function readStdin() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
}

/**
 * Load the runtime, feed it the stdin payload, and print schema-valid JSON.
 * A missing runtime exits 1; any other fault degrades to `{continue:true}`
 * so a processing bug never blocks the session.
 */
export async function runHook(label, run, distModule = label) {
  const runtime = await loadHookRuntime(label, distModule);

  let result;
  try {
    result = await run(runtime, JSON.parse(await readStdin()));
  } catch (error) {
    console.error(`[${label}] Error:`, error.message);
  }

  console.log(JSON.stringify(result ?? { continue: true }));
}
