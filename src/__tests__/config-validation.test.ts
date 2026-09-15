import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('../index.js', () => ({ createDroidSession: vi.fn() }));
vi.mock('../cli/commands/wait.js', () => ({
  waitCommand: vi.fn(),
  waitStatusCommand: vi.fn(),
  waitDaemonCommand: vi.fn(),
  waitDetectCommand: vi.fn(),
}));
vi.mock('../config/loader.js', () => ({
  loadConfig: () => ({ mcpServers: { exa: { enabled: false } } }),
  getConfigPaths: vi.fn(),
  generateConfigSchema: vi.fn(),
}));

let program: Command;

beforeAll(async () => {
  const parse = vi.spyOn(Command.prototype, 'parse').mockReturnThis();
  await import('../cli/index.js');
  const parsedProgram = parse.mock.contexts[0];
  if (!(parsedProgram instanceof Command)) throw new Error('CLI did not register commands');
  program = parsedProgram;
  parse.mockRestore();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('config --validate', () => {
  it.each([undefined, '', 'test-factory-key'])('checks the Factory API key (%s)', async (key) => {
    vi.stubEnv('FACTORY_API_KEY', key);
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-legacy-key');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['config', '--validate'], { from: 'user' });

    const output = log.mock.calls.flat().join('\n');
    expect(output.includes('FACTORY_API_KEY environment variable not set')).toBe(!key);
    expect(output.includes('Configuration is valid!')).toBe(Boolean(key));
    expect(output).not.toContain('ANTHROPIC_API_KEY');
  });
});
