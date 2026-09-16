# oh-my-droid

[![GitHub stars](https://img.shields.io/github/stars/lukeaus/oh-my-droid?style=flat&color=yellow)](https://github.com/lukeaus/oh-my-droid/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Multi-agent orchestration for Factory Droid. Zero learning curve.**

*Don't learn Factory Droid. Just use OMD.*

Based on [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) by Yeachan Heo.

Forked from [MeroZemory/oh-my-droid](https://github.com/MeroZemory/oh-my-droid).

---

## Quick Start

**Step 1: Install**

```bash
droid plugin marketplace add https://github.com/lukeaus/oh-my-droid
droid plugin install oh-my-droid@oh-my-droid
```

**Step 2: Setup**

```bash
/omd-setup
```

**Step 3: Build something**

```
autopilot: build a REST API for managing tasks
```

That's it. Everything else is automatic.

---

## Why oh-my-droid?

- **Zero configuration required** - Works out of the box with intelligent defaults
- **Natural language interface** - No commands to memorize, just describe what you want
- **Automatic parallelization** - Complex tasks distributed across specialized agents
- **Persistent execution** - Won't give up until the job is verified complete
- **Cost optimization** - Smart model routing saves 30-50% on tokens
- **Learn from experience** - Automatically extracts and reuses problem-solving patterns
- **Real-time visibility** - HUD statusline shows what's happening under the hood

---

## Features

### Execution Modes

| Mode | Speed | Use For | Magic Keyword |
| ---- | ----- | ------- | ------------- |
| **Autopilot** | Fast | Full autonomous workflows | `autopilot` |
| **Ultrawork** | Parallel | Maximum parallelism for any task | `ulw` / `uw` |
| **Ralph** | Persistent | Tasks that must complete fully | `ralph` |
| **Ultrapilot** | 3-5x faster | Multi-component systems | `ultrapilot` |
| **Ecomode** | Fast + 30-50% cheaper | Budget-conscious projects | `eco` |
| **Swarm** | Coordinated | Parallel independent tasks | `swarm N` |
| **Pipeline** | Sequential | Multi-stage processing | `pipeline` |
| **Plan** | Interview | Planning workflow | `plan` |
| **Ralplan** | Consensus | Iterative planning | `ralplan` |
| **Team** | Coordinated | Multi-agent team | `team` |

**ralph includes ultrawork:** When you activate ralph mode, it automatically includes ultrawork's parallel execution. No need to combine keywords.

### Intelligent Orchestration

- **32 specialized droids** for architecture, research, design, testing, data science
- **Tiered agent delegation** - Match task scope to specialized light, medium, and heavy agent variants
- **Automatic delegation** - Right droid for the job, every time

### Developer Experience

- **HUD statusline** - Real-time orchestration metrics in your status bar
- **Skill learning** - Extract reusable patterns from your sessions
- **Analytics & cost tracking** - Understand token usage across all sessions

---

## Utilities

### Rate Limit Wait

Auto-resume Factory Droid sessions when rate limits reset.

```bash
omd wait          # Check status, get guidance
omd wait --start  # Enable auto-resume daemon
omd wait --stop   # Disable daemon
```

**Requires:** tmux (for session detection)

---

## Requirements

- [Factory Droid](https://docs.factory.ai) CLI
- Factory AI subscription or API key

---

## License

MIT

---

<div align="center">

**Based on:** [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) by Yeachan Heo

**Inspired by:** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) • [claude-hud](https://github.com/ryanjoachim/claude-hud)

**Zero learning curve. Maximum power.**

</div>
