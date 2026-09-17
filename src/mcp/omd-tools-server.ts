/**
 * OMD tool registry shared by the standalone MCP server and tool-name helpers.
 *
 * Contains 19 tools: 12 LSP, 2 AST, 1 Python REPL, 3 skills, and 1 swarm.
 */

import type { z } from 'zod';
import { lspTools } from "../tools/lsp-tools.js";
import { astTools } from "../tools/ast-tools.js";
import { pythonReplTool } from "../tools/python-repl/tool.js";
import { skillsTools } from "../tools/skills-tools.js";
import { swarmTool } from "../tools/swarm-tool.js";

// Type for our tool definitions
interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodRawShape | z.ZodObject<z.ZodRawShape>;
  handler: (args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
}

// Aggregate all custom tools
export const allTools: ToolDef[] = [
  ...(lspTools as unknown as ToolDef[]),
  ...(astTools as unknown as ToolDef[]),
  pythonReplTool as unknown as ToolDef,
  ...(skillsTools as unknown as ToolDef[]),
  swarmTool as unknown as ToolDef
];
