#!/usr/bin/env node

/**
 * PreToolUse Hook: OMD Reminder Enforcer (Node.js)
 * Injects contextual reminders before every tool execution
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { normalizeHookInput } from './lib/hook-input.mjs';

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Get todo status from project and global todos
function getTodoStatus(directory) {
  if (!directory) return '';

  let pending = 0;
  let inProgress = 0;

  // Check project-local todos
  const localPaths = [
    join(directory, '.omd', 'todos.json'),
    join(directory, '.factory', 'todos.json')
  ];

  for (const todoFile of localPaths) {
    if (existsSync(todoFile)) {
      try {
        const content = readFileSync(todoFile, 'utf-8');
        const data = JSON.parse(content);
        const todos = data.todos || data;
        if (Array.isArray(todos)) {
          pending += todos.filter(t => t.status === 'pending').length;
          inProgress += todos.filter(t => t.status === 'in_progress').length;
        }
      } catch {
        // Ignore errors
      }
    }
  }

  // Check global Factory Droid todos directory
  const globalTodosDir = join(homedir(), '.factory', 'todos');
  if (existsSync(globalTodosDir)) {
    try {
      const files = readdirSync(globalTodosDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = readFileSync(join(globalTodosDir, file), 'utf-8');
          const todos = JSON.parse(content);
          if (Array.isArray(todos)) {
            pending += todos.filter(t => t.status === 'pending').length;
            inProgress += todos.filter(t => t.status === 'in_progress').length;
          }
        } catch {
          // Ignore individual file errors
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  if (pending + inProgress > 0) {
    return `[${inProgress} active, ${pending} pending] `;
  }

  return '';
}

// Generate contextual message based on tool type
function generateMessage(toolName, todoStatus) {
  const messages = {
    TodoWrite: `${todoStatus}Mark todos in_progress BEFORE starting, completed IMMEDIATELY after finishing.`,
    Execute: `${todoStatus}Use parallel execution for independent tasks. Use run_in_background for long operations (npm install, builds, tests).`,
    Task: `${todoStatus}Launch multiple agents in parallel when tasks are independent. Use run_in_background for long operations.`,
    Edit: `${todoStatus}Verify changes work after editing. Test functionality before marking complete.`,
    Create: `${todoStatus}Verify changes work after editing. Test functionality before marking complete.`,
    Read: `${todoStatus}Read multiple files in parallel when possible for faster analysis.`,
    Grep: `${todoStatus}Combine searches in parallel when investigating multiple patterns.`,
    Glob: `${todoStatus}Combine searches in parallel when investigating multiple patterns.`,
  };

  return messages[toolName] || `${todoStatus}The boulder never stops. Continue until all tasks complete.`;
}

async function main() {
  try {
    const input = await readStdin();
    const data = normalizeHookInput(input);

    const toolName = data.tool_name || 'unknown';
    const directory = data.cwd;

    const todoStatus = getTodoStatus(directory);
    const message = generateMessage(toolName, todoStatus);

    console.log(JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: message
      }
    }));
  } catch (error) {
    // On error, always continue
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
