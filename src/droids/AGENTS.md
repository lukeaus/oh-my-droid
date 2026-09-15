<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-31 -->

# agents

Agent definitions in three scope tiers. Every agent is `model: inherit`, so the
model comes from the user's `subagentModelSettings`; the tier is what the
dispatcher passes as `complexity`.

## Purpose

This directory defines all agents available in oh-my-droid:

- **12 base agents**
- **4 specialized agents** (security-reviewer, build-fixer, tdd-guide, code-reviewer)
- **16 tiered variants** (light/medium/heavy scope)
- Prompts loaded dynamically from `/droids/*.md` files
- Tools assigned based on agent specialization

## Key Files

| File | Description |
|------|-------------|
| `definitions.ts` | **Main registry** - `getAgentDefinitions()`, `omcSystemPrompt` |
| `architect.ts` | Architecture & debugging expert |
| `executor.ts` | Focused task implementation |
| `explore.ts` | Fast codebase search |
| `designer.ts` | UI/UX specialist |
| `researcher.ts` | Documentation research |
| `writer.ts` | Technical documentation |
| `vision.ts` | Visual/image analysis |
| `critic.ts` | Critical plan review |
| `analyst.ts` | Pre-planning analysis |
| `planner.ts` | Strategic planning |
| `qa-tester.ts` | CLI/service testing with tmux |
| `scientist.ts` | Data analysis & hypothesis testing |
| `index.ts` | Exports all agents and utilities |

## For AI Agents

### Working In This Directory

#### Understanding the Agent Registry

The main registry is in `definitions.ts`:

```typescript
// Get all 33 agents
const agents = getAgentDefinitions();

// Each agent has:
{
  name: 'architect',
  description: 'Architecture & Debugging Advisor',
  prompt: '...',  // Loaded from /droids/architect.md
  tools: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
  model: 'inherit',
  defaultModel: 'inherit'
}
```

#### Agent Selection Guide

| Task Type | Best Agent | Tools |
|-----------|------------|-------|
| Complex debugging | `architect` | Read, Glob, Grep, WebSearch, WebFetch |
| Quick code lookup | `architect-low` | Read, Glob, Grep |
| Standard analysis | `architect-medium` | Read, Glob, Grep, WebSearch, WebFetch |
| Feature implementation | `executor` | Read, Glob, Grep, Edit, Write, Bash, TodoWrite |
| Simple fixes | `executor-low` | Read, Glob, Grep, Edit, Write, Bash, TodoWrite |
| Complex refactoring | `executor-high` | Read, Glob, Grep, Edit, Write, Bash, TodoWrite |
| Fast file search | `explore` | Read, Glob, Grep |
| Thorough search | `explore-medium` | Read, Glob, Grep |
| Architectural discovery | `explore-high` | Read, Glob, Grep |
| UI components | `designer` | Read, Glob, Grep, Edit, Write, Bash |
| Simple styling | `designer-low` | Read, Glob, Grep, Edit, Write, Bash |
| Design systems | `designer-high` | Read, Glob, Grep, Edit, Write, Bash |
| API documentation | `researcher` | Read, Glob, Grep, WebSearch, WebFetch |
| Quick doc lookup | `researcher-low` | Read, Glob, Grep, WebSearch, WebFetch |
| README/docs | `writer` | Read, Glob, Grep, Edit, Write |
| Image analysis | `vision` | Read, Glob, Grep |
| Plan review | `critic` | Read, Glob, Grep |
| Requirements analysis | `analyst` | Read, Glob, Grep, WebSearch |
| Strategic planning | `planner` | Read, Glob, Grep, WebSearch |
| CLI testing | `qa-tester` | Bash, Read, Grep, Glob, TodoWrite |
| Production QA | `qa-tester-high` | Bash, Read, Grep, Glob, TodoWrite |
| Data analysis | `scientist` | Read, Glob, Grep, Bash, python_repl |
| Quick data check | `scientist-low` | Read, Glob, Grep, Bash, python_repl |
| ML/hypothesis | `scientist-high` | Read, Glob, Grep, Bash, python_repl |
| Security audit | `security-reviewer` | Read, Grep, Glob, Bash |
| Quick security scan | `security-reviewer-low` | Read, Grep, Glob, Bash |
| Build errors | `build-fixer` | Read, Grep, Glob, Edit, Write, Bash |
| Simple type errors | `build-fixer-low` | Read, Grep, Glob, Edit, Write, Bash |
| TDD workflow | `tdd-guide` | Read, Grep, Glob, Edit, Write, Bash |
| Test suggestions | `tdd-guide-low` | Read, Grep, Glob, Bash |
| Code review | `code-reviewer` | Read, Grep, Glob, Bash |
| Quick code check | `code-reviewer-low` | Read, Grep, Glob, Bash |
#### Creating a New Agent

1. **Create agent file** (e.g., `new-agent.ts`):
```typescript
import type { AgentConfig } from '../shared/types.js';

export const newAgent: AgentConfig = {
  name: 'new-agent',
  description: 'What this agent does',
  prompt: '', // Will be loaded from /droids/new-agent.md
  tools: ['Read', 'Glob', 'Grep'],
  model: 'inherit',
  defaultModel: 'inherit'
};
```

2. **Create prompt template** at `/droids/new-agent.md`:
```markdown
---
name: new-agent
description: What this agent does
model: inherit
tools: [Read, Glob, Grep]
---

# Agent Instructions

You are a specialized agent for...
```

3. **Add to definitions.ts**:
```typescript
import { newAgent } from './new-agent.js';

export function getAgentDefinitions() {
  return {
    // ... existing agents
    'new-agent': newAgent,
  };
}
```

4. **Export from index.ts**:
```typescript
export { newAgent } from './new-agent.js';
```

#### Creating Tiered Variants

To cover a range of scopes, create light/medium/heavy variants in `definitions.ts`:

```typescript
// Low variant: narrower scope, fewer tools
export const newAgentLow: AgentConfig = {
  name: 'new-agent-low',
  description: 'Single-file new-agent tasks; escalates anything wider',
  prompt: loadAgentPrompt('new-agent-low'),
  tools: ['Read', 'Glob', 'Grep'],
  model: 'inherit',
  defaultModel: 'inherit'
};

// High variant: broader scope, more tools
export const newAgentHigh: AgentConfig = {
  name: 'new-agent-high',
  description: 'Multi-file new-agent tasks spanning modules',
  prompt: loadAgentPrompt('new-agent-high'),
  tools: ['Read', 'Glob', 'Grep', 'WebSearch'],
  model: 'inherit',
  defaultModel: 'inherit'
};
```

### Modification Checklist

#### When Adding a New Agent

1. Create agent file (`src/droids/new-agent.ts`)
2. Create prompt template (`droids/new-agent.md`)
3. Add to `definitions.ts` (import + registry)
4. Export from `index.ts`
5. Update `docs/REFERENCE.md` (Agents section, count)
6. Update `docs/FACTORY.md` (Agent Selection Guide)
7. Update root `/AGENTS.md` (Agent Summary if applicable)

#### When Modifying an Agent

1. Update agent file (`src/droids/*.ts`) if changing tools/model
2. Update prompt template (`droids/*.md`) if changing behavior
3. Update tiered variants (`-low`, `-medium`, `-high`) if applicable
4. Update `docs/REFERENCE.md` if changing agent description/capabilities
5. Update `docs/FACTORY.md` (Agent Tool Matrix) if changing tool assignments

#### When Removing an Agent

1. Remove agent file from `src/droids/`
2. Remove prompt template from `droids/`
3. Remove from `definitions.ts` and `index.ts`
4. Update agent counts in all documentation
5. Check for skill/hook references to the removed agent

### Testing Requirements

Agents are tested via integration tests:

```bash
npm test -- --grep "agent"
```

### Common Patterns

**Prompt loading:**
```typescript
function loadAgentPrompt(agentName: string): string {
  const agentPath = join(getPackageDir(), 'agents', `${agentName}.md`);
  const content = readFileSync(agentPath, 'utf-8');
  // Strip YAML frontmatter
  const match = content.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}
```

**Tool assignment patterns:**
- Read-only agents: `['Read', 'Glob', 'Grep']`
- Analysis agents: Add `['WebSearch', 'WebFetch']`
- Execution agents: Add `['Edit', 'Write', 'Bash', 'TodoWrite']`
- Data agents: Add `['python_repl']`

## Dependencies

### Internal
- Prompts from `/droids/*.md`
- Types from `../shared/types.ts`

### External
None - pure TypeScript definitions.

## Agent Categories

| Category | Agents | Purpose |
|----------|--------|---------|
| Analysis | architect, architect-medium, architect-low | Debugging, architecture |
| Execution | executor, executor-low, executor-high | Code implementation |
| Search | explore, explore-medium, explore-high | Codebase exploration |
| Research | researcher, researcher-low | External documentation |
| Frontend | designer, designer-low, designer-high | UI/UX work |
| Documentation | writer | Technical writing |
| Visual | vision | Image/screenshot analysis |
| Planning | planner, analyst, critic | Strategic planning |
| Testing | qa-tester, qa-tester-high | Interactive testing |
| Security | security-reviewer, security-reviewer-low | Security audits |
| Build | build-fixer, build-fixer-low | Compilation errors |
| TDD | tdd-guide, tdd-guide-low | Test-driven development |
| Review | code-reviewer, code-reviewer-low | Code quality |
| Data | scientist, scientist-low, scientist-high | Data analysis |

<!-- MANUAL: -->
