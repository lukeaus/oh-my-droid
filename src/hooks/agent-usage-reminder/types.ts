/**
 * Agent Usage Reminder Types
 *
 * Tracks agent usage to encourage delegation to specialized agents.
 *
 */

export interface AgentUsageState {
  sessionID: string;
  agentUsed: boolean;
  reminderCount: number;
  updatedAt: number;
}
