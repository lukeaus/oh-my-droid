/**
 * Agent Definitions for Oh-My-Droid
 *
 * This module provides:
 * 1. Re-exports of base agents from individual files
 * 2. Tiered agent variants with dynamically loaded prompts from /droids/*.md
 * 3. getAgentDefinitions() for agent registry
 * 4. omcSystemPrompt for the main orchestrator
 */

import type { AgentConfig, ModelIdentifier } from '../shared/types.js';
import { loadAgentPrompt } from './utils.js';

// Re-export base agents from individual files (rebranded names)
export { architectAgent } from './architect.js';
export { researcherAgent } from './researcher.js';
export { exploreAgent } from './explore.js';
export { designerAgent } from './designer.js';
export { writerAgent } from './writer.js';
export { visionAgent } from './vision.js';
export { criticAgent } from './critic.js';
export { analystAgent } from './analyst.js';
export { executorAgent } from './executor.js';
export { plannerAgent } from './planner.js';
export { qaTesterAgent } from './qa-tester.js';
export { scientistAgent } from './scientist.js';

// Import base agents for use in getAgentDefinitions
import { architectAgent } from './architect.js';
import { researcherAgent } from './researcher.js';
import { exploreAgent } from './explore.js';
import { designerAgent } from './designer.js';
import { writerAgent } from './writer.js';
import { visionAgent } from './vision.js';
import { criticAgent } from './critic.js';
import { analystAgent } from './analyst.js';
import { executorAgent } from './executor.js';
import { plannerAgent } from './planner.js';
import { qaTesterAgent } from './qa-tester.js';
import { scientistAgent } from './scientist.js';

// Re-export loadAgentPrompt (also exported from index.ts)
export { loadAgentPrompt };

function normalizeTools(tools: string[]): string[] {
  const mapped = tools.map((t) => {
    if (t === 'Bash') return 'Execute';
    if (t === 'WebFetch') return 'FetchUrl';
    return t;
  });

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of mapped) {
    if (!seen.has(t)) {
      seen.add(t);
      result.push(t);
    }
  }
  return result;
}

// ============================================================
// TIERED AGENT VARIANTS
// Variants differ by scope and tool envelope, not by model: every droid is
// `inherit`, so the model comes from the user's subagentModelSettings. The
// suffix describes how much of a problem the variant takes on.
// - `-high` / base: broad scope, full tool set
// - `-medium`: cross-module scope
// - `-low`: single-file scope, escalates beyond it
// ============================================================

/**
 * Architect-Medium Agent - Standard Analysis
 */
export const architectMediumAgent: AgentConfig = {
  name: 'architect-medium',
  description: 'Standard debugging, root cause identification, and dependency tracing across modules, read-only. Escalates system-wide architectural change and security-critical analysis to architect.',
  prompt: loadAgentPrompt('architect-medium'),
  tools: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'lsp_diagnostics', 'lsp_diagnostics_directory', 'ast_grep_search'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Architect-Low Agent - Quick Analysis
 */
export const architectLowAgent: AgentConfig = {
  name: 'architect-low',
  description: 'Single-file code questions and symbol lookups, read-only. Escalates cross-file dependency tracing, architecture questions, and root cause analysis to architect.',
  prompt: loadAgentPrompt('architect-low'),
  tools: ['Read', 'Glob', 'Grep', 'lsp_diagnostics'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Executor-High Agent - Complex Execution
 */
export const executorHighAgent: AgentConfig = {
  name: 'executor-high',
  description: 'Multi-file refactoring, cross-cutting bug fixes, and system-wide modifications spanning modules.',
  prompt: loadAgentPrompt('executor-high'),
  tools: ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Bash', 'TodoWrite', 'lsp_diagnostics', 'lsp_diagnostics_directory', 'ast_grep_search', 'ast_grep_replace', 'mcp__t__swarm'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Executor-Low Agent - Simple Execution
 */
export const executorLowAgent: AgentConfig = {
  name: 'executor-low',
  description: 'Single-file edits with clear scope: imports, small functions, typos, syntax fixes. Escalates multi-file changes, complex logic, and architectural decisions to executor.',
  prompt: loadAgentPrompt('executor-low'),
  tools: ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Bash', 'TodoWrite', 'lsp_diagnostics', 'mcp__t__swarm'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Researcher-Low Agent - Quick Lookups
 */
export const researcherLowAgent: AgentConfig = {
  name: 'researcher-low',
  description: 'Quick documentation and API lookups: signatures, parameters, version compatibility. Escalates multi-source research and conflicting-information synthesis to researcher.',
  prompt: loadAgentPrompt('researcher-low'),
  tools: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Explore-Medium Agent - Thorough Search
 */
export const exploreMediumAgent: AgentConfig = {
  name: 'explore-medium',
  description: 'Cross-module pattern discovery, dependency tracing, and multi-file relationship mapping, read-only.',
  prompt: loadAgentPrompt('explore-medium'),
  tools: ['Read', 'Glob', 'Grep', 'ast_grep_search', 'lsp_document_symbols', 'lsp_workspace_symbols'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Explore-High Agent - Complex Architectural Search
 */
export const exploreHighAgent: AgentConfig = {
  name: 'explore-high',
  description: 'Deep architectural discovery: cross-cutting concerns, system-wide dependency maps, hidden abstraction layers. Read-only.',
  prompt: loadAgentPrompt('explore-high'),
  tools: ['Read', 'Glob', 'Grep', 'ast_grep_search', 'lsp_document_symbols', 'lsp_workspace_symbols', 'lsp_find_references'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Designer-Low Agent - Simple UI Tasks
 */
export const designerLowAgent: AgentConfig = {
  name: 'designer-low',
  description: 'Small CSS and styling changes: colors, spacing, fonts, alignment, visibility. Escalates new component design and design-system work to designer.',
  prompt: loadAgentPrompt('designer-low'),
  tools: ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Bash'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Designer-High Agent - Complex UI Architecture
 */
export const designerHighAgent: AgentConfig = {
  name: 'designer-high',
  description: 'Design-system and token architecture, component abstraction, advanced state patterns, UI performance strategy.',
  prompt: loadAgentPrompt('designer-high'),
  tools: ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Bash'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * QA-Tester-High Agent - Comprehensive Production QA
 */
export const qaTesterHighAgent: AgentConfig = {
  name: 'qa-tester-high',
  description: 'Comprehensive production-readiness QA across full user journeys and edge-case matrices.',
  prompt: loadAgentPrompt('qa-tester-high'),
  tools: ['Bash', 'Read', 'Grep', 'Glob', 'TodoWrite', 'lsp_diagnostics'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Scientist-Low Agent - Quick Data Inspection
 */
export const scientistLowAgent: AgentConfig = {
  name: 'scientist-low',
  description: 'Quick dataframe inspection and summary statistics: shape, head, describe, value counts, null counts. Escalates transformations, hypothesis testing, and data cleaning to scientist.',
  prompt: loadAgentPrompt('scientist-low'),
  tools: ['Read', 'Glob', 'Grep', 'Bash', 'python_repl'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Scientist-High Agent - Complex Research
 */
export const scientistHighAgent: AgentConfig = {
  name: 'scientist-high',
  description: 'Complex research, hypothesis testing, and machine-learning work over multi-step analyses.',
  prompt: loadAgentPrompt('scientist-high'),
  tools: ['Read', 'Glob', 'Grep', 'Bash', 'python_repl'],
  model: 'inherit',
  defaultModel: 'inherit'
};

// ============================================================
// SPECIALIZED AGENTS (Security, Build, TDD, Code Review)
// ============================================================

/**
 * Security-Reviewer Agent - Security Vulnerability Detection
 */
export const securityReviewerAgent: AgentConfig = {
  name: 'security-reviewer',
  description: 'Security vulnerability detection specialist. Use PROACTIVELY after writing code that handles user input, authentication, API endpoints, or sensitive data. Detects OWASP Top 10 vulnerabilities, secrets, and unsafe patterns.',
  prompt: loadAgentPrompt('security-reviewer'),
  tools: ['Read', 'Grep', 'Glob', 'Bash'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Security-Reviewer-Low Agent - Quick Security Scan
 */
export const securityReviewerLowAgent: AgentConfig = {
  name: 'security-reviewer-low',
  description: 'Single-file security scan, read-only, no delegation: secrets, input validation, obvious injection and XSS patterns. Escalates multi-file review, OWASP Top 10 audits, and auth-flow analysis to security-reviewer.',
  prompt: loadAgentPrompt('security-reviewer-low'),
  tools: ['Read', 'Grep', 'Glob', 'Bash'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Build-Fixer Agent - Build Error Resolution
 */
export const buildFixerAgent: AgentConfig = {
  name: 'build-fixer',
  description: 'Build and compilation error resolution specialist. Use PROACTIVELY when build fails or type errors occur. Fixes build/type errors with minimal diffs, no architectural edits. Focuses on getting the build green quickly.',
  prompt: loadAgentPrompt('build-fixer'),
  tools: ['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash', 'lsp_diagnostics', 'lsp_diagnostics_directory'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Build-Fixer-Low Agent - Simple Build Fix
 */
export const buildFixerLowAgent: AgentConfig = {
  name: 'build-fixer-low',
  description: 'Single-line build fixes: missing type annotations, null checks, imports, syntax errors. Escalates multi-file breakage and type-inference problems to build-fixer.',
  prompt: loadAgentPrompt('build-fixer-low'),
  tools: ['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash', 'lsp_diagnostics', 'lsp_diagnostics_directory'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * TDD-Guide Agent - Test-Driven Development
 */
export const tddGuideAgent: AgentConfig = {
  name: 'tdd-guide',
  description: 'Test-Driven Development specialist enforcing write-tests-first methodology. Use PROACTIVELY when writing new features, fixing bugs, or refactoring code. Ensures 80%+ test coverage.',
  prompt: loadAgentPrompt('tdd-guide'),
  tools: ['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash', 'lsp_diagnostics'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * TDD-Guide-Low Agent - Quick Test Suggestions
 */
export const tddGuideLowAgent: AgentConfig = {
  name: 'tdd-guide-low',
  description: 'Test suggestions for a single function, obvious edge cases, quick coverage checks. Escalates full TDD workflow, integration, and E2E planning to tdd-guide.',
  prompt: loadAgentPrompt('tdd-guide-low'),
  tools: ['Read', 'Grep', 'Glob', 'Bash', 'lsp_diagnostics'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Code-Reviewer Agent - Expert Code Review
 */
export const codeReviewerAgent: AgentConfig = {
  name: 'code-reviewer',
  description: 'Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code. Provides severity-rated feedback.',
  prompt: loadAgentPrompt('code-reviewer'),
  tools: ['Read', 'Grep', 'Glob', 'Bash', 'lsp_diagnostics', 'ast_grep_search'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Code-Reviewer-Low Agent - Quick Code Check
 */
export const codeReviewerLowAgent: AgentConfig = {
  name: 'code-reviewer-low',
  description: 'Single-file review: obvious code smells, hardcoded values, style violations. Escalates multi-file review, deep security analysis, and architecture review to code-reviewer.',
  prompt: loadAgentPrompt('code-reviewer-low'),
  tools: ['Read', 'Grep', 'Glob', 'Bash', 'lsp_diagnostics'],
  model: 'inherit',
  defaultModel: 'inherit'
};

/**
 * Team-Orchestrator Agent - Team Coordination
 */
export const teamOrchestratorAgent: AgentConfig = {
  name: 'team-orchestrator',
  description: 'Coordinates a team of agents with communication and shared context. Use for multi-agent collaborative tasks.',
  prompt: loadAgentPrompt('team-orchestrator'),
  tools: ['Agent', 'Bash', 'Read', 'Glob', 'Grep'],
  model: 'inherit',
  defaultModel: 'inherit'
};

// ============================================================
// AGENT REGISTRY
// ============================================================

/**
 * Get all agent definitions as a record for use with Factory Droid SDK
 */
export function getAgentDefinitions(overrides?: Partial<Record<string, Partial<AgentConfig>>>): Record<string, {
  description: string;
  prompt: string;
  tools: string[];
  model?: ModelIdentifier;
  defaultModel?: ModelIdentifier;
}> {
  const agents = {
    // Base agents (from individual files)
    architect: architectAgent,
    researcher: researcherAgent,
    explore: exploreAgent,
    designer: designerAgent,
    writer: writerAgent,
    vision: visionAgent,
    critic: criticAgent,
    analyst: analystAgent,
    executor: executorAgent,
    planner: plannerAgent,
    'qa-tester': qaTesterAgent,
    scientist: scientistAgent,
    // Tiered variants (prompts loaded from /droids/*.md)
    'architect-medium': architectMediumAgent,
    'architect-low': architectLowAgent,
    'executor-high': executorHighAgent,
    'executor-low': executorLowAgent,
    'researcher-low': researcherLowAgent,
    'explore-medium': exploreMediumAgent,
    'explore-high': exploreHighAgent,
    'designer-low': designerLowAgent,
    'designer-high': designerHighAgent,
    'qa-tester-high': qaTesterHighAgent,
    'scientist-low': scientistLowAgent,
    'scientist-high': scientistHighAgent,
    // Specialized agents (Security, Build, TDD, Code Review)
    'security-reviewer': securityReviewerAgent,
    'security-reviewer-low': securityReviewerLowAgent,
    'build-fixer': buildFixerAgent,
    'build-fixer-low': buildFixerLowAgent,
    'tdd-guide': tddGuideAgent,
    'tdd-guide-low': tddGuideLowAgent,
    'code-reviewer': codeReviewerAgent,
    'code-reviewer-low': codeReviewerLowAgent,
    // Team orchestrator
    'team-orchestrator': teamOrchestratorAgent
  };

  const result: Record<string, { description: string; prompt: string; tools: string[]; model?: ModelIdentifier; defaultModel?: ModelIdentifier }> = {};

  for (const [name, config] of Object.entries(agents)) {
    const override = overrides?.[name];
    result[name] = {
      description: override?.description ?? config.description,
      prompt: override?.prompt ?? config.prompt,
      tools: normalizeTools(override?.tools ?? config.tools),
      model: (override?.model ?? config.model) as ModelIdentifier | undefined,
      defaultModel: (override?.defaultModel ?? config.defaultModel) as ModelIdentifier | undefined
    };
  }

  return result;
}

// ============================================================
// OMC SYSTEM PROMPT
// ============================================================

/**
 * OMC System Prompt - The main orchestrator
 */
export const omcSystemPrompt = `You are the relentless orchestrator of a multi-agent development system.

## RELENTLESS EXECUTION

You are BOUND to your task list. You do not stop. You do not quit. You do not take breaks. Work continues until EVERY task is COMPLETE.

## Your Core Duty
You coordinate specialized subagents to accomplish complex software engineering tasks. Abandoning work mid-task is not an option. If you stop without completing ALL tasks, you have failed.

## Available Subagents
- **architect**: Architecture and debugging expert (use for complex problems)
- **researcher**: Documentation and external reference finder (use for docs/GitHub)
- **explore**: Fast pattern matching (use for internal codebase search)
- **designer**: UI/UX specialist (use for visual/styling work)
- **writer**: Technical writing (use for documentation)
- **vision**: Visual analysis (use for image/screenshot analysis)
- **critic**: Plan reviewer (use for critical evaluation)
- **analyst**: Pre-planning consultant (use for hidden requirement analysis)
- **executor**: Focused executor (use for direct implementation)
- **planner**: Strategic planner (use for comprehensive planning)
- **qa-tester**: CLI testing specialist (use for interactive CLI/service testing with tmux)

## Orchestration Principles
1. **Delegate Aggressively**: Fire off subagents for specialized tasks - don't do everything yourself
2. **Parallelize Ruthlessly**: Launch multiple subagents concurrently whenever tasks are independent
3. **PERSIST RELENTLESSLY**: Continue until ALL tasks are VERIFIED complete - check your todo list BEFORE stopping
4. **Communicate Progress**: Keep the user informed but DON'T STOP to explain when you should be working
5. **Verify Thoroughly**: Test, check, verify - then verify again

## Agent Combinations

### Architect + QA-Tester (Diagnosis -> Verification Loop)
For debugging CLI apps and services:
1. **architect** diagnoses the issue, provides root cause analysis
2. **architect** outputs a test plan with specific commands and expected outputs
3. **qa-tester** executes the test plan in tmux, captures real outputs
4. If verification fails, feed results back to architect for re-diagnosis
5. Repeat until verified

This is the recommended workflow for any bug that requires running actual services to verify.

### Verification Guidance (Gated for Token Efficiency)

**Verification priority order:**
1. **Existing tests** (npm test, pytest, etc.) - PREFERRED, cheapest
2. **Direct commands** (curl, simple CLI) - cheap
3. **QA-Tester** (tmux sessions) - expensive, use sparingly

**When to use qa-tester:**
- No test suite covers the behavior
- Interactive CLI input/output simulation needed
- Service startup/shutdown testing required
- Streaming/real-time behavior verification

**When NOT to use qa-tester:**
- Project has tests that cover the functionality -> run tests
- Simple command verification -> run directly
- Static code analysis -> use architect

## Workflow
1. Analyze the user's request and break it into tasks using TodoWrite
2. Mark the first task in_progress and BEGIN WORKING
3. Delegate to appropriate subagents based on task type
4. Coordinate results and handle any issues WITHOUT STOPPING
5. Mark tasks complete ONLY when verified
6. LOOP back to step 2 until ALL tasks show 'completed'
7. Final verification: Re-read todo list, confirm 100% completion
8. Only THEN may you rest

## CRITICAL RULES - VIOLATION IS FAILURE

1. **NEVER STOP WITH INCOMPLETE WORK** - If your todo list has pending/in_progress items, YOU ARE NOT DONE
2. **ALWAYS VERIFY** - Check your todo list before ANY attempt to conclude
3. **NO PREMATURE CONCLUSIONS** - Saying "I've completed the task" without verification is a LIE
4. **PARALLEL EXECUTION** - Use it whenever possible for speed
5. **CONTINUOUS PROGRESS** - Report progress but keep working
6. **WHEN BLOCKED, UNBLOCK** - Don't stop because something is hard; find another way
7. **ASK ONLY WHEN NECESSARY** - Clarifying questions are for ambiguity, not for avoiding work

## Completion Checklist
Before concluding, you MUST verify:
- [ ] Every todo item is marked 'completed'
- [ ] All requested functionality is implemented
- [ ] Tests pass (if applicable)
- [ ] No errors remain unaddressed
- [ ] The user's original request is FULLY satisfied

If ANY checkbox is unchecked, YOU ARE NOT DONE. Continue working.`;
