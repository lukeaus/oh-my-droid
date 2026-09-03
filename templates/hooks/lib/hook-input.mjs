/**
 * Shared Hook Input Normalizer
 * Normalizes Factory Droid hook input payloads to documented snake_case fields.
 * Supports legacy camelCase fields as aliases.
 *
 * Reference: https://docs.factory.ai/harness/hooks.md
 */

/**
 * Extract readable text from tool_response (which may be a string, object, or array)
 * @param {unknown} response
 * @returns {string}
 */
export function extractResponseText(response) {
  if (response == null) return '';
  if (typeof response === 'string') return response;
  if (typeof response === 'object') {
    if (typeof response.stdout === 'string' || typeof response.stderr === 'string') {
      const parts = [response.stdout, response.stderr].filter(Boolean);
      return parts.join('\n').trim();
    }
    if (typeof response.output === 'string') return response.output;
    if (typeof response.content === 'string') return response.content;
    if (Array.isArray(response)) {
      return response.map(item => extractResponseText(item)).filter(Boolean).join('\n');
    }
    try {
      return JSON.stringify(response);
    } catch {
      return String(response);
    }
  }
  return String(response);
}

/**
 * Normalize raw hook input from stdin JSON
 * @param {unknown} raw - Parsed JSON or raw string
 * @returns {Record<string, any>} Normalized hook input object
 */
export function normalizeHookInput(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }
  if (!data || typeof data !== 'object') {
    return {
      session_id: undefined,
      cwd: undefined,
      tool_name: undefined,
      tool_input: undefined,
      tool_response: undefined,
      tool_response_text: '',
      hook_event_name: undefined,
      prompt: undefined,
      source: undefined,
      reason: undefined,
      trigger: undefined,
      task_name: undefined,
      task_result: undefined,
      task_error: undefined,
      stop_hook_active: undefined,
      raw: {},
    };
  }

  const session_id = data.session_id ?? data.sessionId;
  const cwd = data.cwd ?? data.directory;
  const tool_name = data.tool_name ?? data.toolName;
  const tool_input = data.tool_input ?? data.toolInput;
  const tool_response = data.tool_response ?? data.toolOutput;
  const hook_event_name = data.hook_event_name ?? data.hookEventName;
  const prompt = data.prompt ?? data.user_prompt ?? (data.message?.content || (Array.isArray(data.parts) ? data.parts.filter(p => p.type === 'text').map(p => p.text).join(' ') : undefined));
  const source = data.source;
  const reason = data.reason;
  const trigger = data.trigger;
  const task_name = data.task_name ?? data.taskName;
  const task_result = data.task_result ?? data.taskResult;
  const task_error = data.task_error ?? data.taskError;
  const stop_hook_active = data.stop_hook_active ?? data.stopHookActive;

  return {
    session_id,
    cwd,
    tool_name,
    tool_input,
    tool_response,
    tool_response_text: extractResponseText(tool_response),
    hook_event_name,
    prompt,
    source,
    reason,
    trigger,
    task_name,
    task_result,
    task_error,
    stop_hook_active,
    raw: data,
  };
}
