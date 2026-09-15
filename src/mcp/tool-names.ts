import { allTools } from './omc-tools-server.js';

/** Tool names exposed by the standalone MCP server for allowedTools configuration. */
export const omcToolNames = allTools.map(t => `mcp__t__${t.name}`);

/** Get tool names filtered by category. */
export function getOmcToolNames(options?: {
  includeLsp?: boolean;
  includeAst?: boolean;
  includePython?: boolean;
  includeSkills?: boolean;
}): string[] {
  const { includeLsp = true, includeAst = true, includePython = true, includeSkills = true } = options || {};

  return omcToolNames.filter(name => {
    if (!includeLsp && name.includes('lsp_')) return false;
    if (!includeAst && name.includes('ast_')) return false;
    if (!includePython && name.includes('python_repl')) return false;
    if (!includeSkills && (name.includes('load_omc_skills') || name.includes('list_omc_skills'))) return false;
    return true;
  });
}
