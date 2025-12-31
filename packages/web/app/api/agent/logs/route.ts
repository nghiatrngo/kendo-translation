/**
 * Agent Logs API with Database Persistence
 * 
 * GET /api/agent/logs - Get recent logs (memory + DB)
 * POST /api/agent/logs - Save log to database
 * DELETE /api/agent/logs - Clear memory logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentLogs, getLogStats, clearLogs, type AgentLog } from '@/lib/llm/agent-logger';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const includeStats = searchParams.get('stats') === 'true';
    const articleId = searchParams.get('article_id');
    const videoId = searchParams.get('video_id');
    const source = searchParams.get('source') || 'memory'; // 'memory', 'db', or 'both'

    const response: Record<string, unknown> = {};

    // Get in-memory logs
    if (source === 'memory' || source === 'both') {
        response.logs = getRecentLogs(limit);
        if (includeStats) {
            response.stats = getLogStats();
        }
    }

    // Get database logs if requested
    if (source === 'db' || source === 'both' || articleId || videoId) {
        try {
            const supabase = await createClient();
            let query = supabase
                .from('agent_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (articleId) {
                query = query.eq('article_id', articleId);
            }
            if (videoId) {
                query = query.eq('video_id', videoId);
            }

            const { data: dbLogs, error } = await query;

            if (error) {
                console.error('DB logs error:', error);
            } else {
                response.dbLogs = dbLogs;
            }
        } catch (err) {
            console.error('Failed to fetch DB logs:', err);
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
