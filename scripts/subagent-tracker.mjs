#!/usr/bin/env node
import { runHook } from './lib/hook-runtime.mjs';

const action = process.argv[2]; // 'start' or 'stop'

await runHook('subagent-tracker', (runtime, data) => {
  if (action === 'start') return runtime.processSubagentStart(data);
  if (action === 'stop') return runtime.processSubagentStop(data);
  throw new Error(`Unknown action: ${action}`);
});
