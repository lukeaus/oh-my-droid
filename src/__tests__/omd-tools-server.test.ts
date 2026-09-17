import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { omdToolNames, getOmdToolNames } from '../mcp/tool-names.js';
import { allTools } from '../mcp/omd-tools-server.js';
import { pythonReplTool } from '../tools/python-repl/tool.js';
import { createDroidSession } from '../index.js';

describe('omd-tools-server', () => {
  describe('omdToolNames', () => {
    it('should export 19 tools total', () => {
      expect(omdToolNames).toHaveLength(19);
    });

    it('should have 12 LSP tools', () => {
      const lspTools = omdToolNames.filter(n => n.includes('lsp_'));
      expect(lspTools).toHaveLength(12);
    });

    it('should have 2 AST tools', () => {
      const astTools = omdToolNames.filter(n => n.includes('ast_'));
      expect(astTools).toHaveLength(2);
    });

    it('should have python_repl tool', () => {
      expect(omdToolNames).toContain('mcp__t__python_repl');
      expect(allTools.find(t => t.name === 'python_repl')).toBe(pythonReplTool);
    });

    it('should have the swarm tool', () => {
      expect(omdToolNames).toContain('mcp__t__swarm');
    });

    it('should use correct MCP naming format', () => {
      omdToolNames.forEach(name => {
        expect(name).toMatch(/^mcp__t__/);
      });
    });
  });

  describe('getOmdToolNames', () => {
    it('should return all tools by default', () => {
      const tools = getOmdToolNames();
      expect(tools).toHaveLength(19);
    });

    it('should filter out LSP tools when includeLsp is false', () => {
      const tools = getOmdToolNames({ includeLsp: false });
      expect(tools.some(t => t.includes('lsp_'))).toBe(false);
      expect(tools).toHaveLength(7); // 2 AST + 1 python + 3 skills + 1 swarm
    });

    it('should filter out AST tools when includeAst is false', () => {
      const tools = getOmdToolNames({ includeAst: false });
      expect(tools.some(t => t.includes('ast_'))).toBe(false);
      expect(tools).toHaveLength(17); // 12 LSP + 1 python + 3 skills + 1 swarm
    });

    it('should filter out python_repl when includePython is false', () => {
      const tools = getOmdToolNames({ includePython: false });
      expect(tools.some(t => t.includes('python_repl'))).toBe(false);
      expect(tools).toHaveLength(18); // 12 LSP + 2 AST + 3 skills + 1 swarm
    });

    it('should filter out skills tools', () => {
      const names = getOmdToolNames({ includeSkills: false });
      expect(names).toHaveLength(16);
      expect(names.every(n => !n.includes('load_omd_skills') && !n.includes('list_omd_skills'))).toBe(true);
    });

    it('should have 3 skills tools', () => {
      const skillsTools = omdToolNames.filter(n => n.includes('load_omd_skills') || n.includes('list_omd_skills'));
      expect(skillsTools).toHaveLength(3);
    });
  });

  describe('standalone MCP wiring', () => {
    it('keeps bridge tool permissions without registering an in-process server', () => {
      const session = createDroidSession({ skipConfigLoad: true, skipContextInjection: true });
      expect(session.queryOptions.options.mcpServers).not.toHaveProperty('t');
      expect(session.queryOptions.options.allowedTools).toEqual(expect.arrayContaining(omdToolNames));
    });

    it('lists all 19 tools over stdio and dispatches skill calls', async () => {
      const client = new Client({ name: 'omd-test', version: '1.0.0' });
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: ['--import', 'tsx', fileURLToPath(new URL('../mcp/standalone-server.ts', import.meta.url))],
        stderr: 'pipe',
      });

      try {
        await client.connect(transport);
        const { tools } = await client.listTools();
        expect(tools.map(t => `mcp__t__${t.name}`)).toEqual(omdToolNames);
        expect(tools.filter(t => t.name.includes('omd_skills'))).toHaveLength(3);

        for (const projectRoot of [false, 0, 'a'.repeat(502)]) {
          const invalid = await client.callTool({
            name: 'load_omd_skills_local',
            arguments: { projectRoot },
          });
          expect(invalid.isError).toBe(true);
        }

        const result = await client.callTool({
          name: 'load_omd_skills_local',
          arguments: { projectRoot: '../outside-project' },
        });
        expect(result.isError).toBe(true);
        expect(result.content).toEqual([{
          type: 'text',
          text: 'Error: Invalid project root: path traversal not allowed',
        }]);
      } finally {
        await client.close();
        await transport.close();
      }
    });
  });
});
