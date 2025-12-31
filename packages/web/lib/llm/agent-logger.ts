/**
 * Agent Logger - Tracks all agent LLM calls for debugging and transparency
 * 
 * Provides in-memory storage of agent conversations that can be viewed in the UI.
 */

import type { Message } from './provider';

export interface AgentLog {
    id: string;
    timestamp: Date;
    agentType: string;
    messages: Message[];
    response: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
    durationMs: number;
    error?: string;
}

// In-memory log store (survives hot reloads in dev, cleared on server restart)
const agentLogs: AgentLog[] = [];
const MAX_LOGS = 100; // Keep last 100 logs

/**
 * Generate a unique ID for log entries
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log an agent call
 */
export function logAgentCall(log: Omit<AgentLog, 'id' | 'timestamp'>): AgentLog {
    const entry: AgentLog = {
        id: generateId(),
        timestamp: new Date(),
        ...log,
    };

    agentLogs.unshift(entry); // Add to front (newest first)

    // Trim to max size
    if (agentLogs.length > MAX_LOGS) {
        agentLogs.pop();
    }

    return entry;
}

/**
 * Get recent agent logs
 */
export function getRecentLogs(limit: number = 50): AgentLog[] {
    return agentLogs.slice(0, limit);
}

/**
 * Get logs for a specific agent type
 */
export function getLogsByAgent(agentType: string, limit: number = 20): AgentLog[] {
    return agentLogs
        .filter(log => log.agentType === agentType)
        .slice(0, limit);
}

/**
 * Clear all logs (useful for testing)
 */
export function clearLogs(): void {
    agentLogs.length = 0;
}

/**
 * Get log statistics
 */
export function getLogStats(): {
    totalCalls: number;
    byAgent: Record<string, number>;
    totalTokens: number;
    avgDurationMs: number;
} {
    const byAgent: Record<string, number> = {};
    let totalTokens = 0;
    let totalDuration = 0;

    for (const log of agentLogs) {
        byAgent[log.agentType] = (byAgent[log.agentType] || 0) + 1;
        if (log.usage) {
            totalTokens += log.usage.promptTokens + log.usage.completionTokens;
        }
        totalDuration += log.durationMs;
    }

    return {
        totalCalls: agentLogs.length,
        byAgent,
        totalTokens,
        avgDurationMs: agentLogs.length > 0 ? Math.round(totalDuration / agentLogs.length) : 0,
    };
}
