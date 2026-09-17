# oh-my-droid

[![GitHub stars](https://img.shields.io/github/stars/lukeaus/oh-my-droid?style=flat&color=yellow)](https://github.com/lukeaus/oh-my-droid/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Multi-agent orchestration for Factory Droid. Zero learning curve.**

*Don't learn Factory Droid. Just use OMD.*

Based on [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) by Yeachan Heo.

Hard fork of [MeroZemory/oh-my-droid](https://github.com/MeroZemory/oh-my-droid).

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

Magic Keywords are optional shortcuts for power users. Natural language works fine without them.

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

## Environment Variables

oh-my-droid reads these variables at runtime. Configuration variables override
`~/.factory/.omd-config.json` (environment has the highest precedence).

| Variable | Purpose |
| -------- | ------- |
| `ANTHROPIC_1M_CONTEXT` | Set to `true` when the Anthropic 1M-context beta is active, so the preemptive-compaction hook accounts for the larger window |
| `APPDATA` | Windows roaming directory for config paths |
| `CI` | Set to `true` or `1` in non-interactive environments; hooks skip interactive prompts |
| `COMMENT_CHECKER_DEBUG` | Set to `1` for debug logging from the comment-checker hook |
| `CONTEXT_LIMIT_RECOVERY_DEBUG` | Set to `1` for debug logging from the context-limit recovery path |
| `DEBUG_THINKING_VALIDATOR` | Set to enable debug logging from the thinking-block validator hook |
| `DROID_PLUGIN_ROOT` | Set by Factory when the plugin loads; used by `hooks/hooks.json`, `.mcp.json`, and installer detection to locate plugin files |
| `EMPTY_MESSAGE_SANITIZER_DEBUG` | Set to `1` for debug logging from the empty-message sanitizer hook |
| `EXA_API_KEY` | Exa API key; when set, the config loader enables the Exa MCP server |
| `FACTORY_API_KEY` | Factory API key; `omd config --validate` warns when it is missing |
| `FACTORY_HOME` | Factory home directory used by the permission handler when resolving its state location |
| `GITHUB_ACTIONS` | Set to `true` on GitHub Actions; treated as a non-interactive environment |
| `LOCALAPPDATA` | Windows local directory for data paths |
| `OMD_BRIDGE_SCRIPT` | Absolute path to the Python REPL bridge script; overrides auto-discovery |
| `OMD_DEBUG` | Verbose debug logging for the HUD, auto-update, todo continuation, and learner. Any non-empty value works; the learner requires `1` |
| `OMD_ESCALATION_ENABLED` | `true` forces model-routing escalation on, `false` forces it off |
| `OMD_LSP_TOOLS` | `true` forces the LSP tools feature on, `false` forces it off |
| `OMD_MAX_BACKGROUND_TASKS` | Integer; overrides the maximum number of concurrent background tasks |
| `OMD_PARALLEL_EXECUTION` | `true` forces parallel execution on, `false` forces it off |
| `OMD_ROUTING_DEFAULT_TIER` | `LOW`, `MEDIUM`, or `HIGH`; overrides the default model-routing tier (invalid values are ignored) |
| `OMD_ROUTING_ENABLED` | `true` forces model routing on, `false` forces it off |
| `PREEMPTIVE_COMPACTION_DEBUG` | Set to `1` for debug logging from the preemptive-compaction hook |
| `RECOVERY_DEBUG` | Set to `1` for debug logging from the recovery hook |
| `SESSION_RECOVERY_DEBUG` | Set to `1` for debug logging from session recovery |
| `TMUX` | Set by tmux; rate-limit wait uses it to detect a tmux session |
| `VERTEX_ANTHROPIC_1M_CONTEXT` | Same as `ANTHROPIC_1M_CONTEXT`, for Vertex AI |
| `XDG_CONFIG_HOME` | Linux config directory (default `~/.config`) |
| `XDG_DATA_HOME` | Linux data directory (default `~/.local/share`) |
| `XDG_RUNTIME_DIR` | Linux runtime directory used by the Python REPL for session files |

---

## License

MIT

---

<div align="center">

**Based on:** [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) by Yeachan Heo

**Inspired by:** [claude-hud](https://github.com/ryanjoachim/claude-hud)

**Zero learning curve. Maximum power.**

</div>
