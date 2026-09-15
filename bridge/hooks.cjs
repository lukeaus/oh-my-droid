"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hooks/runtime.ts
var runtime_exports = {};
__export(runtime_exports, {
  processPermissionRequest: () => processPermissionRequest,
  processPreCompact: () => processPreCompact,
  processSessionEnd: () => processSessionEnd,
  processSubagentStop: () => processSubagentStop
});
module.exports = __toCommonJS(runtime_exports);

// src/hooks/session-end/index.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);

// src/hooks/setup/index.ts
var import_fs = require("fs");
var import_path = require("path");
var import_child_process = require("child_process");
var DEFAULT_STATE_MAX_AGE_DAYS = 7;
function pruneOldStateFiles(directory, maxAgeDays = DEFAULT_STATE_MAX_AGE_DAYS) {
  const stateDir = (0, import_path.join)(directory, ".omd/state");
  if (!(0, import_fs.existsSync)(stateDir)) {
    return 0;
  }
  const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1e3;
  let deletedCount = 0;
  try {
    const files = (0, import_fs.readdirSync)(stateDir);
    for (const file of files) {
      const filePath = (0, import_path.join)(stateDir, file);
      try {
        const stats = (0, import_fs.statSync)(filePath);
        if (stats.isDirectory()) {
          continue;
        }
        if (stats.mtimeMs < cutoffTime) {
          if (file === "autopilot-state.json" || file === "ultrapilot-state.json" || file === "ralph-state.json" || file === "ultrawork-state.json" || file === "swarm-state.json") {
            continue;
          }
          (0, import_fs.unlinkSync)(filePath);
          deletedCount++;
        }
      } catch {
      }
    }
  } catch {
  }
  return deletedCount;
}
function vacuumSwarmDb(directory) {
  const swarmDbPath = (0, import_path.join)(directory, ".omd/state/swarm.db");
  if (!(0, import_fs.existsSync)(swarmDbPath)) {
    return false;
  }
  try {
    (0, import_child_process.execSync)("which sqlite3", { stdio: "pipe" });
    (0, import_child_process.execSync)(`sqlite3 "${swarmDbPath}" "VACUUM;"`, {
      stdio: "pipe",
      timeout: 5e3
      // 5 second timeout
    });
    return true;
  } catch {
    return false;
  }
}

// src/hooks/session-end/index.ts
function getAgentCounts(directory) {
  const trackingPath = path.join(directory, ".omd", "state", "subagent-tracking.json");
  if (!fs.existsSync(trackingPath)) {
    return { spawned: 0, completed: 0 };
  }
  try {
    const content = fs.readFileSync(trackingPath, "utf-8");
    const tracking = JSON.parse(content);
    const spawned = tracking.agents?.length || 0;
    const completed = tracking.agents?.filter((a) => a.status === "completed").length || 0;
    return { spawned, completed };
  } catch (error) {
    return { spawned: 0, completed: 0 };
  }
}
function getModesUsed(directory) {
  const stateDir = path.join(directory, ".omd", "state");
  const modes = [];
  if (!fs.existsSync(stateDir)) {
    return modes;
  }
  const modeStateFiles = [
    { file: "autopilot-state.json", mode: "autopilot" },
    { file: "ultrapilot-state.json", mode: "ultrapilot" },
    { file: "ralph-state.json", mode: "ralph" },
    { file: "ultrawork-state.json", mode: "ultrawork" },
    { file: "ecomode-state.json", mode: "ecomode" },
    { file: "swarm-state.json", mode: "swarm" },
    { file: "pipeline-state.json", mode: "pipeline" }
  ];
  for (const { file, mode } of modeStateFiles) {
    const statePath = path.join(stateDir, file);
    if (fs.existsSync(statePath)) {
      modes.push(mode);
    }
  }
  return modes;
}
function getSessionStartTime(directory) {
  const stateDir = path.join(directory, ".omd", "state");
  if (!fs.existsSync(stateDir)) {
    return void 0;
  }
  const stateFiles = fs.readdirSync(stateDir).filter((f) => f.endsWith(".json"));
  for (const file of stateFiles) {
    try {
      const statePath = path.join(stateDir, file);
      const content = fs.readFileSync(statePath, "utf-8");
      const state = JSON.parse(content);
      if (state.started_at) {
        return state.started_at;
      }
    } catch (error) {
      continue;
    }
  }
  return void 0;
}
function recordSessionMetrics(directory, input) {
  const endedAt = (/* @__PURE__ */ new Date()).toISOString();
  const startedAt = getSessionStartTime(directory);
  const { spawned, completed } = getAgentCounts(directory);
  const modesUsed = getModesUsed(directory);
  const metrics = {
    session_id: input.session_id,
    started_at: startedAt,
    ended_at: endedAt,
    reason: input.reason || "other",
    agents_spawned: spawned,
    agents_completed: completed,
    modes_used: modesUsed
  };
  if (startedAt) {
    try {
      const startTime = new Date(startedAt).getTime();
      const endTime = new Date(endedAt).getTime();
      metrics.duration_ms = endTime - startTime;
    } catch (error) {
    }
  }
  return metrics;
}
function cleanupTransientState(directory) {
  let filesRemoved = 0;
  const omdDir = path.join(directory, ".omd");
  if (!fs.existsSync(omdDir)) {
    return filesRemoved;
  }
  const trackingPath = path.join(omdDir, "state", "subagent-tracking.json");
  if (fs.existsSync(trackingPath)) {
    try {
      fs.unlinkSync(trackingPath);
      filesRemoved++;
    } catch (error) {
    }
  }
  const checkpointsDir = path.join(omdDir, "checkpoints");
  if (fs.existsSync(checkpointsDir)) {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1e3;
    try {
      const files = fs.readdirSync(checkpointsDir);
      for (const file of files) {
        const filePath = path.join(checkpointsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < oneDayAgo) {
          fs.unlinkSync(filePath);
          filesRemoved++;
        }
      }
    } catch (error) {
    }
  }
  const removeTmpFiles = (dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          removeTmpFiles(fullPath);
        } else if (entry.name.endsWith(".tmp")) {
          fs.unlinkSync(fullPath);
          filesRemoved++;
        }
      }
    } catch (error) {
    }
  };
  removeTmpFiles(omdDir);
  return filesRemoved;
}
var MODE_STATE_FILES = [
  { file: "autopilot-state.json", mode: "autopilot" },
  { file: "ultrapilot-state.json", mode: "ultrapilot" },
  { file: "ralph-state.json", mode: "ralph" },
  { file: "ultrawork-state.json", mode: "ultrawork" },
  { file: "ecomode-state.json", mode: "ecomode" },
  { file: "ultraqa-state.json", mode: "ultraqa" },
  { file: "pipeline-state.json", mode: "pipeline" },
  // Swarm uses marker file + SQLite
  { file: "swarm-active.marker", mode: "swarm" },
  { file: "swarm-summary.json", mode: "swarm" }
];
function cleanupModeStates(directory) {
  let filesRemoved = 0;
  const modesCleaned = [];
  const stateDir = path.join(directory, ".omd", "state");
  if (!fs.existsSync(stateDir)) {
    return { filesRemoved, modesCleaned };
  }
  for (const { file, mode } of MODE_STATE_FILES) {
    const localPath = path.join(stateDir, file);
    if (fs.existsSync(localPath)) {
      try {
        if (file.endsWith(".json")) {
          const content = fs.readFileSync(localPath, "utf-8");
          const state = JSON.parse(content);
          if (state.active === true) {
            fs.unlinkSync(localPath);
            filesRemoved++;
            if (!modesCleaned.includes(mode)) {
              modesCleaned.push(mode);
            }
          }
        } else {
          fs.unlinkSync(localPath);
          filesRemoved++;
          if (!modesCleaned.includes(mode)) {
            modesCleaned.push(mode);
          }
        }
      } catch {
      }
    }
  }
  return { filesRemoved, modesCleaned };
}
function exportSessionSummary(directory, metrics) {
  const sessionsDir = path.join(directory, ".omd", "sessions");
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }
  const sessionFile = path.join(sessionsDir, `${metrics.session_id}.json`);
  try {
    fs.writeFileSync(sessionFile, JSON.stringify(metrics, null, 2), "utf-8");
  } catch (error) {
  }
}
function processSessionEnd(input) {
  const metrics = recordSessionMetrics(input.cwd, input);
  exportSessionSummary(input.cwd, metrics);
  cleanupTransientState(input.cwd);
  cleanupModeStates(input.cwd);
  pruneOldStateFiles(input.cwd);
  vacuumSwarmDb(input.cwd);
  return { continue: true };
}

// src/hooks/subagent-tracker/index.ts
var import_fs2 = require("fs");
var import_path2 = require("path");
var STATE_FILE = "subagent-tracking.json";
var MAX_COMPLETED_AGENTS = 100;
var LOCK_TIMEOUT_MS = 5e3;
var LOCK_RETRY_MS = 50;
function syncSleep(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}
function acquireLock(directory) {
  const lockPath = (0, import_path2.join)(directory, ".omd", "state", "subagent-tracker.lock");
  const lockDir = (0, import_path2.join)(directory, ".omd", "state");
  if (!(0, import_fs2.existsSync)(lockDir)) {
    (0, import_fs2.mkdirSync)(lockDir, { recursive: true });
  }
  const startTime = Date.now();
  while (Date.now() - startTime < LOCK_TIMEOUT_MS) {
    try {
      if ((0, import_fs2.existsSync)(lockPath)) {
        const lockContent = (0, import_fs2.readFileSync)(lockPath, "utf-8");
        const lockTime = parseInt(lockContent, 10);
        if (Date.now() - lockTime > LOCK_TIMEOUT_MS) {
          try {
            (0, import_fs2.unlinkSync)(lockPath);
          } catch {
          }
        } else {
          syncSleep(LOCK_RETRY_MS);
          continue;
        }
      }
      (0, import_fs2.writeFileSync)(lockPath, String(Date.now()), { flag: "wx" });
      return true;
    } catch (e) {
      if (e.code === "EEXIST") {
        syncSleep(LOCK_RETRY_MS);
        continue;
      }
      return false;
    }
  }
  return false;
}
function releaseLock(directory) {
  const lockPath = (0, import_path2.join)(directory, ".omd", "state", "subagent-tracker.lock");
  try {
    (0, import_fs2.unlinkSync)(lockPath);
  } catch {
  }
}
function getStateFilePath(directory) {
  const stateDir = (0, import_path2.join)(directory, ".omd", "state");
  if (!(0, import_fs2.existsSync)(stateDir)) {
    (0, import_fs2.mkdirSync)(stateDir, { recursive: true });
  }
  return (0, import_path2.join)(stateDir, STATE_FILE);
}
function readTrackingState(directory) {
  const statePath = getStateFilePath(directory);
  if (!(0, import_fs2.existsSync)(statePath)) {
    return {
      agents: [],
      total_spawned: 0,
      total_completed: 0,
      total_failed: 0,
      last_updated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  try {
    const content = (0, import_fs2.readFileSync)(statePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("[SubagentTracker] Error reading state:", error);
    return {
      agents: [],
      total_spawned: 0,
      total_completed: 0,
      total_failed: 0,
      last_updated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
function writeTrackingState(directory, state) {
  const statePath = getStateFilePath(directory);
  state.last_updated = (/* @__PURE__ */ new Date()).toISOString();
  try {
    (0, import_fs2.writeFileSync)(statePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("[SubagentTracker] Error writing state:", error);
  }
}
function detectParentMode(directory) {
  const stateDir = (0, import_path2.join)(directory, ".omd", "state");
  if (!(0, import_fs2.existsSync)(stateDir)) {
    return "none";
  }
  const modeFiles = [
    { file: "ultrapilot-state.json", mode: "ultrapilot" },
    { file: "autopilot-state.json", mode: "autopilot" },
    { file: "swarm-state.json", mode: "swarm" },
    { file: "ultrawork-state.json", mode: "ultrawork" },
    { file: "ralph-state.json", mode: "ralph" }
  ];
  for (const { file, mode } of modeFiles) {
    const filePath = (0, import_path2.join)(stateDir, file);
    if ((0, import_fs2.existsSync)(filePath)) {
      try {
        const content = (0, import_fs2.readFileSync)(filePath, "utf-8");
        const state = JSON.parse(content);
        if (state.active === true || state.status === "running" || state.status === "active") {
          return mode;
        }
      } catch {
        continue;
      }
    }
  }
  return "none";
}
function processSubagentStop(input) {
  if (!acquireLock(input.cwd)) {
    return { continue: true };
  }
  try {
    const state = readTrackingState(input.cwd);
    const agentKey = `${input.session_id}:${input.task_name}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const isFailed = Boolean(input.task_error);
    const status = isFailed ? "failed" : "completed";
    const outputSummary = input.task_result ? input.task_result.substring(0, 500) : input.task_error ? input.task_error.substring(0, 500) : void 0;
    const agentIndex = state.agents.findIndex((a) => a.agent_id === agentKey);
    if (agentIndex !== -1) {
      const agent = state.agents[agentIndex];
      agent.status = status;
      agent.completed_at = now;
      if (outputSummary) {
        agent.output_summary = outputSummary;
      }
    } else {
      const parentMode = detectParentMode(input.cwd);
      const agentInfo = {
        agent_id: agentKey,
        agent_type: "Task",
        started_at: now,
        parent_mode: parentMode,
        task_description: input.task_name ? input.task_name.substring(0, 200) : void 0,
        status,
        completed_at: now,
        output_summary: outputSummary
      };
      state.agents.push(agentInfo);
      state.total_spawned++;
      if (isFailed) {
        state.total_failed++;
      } else {
        state.total_completed++;
      }
    }
    const completedAgents = state.agents.filter((a) => a.status === "completed" || a.status === "failed");
    if (completedAgents.length > MAX_COMPLETED_AGENTS) {
      completedAgents.sort((a, b) => {
        const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return timeB - timeA;
      });
      const toRemove = new Set(completedAgents.slice(MAX_COMPLETED_AGENTS).map((a) => a.agent_id));
      state.agents = state.agents.filter((a) => !toRemove.has(a.agent_id));
    }
    writeTrackingState(input.cwd, state);
    return {
      continue: true,
      hookSpecificOutput: {
        hookEventName: "SubagentStop",
        additionalContext: `Subagent ${input.task_name} ${status}`,
        agent_count: state.agents.filter((a) => a.status === "running").length
      }
    };
  } finally {
    releaseLock(input.cwd);
  }
}

// src/hooks/pre-compact/index.ts
var import_fs3 = require("fs");
var import_path3 = require("path");
var CHECKPOINT_DIR = "checkpoints";
function getCheckpointPath(directory) {
  const checkpointDir = (0, import_path3.join)(directory, ".omd", "state", CHECKPOINT_DIR);
  if (!(0, import_fs3.existsSync)(checkpointDir)) {
    (0, import_fs3.mkdirSync)(checkpointDir, { recursive: true });
  }
  return checkpointDir;
}
async function exportWisdomToNotepad(directory) {
  const notepadsDir = (0, import_path3.join)(directory, ".omd", "notepads");
  if (!(0, import_fs3.existsSync)(notepadsDir)) {
    return { wisdom: "", exported: false };
  }
  const wisdomParts = [];
  let hasWisdom = false;
  try {
    const planDirs = (0, import_fs3.readdirSync)(notepadsDir).filter((name) => {
      const path3 = (0, import_path3.join)(notepadsDir, name);
      return (0, import_fs3.statSync)(path3).isDirectory();
    });
    for (const planDir of planDirs) {
      const planPath = (0, import_path3.join)(notepadsDir, planDir);
      const wisdomFiles = ["learnings.md", "decisions.md", "issues.md", "problems.md"];
      for (const wisdomFile of wisdomFiles) {
        const wisdomPath = (0, import_path3.join)(planPath, wisdomFile);
        if ((0, import_fs3.existsSync)(wisdomPath)) {
          const content = (0, import_fs3.readFileSync)(wisdomPath, "utf-8").trim();
          if (content) {
            wisdomParts.push(`### ${planDir}/${wisdomFile}
${content}`);
            hasWisdom = true;
          }
        }
      }
    }
  } catch (error) {
    console.error("[PreCompact] Error reading wisdom files:", error);
  }
  const wisdom = wisdomParts.length > 0 ? `## Plan Wisdom

${wisdomParts.join("\n\n")}` : "";
  return { wisdom, exported: hasWisdom };
}
function saveModeSummary(directory) {
  const stateDir = (0, import_path3.join)(directory, ".omd", "state");
  const modes = {};
  const autopilotPath = (0, import_path3.join)(stateDir, "autopilot-state.json");
  if ((0, import_fs3.existsSync)(autopilotPath)) {
    try {
      const autopilotState = JSON.parse((0, import_fs3.readFileSync)(autopilotPath, "utf-8"));
      if (autopilotState.active) {
        modes.autopilot = {
          phase: autopilotState.phase || "unknown",
          originalIdea: autopilotState.originalIdea || ""
        };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading autopilot state:", error);
    }
  }
  const ralphPath = (0, import_path3.join)(stateDir, "ralph-state.json");
  if ((0, import_fs3.existsSync)(ralphPath)) {
    try {
      const ralphState = JSON.parse((0, import_fs3.readFileSync)(ralphPath, "utf-8"));
      if (ralphState.active) {
        modes.ralph = {
          iteration: ralphState.iteration || 0,
          prompt: ralphState.originalPrompt || ralphState.prompt || ""
        };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading ralph state:", error);
    }
  }
  const ultraworkPath = (0, import_path3.join)(stateDir, "ultrawork-state.json");
  if ((0, import_fs3.existsSync)(ultraworkPath)) {
    try {
      const ultraworkState = JSON.parse((0, import_fs3.readFileSync)(ultraworkPath, "utf-8"));
      if (ultraworkState.active) {
        modes.ultrawork = {
          original_prompt: ultraworkState.original_prompt || ultraworkState.prompt || ""
        };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading ultrawork state:", error);
    }
  }
  const swarmSummaryPath = (0, import_path3.join)(stateDir, "swarm-summary.json");
  if ((0, import_fs3.existsSync)(swarmSummaryPath)) {
    try {
      const swarmSummary = JSON.parse((0, import_fs3.readFileSync)(swarmSummaryPath, "utf-8"));
      if (swarmSummary.active) {
        modes.swarm = {
          session_id: swarmSummary.session_id || "active",
          task_count: swarmSummary.task_count || 0
        };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading swarm summary:", error);
    }
  }
  const ultrapilotPath = (0, import_path3.join)(stateDir, "ultrapilot-state.json");
  if ((0, import_fs3.existsSync)(ultrapilotPath)) {
    try {
      const state = JSON.parse((0, import_fs3.readFileSync)(ultrapilotPath, "utf-8"));
      if (state.active) {
        modes.ultrapilot = { session_id: state.session_id || "", worker_count: state.worker_count || 0 };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading ultrapilot state:", error);
    }
  }
  const ecomodePath = (0, import_path3.join)(stateDir, "ecomode-state.json");
  if ((0, import_fs3.existsSync)(ecomodePath)) {
    try {
      const state = JSON.parse((0, import_fs3.readFileSync)(ecomodePath, "utf-8"));
      if (state.active) {
        modes.ecomode = { original_prompt: state.original_prompt || state.prompt || "" };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading ecomode state:", error);
    }
  }
  const pipelinePath = (0, import_path3.join)(stateDir, "pipeline-state.json");
  if ((0, import_fs3.existsSync)(pipelinePath)) {
    try {
      const state = JSON.parse((0, import_fs3.readFileSync)(pipelinePath, "utf-8"));
      if (state.active) {
        modes.pipeline = { preset: state.preset || "custom", current_stage: state.current_stage || 0 };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading pipeline state:", error);
    }
  }
  const ultraqaPath = (0, import_path3.join)(stateDir, "ultraqa-state.json");
  if ((0, import_fs3.existsSync)(ultraqaPath)) {
    try {
      const state = JSON.parse((0, import_fs3.readFileSync)(ultraqaPath, "utf-8"));
      if (state.active) {
        modes.ultraqa = { cycle: state.cycle || 0, prompt: state.original_prompt || state.prompt || "" };
      }
    } catch (error) {
      console.error("[PreCompact] Error reading ultraqa state:", error);
    }
  }
  return modes;
}
function readTodoSummary(directory) {
  const todoPaths = [
    (0, import_path3.join)(directory, ".factory", "todos.json"),
    (0, import_path3.join)(directory, ".omd", "state", "todos.json")
  ];
  for (const todoPath of todoPaths) {
    if ((0, import_fs3.existsSync)(todoPath)) {
      try {
        const content = (0, import_fs3.readFileSync)(todoPath, "utf-8");
        const todos = JSON.parse(content);
        if (Array.isArray(todos)) {
          return {
            pending: todos.filter((t) => t.status === "pending").length,
            in_progress: todos.filter((t) => t.status === "in_progress").length,
            completed: todos.filter((t) => t.status === "completed").length
          };
        }
      } catch {
      }
    }
  }
  return { pending: 0, in_progress: 0, completed: 0 };
}
function createCompactCheckpoint(directory, trigger) {
  const activeModes = saveModeSummary(directory);
  const todoSummary = readTodoSummary(directory);
  return {
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    trigger,
    active_modes: activeModes,
    todo_summary: todoSummary,
    wisdom_exported: false
  };
}
function formatCompactSummary(checkpoint) {
  const lines = [
    "# PreCompact Checkpoint",
    "",
    `Created: ${checkpoint.created_at}`,
    `Trigger: ${checkpoint.trigger}`,
    ""
  ];
  const modeCount = Object.keys(checkpoint.active_modes).length;
  if (modeCount > 0) {
    lines.push("## Active Modes");
    lines.push("");
    if (checkpoint.active_modes.autopilot) {
      const ap = checkpoint.active_modes.autopilot;
      lines.push(`- **Autopilot** (Phase: ${ap.phase})`);
      lines.push(`  Original Idea: ${ap.originalIdea}`);
    }
    if (checkpoint.active_modes.ralph) {
      const ralph = checkpoint.active_modes.ralph;
      lines.push(`- **Ralph** (Iteration: ${ralph.iteration})`);
      lines.push(`  Prompt: ${ralph.prompt}`);
    }
    if (checkpoint.active_modes.ultrawork) {
      const uw = checkpoint.active_modes.ultrawork;
      lines.push(`- **Ultrawork**`);
      lines.push(`  Prompt: ${uw.original_prompt}`);
    }
    if (checkpoint.active_modes.swarm) {
      const swarm = checkpoint.active_modes.swarm;
      lines.push(`- **Swarm** (Session: ${swarm.session_id}, Tasks: ${swarm.task_count})`);
    }
    if (checkpoint.active_modes.ultrapilot) {
      const up = checkpoint.active_modes.ultrapilot;
      lines.push(`- **Ultrapilot** (Workers: ${up.worker_count})`);
    }
    if (checkpoint.active_modes.ecomode) {
      const eco = checkpoint.active_modes.ecomode;
      lines.push(`- **Ecomode**`);
      lines.push(`  Prompt: ${eco.original_prompt.substring(0, 50)}...`);
    }
    if (checkpoint.active_modes.pipeline) {
      const pipe = checkpoint.active_modes.pipeline;
      lines.push(`- **Pipeline** (Preset: ${pipe.preset}, Stage: ${pipe.current_stage})`);
    }
    if (checkpoint.active_modes.ultraqa) {
      const qa = checkpoint.active_modes.ultraqa;
      lines.push(`- **UltraQA** (Cycle: ${qa.cycle})`);
      lines.push(`  Prompt: ${qa.prompt}`);
    }
    lines.push("");
  }
  const total = checkpoint.todo_summary.pending + checkpoint.todo_summary.in_progress + checkpoint.todo_summary.completed;
  if (total > 0) {
    lines.push("## TODO Summary");
    lines.push("");
    lines.push(`- Pending: ${checkpoint.todo_summary.pending}`);
    lines.push(`- In Progress: ${checkpoint.todo_summary.in_progress}`);
    lines.push(`- Completed: ${checkpoint.todo_summary.completed}`);
    lines.push("");
  }
  if (checkpoint.wisdom_exported) {
    lines.push("## Wisdom");
    lines.push("");
    lines.push("Plan wisdom has been preserved in checkpoint.");
    lines.push("");
  }
  lines.push("---");
  lines.push("**Note:** This checkpoint preserves critical state before compaction.");
  lines.push("Review active modes to ensure continuity after compaction.");
  return lines.join("\n");
}
async function processPreCompact(input) {
  const directory = input.cwd;
  const checkpoint = createCompactCheckpoint(directory, input.trigger);
  const { wisdom, exported } = await exportWisdomToNotepad(directory);
  checkpoint.wisdom_exported = exported;
  const checkpointPath = getCheckpointPath(directory);
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const checkpointFile = (0, import_path3.join)(checkpointPath, `checkpoint-${timestamp}.json`);
  try {
    (0, import_fs3.writeFileSync)(checkpointFile, JSON.stringify(checkpoint, null, 2), "utf-8");
  } catch (error) {
    console.error("[PreCompact] Error saving checkpoint:", error);
  }
  if (exported && wisdom) {
    const wisdomFile = (0, import_path3.join)(checkpointPath, `wisdom-${timestamp}.md`);
    try {
      (0, import_fs3.writeFileSync)(wisdomFile, wisdom, "utf-8");
    } catch (error) {
      console.error("[PreCompact] Error saving wisdom:", error);
    }
  }
  const summary = formatCompactSummary(checkpoint);
  return {
    continue: true,
    systemMessage: summary
  };
}

// src/hooks/permission-handler/index.ts
var fs2 = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
var os = __toESM(require("os"), 1);
var SAFE_PATTERNS = [
  /^git (status|diff|log|branch|show)/,
  /^ls( |$)/
];
var DANGEROUS_SHELL_CHARS = /[;&|`$()<>\n\r\t\0\\{}\[\]*?~!#]/;
function isAutoApproveEnabled(customHome) {
  try {
    const baseDir = customHome || process.env.FACTORY_HOME || os.homedir();
    const configPath = path2.join(baseDir, ".factory", ".omd-config.json");
    if (!fs2.existsSync(configPath)) {
      return false;
    }
    const content = fs2.readFileSync(configPath, "utf-8");
    const config = JSON.parse(content);
    return config.autoApproveSafeCommands === true;
  } catch {
    return false;
  }
}
function isSafeCommand(command) {
  const trimmed = command.trim();
  if (DANGEROUS_SHELL_CHARS.test(trimmed)) {
    return false;
  }
  return SAFE_PATTERNS.some((pattern) => pattern.test(trimmed));
}
function createPermissionDecision(permissionDecision, permissionDecisionReason) {
  return {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision,
      permissionDecisionReason: permissionDecisionReason || "Safe read-only command"
    }
  };
}
function processPermissionRequest(input, customHome) {
  if (input.tool_name !== "Execute") {
    return { continue: true };
  }
  if (!isAutoApproveEnabled(customHome)) {
    return { continue: true };
  }
  const command = input.tool_input?.command;
  if (!command || typeof command !== "string") {
    return { continue: true };
  }
  if (isSafeCommand(command)) {
    return createPermissionDecision("allow", "Safe read-only command");
  }
  return { continue: true };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  processPermissionRequest,
  processPreCompact,
  processSessionEnd,
  processSubagentStop
});
