import { describe, it, expect } from 'vitest';
import { toSdkToolFormat } from '../../tools/index.js';
import { z } from 'zod';

describe('toSdkToolFormat', () => {
  it('converts a zod schema to the SDK JSON-schema shape', () => {
    const result = toSdkToolFormat({
      name: 'demo_tool',
      description: 'A demo tool',
      schema: {
        file: z.string(),
        count: z.number().int().optional(),
        kind: z.enum(['a', 'b']),
        tags: z.array(z.string()),
      },
      handler: async () => ({ content: [{ type: 'text' as const, text: 'ok' }] }),
    });

    expect(result.name).toBe('demo_tool');
    expect(result.inputSchema.type).toBe('object');
    expect(Object.keys(result.inputSchema.properties)).toEqual(['file', 'count', 'kind', 'tags']);
    expect(result.inputSchema.required).toEqual(['file', 'kind', 'tags']);
    // spot-check type/format mapping at the wire level
    const props = result.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.file.type).toBe('string');
    expect(props.kind.type).toBe('string');
    expect(props.kind.enum).toEqual(['a', 'b']);
    expect(props.tags.type).toBe('array');
  });
});
