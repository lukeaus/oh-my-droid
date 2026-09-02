#!/usr/bin/env node
import { runHook } from './lib/hook-runtime.mjs';

await runHook('pre-compact', (runtime, data) => runtime.processPreCompact(data));
