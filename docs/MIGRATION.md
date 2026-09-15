# Migration Guide

## 4.0.0 (unreleased)

This is a major release because it removes the Claude Agent SDK integration and renames public APIs.

### Use the standalone MCP bridge

- `@anthropic-ai/claude-agent-sdk` is no longer a dependency. The existing standalone bridge uses `@modelcontextprotocol/sdk` and stdio instead.
- Remove imports of `omdToolsServer` and integrations relying on the old `sdkTools` adapter. `src/mcp/omc-tools-server.ts` remains as the shared tool registry, without the in-process server.
- `omcToolNames` and `getOmcToolNames` remain available; their implementation moves to `src/mcp/tool-names.ts`.
- `createDroidSession()` no longer injects an in-process `t` server. Its allowed tool names retain the `mcp__t__` prefix; permission entries alone do not register a server.
- Plugin installs use the `t` entry in `.mcp.json`, which launches `bridge/mcp-server.cjs` with Node. Programmatic consumers must configure that standalone stdio bridge in their MCP client, using an absolute path to the installed bundle. Keep the server ID `t` so tool names match.

See [MCP Tools](REFERENCE.md#mcp-tools) for registration and the tool inventory.

### Update public names

| Before | 4.0.0 |
|--------|-------|
| `getClaudeConfigDir` | `getFactoryConfigDir` |
| `isClaudeInstalled` | `isDroidInstalled` |
| `skipClaudeCheck` | `skipDroidCheck` |
| `PaneAnalysisResult.hasClaudeCode` | `PaneAnalysisResult.hasDroid` |

Update imports, option objects, and pane-result consumers to the new names.

### Removed unsupported behavior

- Claude-specific non-interactive environment signals are removed.
- The HUD no longer reads or refreshes Anthropic OAuth credentials for rate-limit data. There is no replacement Factory quota API integration in this release.
- `checkRateLimitStatus()` preserves its async public API but resolves to `null` (quota unknown). Status formatters remain available; unknown quota does not trigger automatic resume.
- The [benchmark harness](../benchmark/README.md) and [seminar materials](../seminar/README.md) remain historical, unsupported, and excluded from the package. They are not being ported.
