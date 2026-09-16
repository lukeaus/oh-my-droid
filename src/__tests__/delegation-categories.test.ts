import { describe, expect, expectTypeOf, it } from 'vitest';
import { getCategoryForTask, getCategoryReasoningEffort, resolveCategory } from '../features/delegation-categories/index.js';
import type { ReasoningEffort } from '../shared/types.js';
import type { FullAgentConfig } from '../droids/types.js';

describe('category reasoning effort metadata', () => {
  it.each([
    ['visual-engineering', 'high'],
    ['ultrabrain', 'max'],
    ['artistry', 'medium'],
    ['quick', 'low'],
    ['writing', 'medium'],
    ['unspecified-low', 'low'],
    ['unspecified-high', 'high'],
  ] as const)('preserves %s effort as %s without a token budget', (category, effort) => {
    expect(getCategoryReasoningEffort(category)).toBe(effort);
    const resolved = resolveCategory(category);
    expect(resolved.reasoningEffort).toBe(effort);
    expect(resolved).not.toHaveProperty('thinkingBudget');
    expect(getCategoryForTask({ taskPrompt: 'Task', explicitCategory: category })).toEqual(resolved);
  });

  it('shares model-dependent effort values with agent metadata', () => {
    expectTypeOf<ReasoningEffort>().toEqualTypeOf<'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'>();
    expectTypeOf<FullAgentConfig['reasoningEffort']>().toEqualTypeOf<ReasoningEffort | undefined>();
  });
});
