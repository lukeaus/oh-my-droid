---
description: Token-efficient parallel execution mode using LOW and MEDIUM tier agents
aliases: [eco, efficient, save-tokens, budget]
---

# Ecomode Skill

Activates token-efficient parallel execution for pro-plan users who prioritize cost efficiency over maximum capability.

## When to Use Ecomode

- You're on a pro plan and want to conserve tokens
- Tasks don't require complex reasoning (no deep debugging, architecture design)
- You want faster responses (smaller models = lower latency)
- Standard development work: features, bug fixes, refactoring

## How It Differs from Ultrawork

| Aspect | Ecomode | Ultrawork |
|--------|---------|-----------|
| **Default Tier** | light (LOW) | medium (MEDIUM) |
| **Fallback Tier** | medium (MEDIUM) | heavy (HIGH) |
| **heavy Usage** | Avoided (planning only if essential) | Used for complex tasks |
| **Token Cost** | Lower | Higher |
| **Best For** | Standard dev work | Complex challenges |

## Activation

**Explicit keywords** (always activates ecomode):
- "ecomode", "eco", "efficient", "save-tokens", "budget"

**Examples:**
```
eco fix the login bug
ecomode: refactor the API
budget mode: add form validation
```

## Agent Routing

Ecomode routes tasks to lower-tier agents:

| Domain | Ecomode Uses | Ultrawork Uses |
|--------|--------------|----------------|
| Analysis | architect-low (light) | architect (heavy) |
| Execution | executor-low (light) | executor-high (heavy) |
| Frontend | designer-low (light) | designer-high (heavy) |
| Search | explore (light) | explore-medium (medium) |

## Setting as Default

Run `/omd-setup` to set ecomode as your default parallel execution mode.

When set as default, saying "fast" or "parallel" will activate ecomode instead of ultrawork.

## Cancellation

- `/cancel` - Cancel active mode
- Say "stop" or "cancel" - Unified cancellation
