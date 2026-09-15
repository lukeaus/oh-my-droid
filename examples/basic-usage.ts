/**
 * Basic Usage Example
 *
 * This example demonstrates how to use Oh-My-Droid
 * to prepare prompts and configuration for Factory Droid.
 */

// Note: In real usage, import from 'oh-my-droid'
import { createDroidSession, enhancePrompt } from '../src/index.js';

async function main() {
  console.log('=== Oh-My-Droid Example ===\n');

  // Create a OMD session
  const session = createDroidSession({
    // Optional: custom configuration overrides
    config: {
      features: {
        parallelExecution: true,
        continuationEnforcement: true
      }
    }
  });

  console.log('Session created with:');
  console.log(`- ${Object.keys(session.queryOptions.options.agents).length} subagents`);
  console.log(`- ${Object.keys(session.queryOptions.options.mcpServers).length} MCP servers`);
  console.log(`- ${session.queryOptions.options.allowedTools.length} allowed tools\n`);

  // Example 1: Basic prompt processing
  const basicPrompt = 'Fix the authentication bug';
  console.log('Example 1: Basic prompt');
  console.log(`Input:  "${basicPrompt}"`);
  console.log(`Output: "${session.processPrompt(basicPrompt)}"\n`);

  // Example 2: Ultrawork mode
  const ultraworkPrompt = 'ultrawork refactor the entire authentication module';
  console.log('Example 2: Ultrawork mode');
  console.log(`Input:  "${ultraworkPrompt}"`);
  console.log('Detected keywords:', session.detectKeywords(ultraworkPrompt));
  console.log('Enhanced prompt:');
  console.log(session.processPrompt(ultraworkPrompt).substring(0, 500) + '...\n');

  // Example 3: Search mode
  const searchPrompt = 'search for all API endpoints in the codebase';
  console.log('Example 3: Search mode');
  console.log(`Input:  "${searchPrompt}"`);
  console.log('Detected keywords:', session.detectKeywords(searchPrompt));
  console.log('Enhanced prompt:');
  console.log(session.processPrompt(searchPrompt) + '\n');

  // Example 4: Factory Droid CLI (printed command, not executed)
  console.log('Example 4: Using the Factory Droid CLI');
  console.log(`
# With the oh-my-droid plugin installed:
droid exec "ultrawork implement user authentication"

# Custom tools are discovered through the plugin's standalone MCP bridge.
`);

  // Example 5: Direct prompt enhancement
  console.log('Example 5: Quick enhance (without session)');
  const quick = enhancePrompt('analyze the performance bottleneck');
  console.log('Enhanced:', quick.substring(0, 200) + '...\n');

  // Show system prompt snippet
  console.log('=== System Prompt Preview ===');
  console.log(session.queryOptions.options.systemPrompt.substring(0, 500) + '...\n');
}

main().catch(console.error);
