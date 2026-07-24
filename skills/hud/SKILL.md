---
name: hud
description: Configure HUD display options (layout, presets, display elements)
role: config-writer  # DOCUMENTATION ONLY - This skill writes to ~/.factory/ paths
scope: ~/.factory/**  # DOCUMENTATION ONLY - Allowed write scope
---

# HUD Skill

Configure the OMD HUD (Heads-Up Display) for the statusline.

## Quick Commands

| Command | Description |
|---------|-------------|
| `/hud` | Show current HUD status (auto-setup if needed) |
| `/hud setup` | Install/repair HUD statusline |
| `/hud minimal` | Switch to minimal display |
| `/hud focused` | Switch to focused display (default) |
| `/hud full` | Switch to full display |
| `/hud status` | Show detailed HUD status |

## Auto-Setup

When you run `/hud` or `/hud setup`, the system will automatically:
1. Check if `~/.factory/hud/omd-hud.mjs` exists
2. Check if `statusLine` is configured in `~/.factory/settings.json`
3. If missing, create the HUD wrapper script and configure settings
4. Report status and prompt to restart Factory Droid if changes were made

**IMPORTANT**: If the argument is `setup` OR if the HUD script doesn't exist at `~/.factory/hud/omd-hud.mjs`, you MUST create the HUD files directly using the instructions below.

### Setup Instructions (Run These Commands)

**Step 1:** Check if setup is needed:
```bash
ls ~/.factory/hud/omd-hud.mjs 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

**Step 2:** Check if the tracked HUD bundle is present:
```bash
# Resolve the active install from Factory's plugin metadata
PLUGIN_DIR=$(node --input-type=module - <<'NODE'
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative } from "node:path";

try {
  const home = homedir();
  const cacheRoot = realpathSync(join(home, ".factory/plugins/cache/oh-my-droid/oh-my-droid"));
  const metadata = JSON.parse(readFileSync(
    join(home, ".factory/plugins/installed_plugins.json"),
    "utf-8",
  ));
  const installs = metadata.plugins?.["oh-my-droid@oh-my-droid"] ?? [];
  const install = installs.find((item) => item.scope === "user");
  const installPath = realpathSync(install?.installPath);
  const installRelative = relative(cacheRoot, installPath);
  if (installRelative && !installRelative.startsWith("..") && !isAbsolute(installRelative)) {
    const bundlePath = join(installPath, "bridge/hud.cjs");
    if (!lstatSync(bundlePath).isSymbolicLink()) {
      const bundleRealPath = realpathSync(bundlePath);
      const bundleRelative = relative(installPath, bundleRealPath);
      if (bundleRelative && !bundleRelative.startsWith("..") && !isAbsolute(bundleRelative)) {
        console.log(installPath);
        process.exit(0);
      }
    }
  }
} catch {}
console.log("");
NODE
)
if [ -n "$PLUGIN_DIR" ]; then
  test -f "$PLUGIN_DIR/bridge/hud.cjs" && echo "READY" || echo "MISSING"
fi
```

If the bundle is `MISSING`, reinstall the plugin with `/omd-setup`. Factory
plugin caches are immutable and should not be built in place.

**Step 3:** If omd-hud.mjs is MISSING or argument is `setup`, create the HUD directory and script:

First, create the directory:
```bash
mkdir -p ~/.factory/hud
```

Then, use the Write tool to create `~/.factory/hud/omd-hud.mjs` with this exact content:

```javascript
#!/usr/bin/env node
/**
 * OMD HUD - Statusline Script
 * Wrapper that imports from the user plugin cache, dev paths, or npm package
 */

import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
  const home = homedir();

  // 1. Resolve only the user-scoped install under Factory's plugin cache.
  try {
    const registryPath = join(home, ".factory/plugins/installed_plugins.json");
    const cacheRoot = realpathSync(join(home, ".factory/plugins/cache/oh-my-droid/oh-my-droid"));
    const pluginsData = JSON.parse(readFileSync(registryPath, "utf-8"));
    const installs = pluginsData.plugins?.["oh-my-droid@oh-my-droid"] ?? [];
    const install = installs.find((item) => item.scope === "user");
    const installPath = realpathSync(install?.installPath);
    const installRelative = relative(cacheRoot, installPath);
    if (installRelative && !installRelative.startsWith("..") && !isAbsolute(installRelative)) {
      const bundlePath = join(installPath, "bridge/hud.cjs");
      if (!lstatSync(bundlePath).isSymbolicLink()) {
        const bundleRealPath = realpathSync(bundlePath);
        const bundleRelative = relative(installPath, bundleRealPath);
        if (bundleRelative && !bundleRelative.startsWith("..") && !isAbsolute(bundleRelative)) {
          await import(pathToFileURL(bundleRealPath).href);
          return;
        }
      }
    }
  } catch { /* continue */ }

  // 2. Development paths
  const devPaths = [
    join(home, "Workspace/oh-my-droid/dist/hud/index.js"),
    join(home, "workspace/oh-my-droid/dist/hud/index.js"),
    join(home, "projects/oh-my-droid/dist/hud/index.js"),
  ];

  for (const devPath of devPaths) {
    if (existsSync(devPath)) {
      try {
        await import(pathToFileURL(devPath).href);
        return;
      } catch { /* continue */ }
    }
  }

  // 3. npm package (global or local install)
  try {
    await import("oh-my-droid/bridge/hud.cjs");
    return;
  } catch { /* continue */ }
  try {
    await import("oh-my-droid/dist/hud/index.js");
    return;
  } catch { /* continue */ }

  // 4. Fallback
  console.log("[OMD HUD] Plugin HUD missing. Run: /omd-setup");
}

main();
```

**Step 3:** Make it executable:
```bash
chmod +x ~/.factory/hud/omd-hud.mjs
```

**Step 4:** Update settings.json to use the HUD:

Read `~/.factory/settings.json`, then update/add the `statusLine` field.

**IMPORTANT:** The command must use an absolute path, not `~`, because Windows does not expand `~` in shell commands.

First, determine the correct path:
```bash
node -e "const p=require('path').join(require('os').homedir(),'.factory','hud','omd-hud.mjs');console.log(JSON.stringify(p))"
```

Then set the `statusLine` field using the resolved path. On Unix it will look like:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node /home/username/.factory/hud/omd-hud.mjs"
  }
}
```

On Windows it will look like:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:\\Users\\username\\.factory\\hud\\omd-hud.mjs"
  }
}
```

Use the Edit tool to add/update this field while preserving other settings.

**Step 5:** Clean up old HUD scripts (if any):
```bash
rm -f ~/.factory/hud/sisyphus-hud.mjs 2>/dev/null
```

**Step 6:** Tell the user to restart Factory Droid for changes to take effect.

## Display Presets

### Minimal
Shows only the essentials:
```
[OMD] ralph | ultrawork | todos:2/5
```

### Focused (Default)
Shows all relevant elements:
```
[OMD] ralph:3/10 | US-002 | ultrawork skill:planner | ctx:67% | agents:2 | bg:3/5 | todos:2/5
```

### Full
Shows everything including multi-line agent details:
```
[OMD] ralph:3/10 | US-002 (2/5) | ultrawork | ctx:[████░░]67% | agents:3 | bg:3/5 | todos:2/5
├─ O architect    2m   analyzing architecture patterns...
├─ e explore     45s   searching for test files
└─ s executor     1m   implementing validation logic
```

## Multi-Line Agent Display

When agents are running, the HUD shows detailed information on separate lines:
- **Tree characters** (`├─`, `└─`) show visual hierarchy
- **Agent code** (O, e, s) indicates agent type with model tier color
- **Duration** shows how long each agent has been running
- **Description** shows what each agent is doing (up to 45 chars)

## Display Elements

| Element | Description |
|---------|-------------|
| `[OMD]` | Mode identifier |
| `ralph:3/10` | Ralph loop iteration/max |
| `US-002` | Current PRD story ID |
| `ultrawork` | Active mode badge |
| `skill:name` | Last activated skill (cyan) |
| `ctx:67%` | Context window usage |
| `agents:2` | Running subagent count |
| `bg:3/5` | Background task slots |
| `todos:2/5` | Todo completion |

## Color Coding

- **Green**: Normal/healthy
- **Yellow**: Warning (context >70%, ralph >7)
- **Red**: Critical (context >85%, ralph at max)

## Configuration Location

HUD config is stored at: `~/.factory/.omd/hud-config.json`

## Manual Configuration

You can manually edit the config file. Each option can be set individually - any unset values will use defaults.

```json
{
  "preset": "focused",
  "elements": {
    "omdLabel": true,
    "ralph": true,
    "prdStory": true,
    "activeSkills": true,
    "lastSkill": true,
    "contextBar": true,
    "agents": true,
    "backgroundTasks": true,
    "todos": true,
    "showCache": true,
    "showCost": true,
    "maxOutputLines": 4
  },
  "thresholds": {
    "contextWarning": 70,
    "contextCritical": 85,
    "ralphWarning": 7
  }
}
```

## Troubleshooting

If the HUD is not showing:
1. Run `/hud setup` to auto-install and configure
2. Restart Factory Droid after setup completes
3. If still not working, run `/doctor` for full diagnostics

Manual verification:
- HUD script: `~/.factory/hud/omd-hud.mjs`
- Settings: `~/.factory/settings.json` should have `statusLine` configured

---

*The HUD updates automatically every ~300ms during active sessions.*
