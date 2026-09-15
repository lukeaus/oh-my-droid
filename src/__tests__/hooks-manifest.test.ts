import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  DOCUMENTED_TOOL_MATCHERS,
  isDocumentedHookEvent,
} from '../hooks/supported-events.js';

describe('hooks.json manifest pinning', () => {
  const manifestPath = join(process.cwd(), 'hooks', 'hooks.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const registeredEvents = Object.keys(manifest.hooks || {});

  it('contains only documented Factory hook events', () => {
    for (const event of registeredEvents) {
      expect(
        isDocumentedHookEvent(event),
        `Event "${event}" in hooks.json is not in the documented Factory hook contract`
      ).toBe(true);
    }
  });

  it('does not register removed or undocumented events', () => {
    const forbiddenEvents = ['Setup', 'PermissionRequest', 'SubagentStart'];
    for (const forbidden of forbiddenEvents) {
      expect(registeredEvents).not.toContain(forbidden);
    }
  });

  it('uses only documented matchers for tool hook groups', () => {
    const toolEvents = ['PreToolUse', 'PostToolUse'];

    for (const eventName of toolEvents) {
      const groups = manifest.hooks[eventName] || [];
      for (const group of groups) {
        const matcher = group.matcher;
        if (!matcher || matcher === '*') continue;

        const subMatchers = matcher.split('|').map((m: string) => m.trim());
        for (const subMatcher of subMatchers) {
          expect(
            (DOCUMENTED_TOOL_MATCHERS as readonly string[]).includes(subMatcher) ||
              subMatcher.startsWith('mcp__'),
            `Matcher "${subMatcher}" under "${eventName}" is not a documented tool matcher`
          ).toBe(true);
        }
      }
    }
  });
});
