import { describe, it, expect } from 'vitest';
import type { ModelIdentifier, ModelType, AgentConfig, PluginConfig } from '../shared/types.js';

describe('Type Tests', () => {
  describe('ModelIdentifier', () => {
    it('should accept inherit or custom model strings', () => {
      const validIdentifiers: ModelIdentifier[] = ['inherit', 'custom:gpt-4o', 'claude-sonnet-4-5-20250929'];
      expect(validIdentifiers).toHaveLength(3);
    });
  });

  describe('ModelType (deprecated)', () => {
    it('should accept legacy model types for backwards compatibility', () => {
      const validTypes: ModelType[] = ['sonnet', 'opus', 'haiku', 'inherit'];
      expect(validTypes).toHaveLength(4);
    });
  });

  describe('AgentConfig', () => {
    it('should create valid agent config', () => {
      const config: AgentConfig = {
        name: 'test-agent',
        description: 'A test agent',
        prompt: 'Test prompt',
        tools: ['tool1', 'tool2'],
        model: 'inherit',
      };

      expect(config.name).toBe('test-agent');
      expect(config.tools).toHaveLength(2);
      expect(config.model).toBe('inherit');
    });

    it('should allow optional model field', () => {
      const config: AgentConfig = {
        name: 'test-agent',
        description: 'A test agent',
        prompt: 'Test prompt',
        tools: [],
      };

      expect(config.model).toBeUndefined();
    });
  });

  describe('PluginConfig', () => {
    it('should create valid plugin config with features', () => {
      const config: PluginConfig = {
        features: {
          parallelExecution: true,
          lspTools: true,
          astTools: false,
          continuationEnforcement: true,
          autoContextInjection: false,
        },
      };

      expect(config.features?.parallelExecution).toBe(true);
      expect(config.features?.astTools).toBe(false);
    });

    it('should support agent configuration', () => {
      const config: PluginConfig = {
        agents: {
          omd: { model: 'claude-sonnet-4-5' },
          architect: { model: 'claude-opus-4-5', enabled: true },
          researcher: { model: 'claude-haiku-4-5' },
        },
      };

      expect(config.agents?.omd?.model).toBe('claude-sonnet-4-5');
      expect(config.agents?.architect?.enabled).toBe(true);
    });

    it('should support routing configuration', () => {
      const config: PluginConfig = {
        routing: {
          enabled: true,
          defaultTier: 'MEDIUM',
          escalationEnabled: true,
          maxEscalations: 2,
          agentOverrides: {
            architect: { tier: 'HIGH', reason: 'Advisory agent requires deep reasoning' },
          },
        },
      };

      expect(config.routing?.enabled).toBe(true);
      expect(config.routing?.defaultTier).toBe('MEDIUM');
      expect(config.routing?.agentOverrides?.architect.tier).toBe('HIGH');
    });
  });
});
