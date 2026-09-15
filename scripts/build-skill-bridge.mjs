#!/usr/bin/env node
/**
 * Build script for skill-bridge.cjs bundle
 * Bundles the TypeScript learner bridge module into a standalone CJS file
 * that skill-injector.mjs can require()
 */

import * as esbuild from 'esbuild';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

// Output to bridge/ (tracked) so skill-injector.mjs keeps its persistent
// cross-process cache on tracked-only installs, where dist/ never ships.
const outfile = 'bridge/skill-bridge.cjs';

// Ensure output directory exists
await mkdir(dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: ['src/hooks/learner/bridge.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile,
  // Externalize Node.js built-ins (they're available at runtime)
  external: [
    'fs', 'path', 'os', 'util', 'stream', 'events',
    'buffer', 'crypto', 'http', 'https', 'url',
    'child_process', 'assert', 'module'
  ],
});

console.log(`Built ${outfile}`);
