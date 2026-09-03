#!/usr/bin/env node
import { runHook } from './lib/hook-runtime.mjs';

const action = process.argv[2]; // optional: 'stop' or omitted

await runHook('subagent-tracker', (runtime, data) => {
  if (!action || action === 'stop') {
    return runtime.processSubagentStop(data);
  }
  throw new Error(`Unknown action: ${action}`);
});
