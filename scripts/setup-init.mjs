#!/usr/bin/env node
import { runHook } from './lib/hook-runtime.mjs';

await runHook('setup-init', (runtime, data) => runtime.processSetupInit(data), 'setup');
