/**
 * Agent Logs API with Database Persistence
 * 
 * GET /api/agent/logs - Get recent logs (memory + DB)
 * POST /api/agent/logs - Save log to database
 * DELETE /api/agent/logs - Clear memory logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentLogs, getLogStats, clearLogs, type AgentLog } from '../../../../lib/llm/agent-logger';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const includeStats = searchParams.get('stats') === 'true';
    const articleId = searchParams.get('article_id');
    const videoId = searchParams.get('video_id');
    const source = searchParams.get('source') || 'db'; // Default to DB for persistence

    const response: Record<string, unknown> = {};

    // Get database logs (defaulting to DB for persistence)
    // If source is explicitly 'memory', use memory.
    if (source === 'memory') {
        response.logs = getRecentLogs(limit);
    } else {
        // Source is 'db' or 'both' or undefined (default to DB)
        try {
            const supabase = await createClient();
            let query = supabase
                .from('agent_logs')
                .select('*')
                .order('created_at', { ascending: false });

            // If filtering by article, fetch all logs (up to a safe max like 1000)
            // otherwise default to standard limit
            if (articleId) {
                query = query.eq('article_id', articleId).limit(1000);
            } else if (videoId) {
                query = query.eq('video_id', videoId).limit(1000);
            } else {
                query = query.limit(limit);
            }

            const { data: dbLogs, error } = await query;

            if (error) {
                console.error('DB logs error:', error);
                // Fallback to memory if DB fails
                response.logs = getRecentLogs(limit);
            } else {
                // Map DB logs to AgentLog format
                response.logs = dbLogs.map((row: any) => ({
                    id: row.id,
                    timestamp: row.created_at,
                    agentType: row.agent_type,
                    messages: [
                        ...(row.system_prompt ? [{ role: 'system', content: row.system_prompt }] : []),
                        ...(row.user_prompt ? [{
                            role: 'user',
                            content: row.user_prompt
                        }] : []) // Note: user_prompt might need parsing if it stored JSON array string, but we stored content or JSON string. 
                        // In agent-logger.ts: user_prompt: log.messages.find(m => m.role === 'user')?.content || JSON.stringify(log.messages)
                        // If it's a string from content, it's just user message. If it's JSON array, we might want to parse? 
                        // For simplicity, let's treat it as user content for now, or check if it looks like JSON array.
                    ],
                    response: row.response,
                    model: row.model,
                    usage: {
                        promptTokens: row.prompt_tokens || 0,
                        completionTokens: row.completion_tokens || 0
                    },
                    durationMs: row.duration_ms,
                    error: row.error
                }));
            }
        } catch (err) {
            console.error('Failed to fetch DB logs:', err);
            response.logs = getRecentLogs(limit);
        }
    }

    if (includeStats) {
        // Calculate stats from the fetched logs to ensure consistency
        const logs = (response.logs as any[]) || [];
        const totalCalls = logs.length;
        
        if (totalCalls > 0) {
            const byAgent: Record<string, number> = {};
            let totalTokens = 0;
            let totalDuration = 0;

            for (const log of logs) {
                const agentType = log.agentType || 'unknown';
                byAgent[agentType] = (byAgent[agentType] || 0) + 1;
                totalTokens += (log.usage?.promptTokens || 0) + (log.usage?.completionTokens || 0);
                totalDuration += log.durationMs || 0;
            }

            response.stats = {
                totalCalls,
                byAgent,
                totalTokens,
                avgDurationMs: Math.round(totalDuration / totalCalls)
            };
        } else {
            // If no logs found in DB/memory context, return empty stats
            response.stats = {
                totalCalls: 0,
                byAgent: {},
                totalTokens: 0,
                avgDurationMs: 0
            };
        }
    }

    return NextResponse.json(response);
}

/**
 * POST /api/agent/logs
 * 
 * Save an agent log entry to the database
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            article_id,
            video_id,
            agent_type,
            model,
            system_prompt,
            user_prompt,
            response,
            prompt_tokens,
            completion_tokens,
            duration_ms,
            error: logError,
        } = body;

        // Validate required fields
        if (!agent_type || !user_prompt) {
            return NextResponse.json(
                { error: 'agent_type and user_prompt are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('agent_logs')
            .insert({
                user_id: user.id,
                article_id: article_id || null,
                video_id: video_id || null,
                agent_type,
                model,
                system_prompt,
                user_prompt,
                response,
                prompt_tokens,
                completion_tokens,
                duration_ms,
                error: logError,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to save agent log:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, log: data });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to save log' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/agent/logs
 * 
 * Clears in-memory logs only (DB logs are retained)
 */
export async function DELETE() {
    clearLogs();
    return NextResponse.json({ success: true, message: 'Memory logs cleared' });
}
