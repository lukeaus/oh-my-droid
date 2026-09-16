/**
 * Tool Registry and MCP Server Creation
 *
 * This module exports all custom tools and provides helpers
 * for creating MCP servers with the Factory Droid SDK.
 */

import { z } from 'zod';
import { lspTools } from './lsp-tools.js';
import { astTools } from './ast-tools.js';
import { pythonReplTool } from './python-repl/index.js';

export { lspTools } from './lsp-tools.js';
export { astTools } from './ast-tools.js';
export { pythonReplTool } from './python-repl/index.js';

/**
 * Generic tool definition type
 */
export interface GenericToolDefinition {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
}

/**
 * All custom tools available in the system
 */
export const allCustomTools: GenericToolDefinition[] = [
  ...lspTools as unknown as GenericToolDefinition[],
  ...astTools as unknown as GenericToolDefinition[],
  pythonReplTool as unknown as GenericToolDefinition
];

/**
 * Get tools by category
 */
export function getToolsByCategory(category: 'lsp' | 'ast' | 'all'): GenericToolDefinition[] {
  switch (category) {
    case 'lsp':
      return lspTools as unknown as GenericToolDefinition[];
    case 'ast':
      return astTools as unknown as GenericToolDefinition[];
    case 'all':
      return allCustomTools;
  }
}

/**
 * Create a Zod schema object from a tool's schema definition
 */
export function createZodSchema<T extends z.ZodRawShape>(schema: T): z.ZodObject<T> {
  return z.object(schema);
}

/**
 * Format for creating tools compatible with Factory Droid SDK
 */
export interface SdkToolFormat {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * Convert our tool definitions to SDK format
 */
export function toSdkToolFormat(tool: GenericToolDefinition): SdkToolFormat {
  const zodSchema = z.object(tool.schema);
  const jsonSchema = z.toJSONSchema(zodSchema);

  return {
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: jsonSchema.properties ?? {},
      required: jsonSchema.required ?? []
    }
  };
}
