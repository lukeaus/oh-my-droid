#!/usr/bin/env node
import { runHook } from './lib/hook-runtime.mjs';

await runHook(
  'setup-maintenance',
  (runtime, data) => runtime.processSetupMaintenance(data),
  'setup'
);
