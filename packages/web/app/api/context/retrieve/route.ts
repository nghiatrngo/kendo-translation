/**
 * MAC-RAG Context Retrieval API
 * Phase 1: Retrieve TM matches and terminology for context building
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import type { ContextObject } from '../../../../lib/context/context-builder';

export interface TMMatch {
    id: string;
    sourceText: string;
    targetText: string;
    matchPercentage: number;
    domain?: string;
    qualityScore?: number;
    createdAt: string;
}

export interface TermEntry {
    id: string;
    sourceTerm: string;
    targetTerm: string;
    domain?: string;
    type: 'required' | 'preferred' | 'do_not_translate';
    notes?: string;
}

export interface RetrievalResults {
    tmMatches: TMMatch[];
    terminology: TermEntry[];
    coverageReport: {
        tmCoverage: number;
        termCoverage: number;
        gaps: string[];
    };
}

// GET: Retrieve context (TM + terminology) for translation
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sourceText = searchParams.get('sourceText');
        const sourceLang = searchParams.get('sourceLang') || 'ja';
        const domain = searchParams.get('domain');

        if (!sourceText) {
            return NextResponse.json({ error: 'sourceText is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Retrieve TM matches
        const tmMatches = await retrieveTMMatches(supabase, sourceText, domain);

        // Retrieve terminology
        const terminology = await retrieveTerminology(supabase, sourceText, sourceLang);

        // Calculate coverage
        const coverageReport = calculateCoverage(sourceText, tmMatches, terminology);

        const results: RetrievalResults = {
            tmMatches,
            terminology,
            coverageReport,
        };

        return NextResponse.json(results);
    } catch (error) {
        console.error('Context retrieval error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve context' },
            { status: 500 }
        );
    }
}

// POST: Build full context from source text
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceText, sourceLang, targetLang } = body;

        if (!sourceText) {
            return NextResponse.json({ error: 'sourceText is required' }, { status: 400 });
        }

        // Import context builder
        const { buildContext } = await import('@/lib/context/context-builder');

        // Build context
        const context = await buildContext({
            sourceText,
            sourceLang,
            targetLang,
        });

        const supabase = await createClient();

        // Retrieve TM matches based on domain
        const tmMatches = await retrieveTMMatches(supabase, sourceText, context.domain.primary);

        // Retrieve terminology
        const terminology = await retrieveTerminology(supabase, sourceText, context.sourceLang);

        // Calculate coverage
        const coverageReport = calculateCoverage(sourceText, tmMatches, terminology);

        return NextResponse.json({
            context,
            retrieval: {
                tmMatches,
                terminology,
                coverageReport,
            },
        });
    } catch (error) {
        console.error('Context build error:', error);
        return NextResponse.json(
            { error: 'Failed to build context' },
            { status: 500 }
        );
    }
}

// === HELPER FUNCTIONS ===

async function retrieveTMMatches(
    supabase: Awaited<ReturnType<typeof createClient>>,
    sourceText: string,
    domain?: string | null
): Promise<TMMatch[]> {
    try {
        // Query translation_memory table
        // User Request: "simply retrieve from the bilingual database: Match between the japanese part"
        // We search for entries where the sourceText (or targetText) loosely matches the input.
        
        let query = supabase
            .from('translation_memory')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (domain) {
            query = query.eq('domain', domain);
        }

        const { data, error } = await query;

        if (error) {
            console.error('TM query error:', error);
            return [];
        }

        if (!data) return [];

        // calculateSimpleMatch is too strict for long texts if it checks for direct inclusion of the entire string.
        // We want to see if the TM entry is *relevant* to the source text.
        // Strategy: Check if the TM entry's source_text or target_text is contained within the input sourceText, or vice versa.
        
        const matches: TMMatch[] = data
            .map((row: any) => {
                // Check match matching
                const s1 = (row.source_text || '').toLowerCase();
                const s2 = (row.target_text || '').toLowerCase();
                const input = sourceText.toLowerCase();
                
                // Simple relevance score: Length of overlapping words / Total unique words
                // Or simply: does the TM entry appear in the text?
                
                const score1 = calculateSimpleMatch(input, s1); 
                const score2 = calculateSimpleMatch(input, s2);
                
                return {
                    id: row.id,
                    sourceText: row.source_text,
                    targetText: row.target_text,
                    matchPercentage: Math.max(score1, score2),
                    domain: row.domain,
                    qualityScore: row.quality_score,
                    createdAt: row.created_at,
                };
            })
            .filter(m => m.matchPercentage > 10) // Filter out complete noise
            .sort((a, b) => b.matchPercentage - a.matchPercentage)
            .slice(0, 5);
        
        // Fallback if no specific matches found
        if (matches.length === 0) {
             const { data: fallbackData } = await supabase
                .from('translation_memory')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

             if (fallbackData && fallbackData.length > 0) {
                console.log('[Context] No TM matches, using fallback recent entries.');
                return fallbackData.map((row: any) => ({
                    id: row.id,
                    sourceText: row.source_text,
                    targetText: row.target_text,
                    matchPercentage: 5, // Just for display
                    domain: row.domain,
                    qualityScore: row.quality_score,
                    createdAt: row.created_at,
                }));
             }
        }

        return matches;
    } catch (error) {
        console.error('TM retrieval error:', error);
        return [];
    }
}

async function retrieveTerminology(
    supabase: Awaited<ReturnType<typeof createClient>>,
    sourceText: string,
    sourceLang: string
): Promise<TermEntry[]> {
    try {
        // Query terminology table
        const { data, error } = await supabase
            .from('terminology')
            .select('*')
            .limit(200); // Increase limit

        if (error) {
            console.error('Terminology query error:', error);
            return [];
        }

        if (!data) return [];

        // Filter terms that appear in source text
        const relevantTerms: TermEntry[] = data
            .filter((row: { source_term?: string; japanese_term?: string; english_term?: string }) => {
                // Check all possible term fields
                const ja = row.japanese_term;
                const en = row.english_term;
                const src = row.source_term;
                
                // If source text contains ANY of the terms, it's relevant context
                return (ja && sourceText.includes(ja)) || 
                       (en && sourceText.includes(en)) || 
                       (src && sourceText.includes(src));
            })
            .map((row: {
                id: string;
                japanese_term?: string;
                english_term?: string;
                source_term?: string;
                target_term?: string;
                domain?: string;
                type?: string;
                notes?: string;
            }) => ({
                id: row.id,
                sourceTerm: row.japanese_term || row.source_term || '',
                targetTerm: row.english_term || row.target_term || '',
                domain: row.domain,
                type: (row.type as TermEntry['type']) || 'preferred',
                notes: row.notes,
            }));
            
        console.log(`[Context] Terminology: Found ${relevantTerms.length} matches from ${data.length} candidates.`);

        return relevantTerms;
    } catch (error) {
        console.error('Terminology retrieval error:', error);
        return [];
    }
}

function calculateSimpleMatch(source: string, target: string): number {
    if (!source || !target) return 0;

    // Normalize strings
    const s1 = source.toLowerCase().trim();
    const s2 = target.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 100;

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
        const minLen = Math.min(s1.length, s2.length);
        const maxLen = Math.max(s1.length, s2.length);
        return Math.round((minLen / maxLen) * 100);
    }

    // Calculate word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = new Set([...words1, ...words2]).size;

    if (totalWords === 0) return 0;
    return Math.round((commonWords / totalWords) * 100);
}

function calculateCoverage(
    sourceText: string,
    tmMatches: TMMatch[],
    terminology: TermEntry[]
): RetrievalResults['coverageReport'] {
    // TM coverage: percentage of source covered by TM matches
    let tmCoverage = 0;
    if (tmMatches.length > 0) {
        const bestMatch = tmMatches[0];
        tmCoverage = bestMatch.matchPercentage / 100;
    }

    // Term coverage: percentage of detected terms with translations
    // For now, assume all returned terms are covered
    const termCoverage = terminology.length > 0 ? 0.8 : 0;

    // Identify gaps (placeholder - would need more sophisticated analysis)
    const gaps: string[] = [];

    return {
        tmCoverage,
        termCoverage,
        gaps,
    };
}
