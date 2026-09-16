/**
 * OMD HUD - Reasoning Indicator Element
 *
 * Renders recent reasoning activity indicator with configurable format.
 */

import type { ReasoningState, ReasoningFormat } from '../types.js';
import { RESET } from '../colors.js';

const CYAN = '\x1b[36m';

/**
 * Render reasoning indicator based on format.
 *
 * @param state - Reasoning state from transcript
 * @param format - Display format (bubble, brain, face, text)
 * @returns Formatted reasoning indicator or null if not active
 */
export function renderReasoning(
  state: ReasoningState | null,
  format: ReasoningFormat = 'text'
): string | null {
  if (!state?.active) return null;

  switch (format) {
    case 'bubble':
      return '💭';
    case 'brain':
      return '🧠';
    case 'face':
      return '🤔';
    case 'text':
      return `${CYAN}reasoning${RESET}`;
    default:
      return '💭';
  }
}
