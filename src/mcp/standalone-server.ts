#!/usr/bin/env node
/**
 * Standalone MCP Server for OMC Tools
 *
 * This server exposes 19 LSP, AST, Python REPL, skills, and swarm tools via stdio transport
 * for discovery by Factory Droid's MCP management system.
 *
 * Usage: node dist/mcp/standalone-server.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools } from './omc-tools-server.js';
import { z } from 'zod';

// JSON Schema from a Zod schema (native in zod 4)
function zodToJsonSchema(schema: z.ZodRawShape | z.ZodObject<z.ZodRawShape>): {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
} {
  const zodObj = schema instanceof z.ZodObject ? schema : z.object(schema);
  const jsonSchema = z.toJSONSchema(zodObj);
  return {
    type: 'object',
    properties: (jsonSchema.properties ?? {}) as Record<string, unknown>,
    required: jsonSchema.required ?? []
  };
}

// Create the MCP server
const server = new Server(
  {
    name: 't',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.schema),
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = allTools.find(t => t.name === name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const schema = tool.schema instanceof z.ZodObject ? tool.schema : z.object(tool.schema);
    const result = await tool.handler(schema.parse(args ?? {}));
    return {
      content: result.content,
      isError: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OMC Tools MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
