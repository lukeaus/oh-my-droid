#!/usr/bin/env node
import { runHook } from './lib/hook-runtime.mjs';

await runHook('permission-handler', (runtime, data) =>
  runtime.processPermissionRequest(data)
);
