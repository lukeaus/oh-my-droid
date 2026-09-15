# Reference

## MCP Tools

The standalone stdio server exposes **19 tools** through `@modelcontextprotocol/sdk`, without the Claude Agent SDK.

### Registration

Plugin discovery reads `.mcp.json`: server ID `t` runs Node with `${DROID_PLUGIN_ROOT}/bridge/mcp-server.cjs`. The bundle is built from `src/mcp/standalone-server.ts`.

For programmatic use, configure a stdio server named `t` in your MCP client, with command `node` and the absolute path to the installed `bridge/mcp-server.cjs` as its argument. `createDroidSession()` does not register this server. It retains allowed tool names with the `mcp__t__` prefix, so the client must register the bridge separately.

`src/mcp/tool-names.ts` provides `omcToolNames` and `getOmcToolNames`; it does not create an in-process server. The short server ID `t` is unchanged.

### Tool inventory

Names below are unprefixed MCP names; session permissions use `mcp__t__<name>`.

| Category | Count | Tools |
|----------|-------|-------|
| LSP | 12 | `lsp_hover`, `lsp_goto_definition`, `lsp_find_references`, `lsp_document_symbols`, `lsp_workspace_symbols`, `lsp_diagnostics`, `lsp_diagnostics_directory`, `lsp_servers`, `lsp_prepare_rename`, `lsp_rename`, `lsp_code_actions`, `lsp_code_action_resolve` |
| AST | 2 | `ast_grep_search`, `ast_grep_replace` |
| Python REPL | 1 | `python_repl` |
| Swarm coordination | 1 | `swarm` |
| Skill discovery | 3 | `load_omc_skills_local`, `load_omc_skills_global`, `list_omc_skills` |

Use MCP `tools/list` to obtain current input schemas. LSP operations require the corresponding language server; Python execution requires Python. If tools are missing, check that the client loaded server `t` and can launch the installed bridge; allowed-tool entries alone cannot make tools available.

See [4.0.0 migration](MIGRATION.md#400-unreleased) for removed SDK exports and public API renames.
