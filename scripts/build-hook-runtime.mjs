#!/usr/bin/env node
/**
 * Build the standalone hook runtime bundle used by tracked-only plugin installs.
 */

import * as esbuild from 'esbuild';
import { mkdir } from 'node:fs/promises';

const outfile = 'bridge/hooks.cjs';

await mkdir('bridge', { recursive: true });
await esbuild.build({
  entryPoints: ['src/hooks/runtime.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile,
});

console.log(`Built ${outfile}`);
