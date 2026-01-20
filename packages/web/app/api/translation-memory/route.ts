/**
 * Translation Memory API
 * 
 * GET /api/translation-memory?q=query - Search TM for similar translations
 * POST /api/translation-memory - Save a translation to TM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

/**
 * GET /api/translation-memory
 * 
 * Search translation memory for similar source text
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const minQuality = parseFloat(searchParams.get('min_quality') || '0.7');
    const onlyApproved = searchParams.get('approved') !== 'false';

    if (!query) {
        return NextResponse.json({ matches: [], count: 0 });
    }

    const supabase = await createClient();

    // Search for similar translations
    let dbQuery = supabase
        .from('translation_memory')
        .select('id, source_text, target_text, domain, quality, human_approved, usage_count')
        .gte('quality', minQuality)
        .order('quality', { ascending: false })
        .limit(limit);

    if (onlyApproved) {
        dbQuery = dbQuery.eq('human_approved', true);
    }

    // Simple text search (could be enhanced with vector search)
    dbQuery = dbQuery.ilike('source_text', `%${query.substring(0, 100)}%`);

    const { data, error } = await dbQuery;

    if (error) {
        console.error('TM search error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate similarity scores (simple character-based)
    const matches = (data || []).map(match => {
        const similarity = calculateSimilarity(query, match.source_text);
        return { ...match, similarity };
    }).filter(m => m.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({ matches, count: matches.length });
}

/**
 * POST /api/translation-memory
 * 
 * Save a translation to memory
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check translator/admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'translator'].includes(profile.role)) {
        return NextResponse.json({ error: 'Translator access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            source_text,
            target_text,
            domain = 'kendo',
            quality = 0.8,
            human_approved = false,
            article_id,
        } = body;

        if (!source_text || !target_text) {
            return NextResponse.json(
                { error: 'source_text and target_text are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('translation_memory')
            .upsert({
                source_text,
                target_text,
                domain,
                quality,
                human_approved,
                article_id: article_id || null,
                created_by: user.id,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'source_text',
            })
            .select()
            .single();

        if (error) {
            console.error('TM save error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: data });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Save failed' },
            { status: 500 }
        );
    }
}

/**
 * Simple similarity calculation (Jaccard-like for quick matching)
 */
function calculateSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));

    let intersection = 0;
    for (const char of setA) {
        if (setB.has(char)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
}
