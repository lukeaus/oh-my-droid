#!/usr/bin/env node
import { runHook } from './lib/hook-runtime.mjs';

await runHook('session-end', (runtime, data) => runtime.processSessionEnd(data));
