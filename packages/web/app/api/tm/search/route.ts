/**
 * Translation Memory Search API
 * 
 * POST /api/tm/search
 * 
 * Searches translation memory for similar source texts.
 * Uses Postgres text search for now (vector search can be added when embeddings are generated).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface TMMatch {
    id: string;
    source_text: string;
    target_text: string;
    similarity: number;
    quality: string;
    domain: string;
}

interface SearchRequest {
    source_text: string;
    limit?: number;
}

interface SearchResponse {
    matches: TMMatch[];
    query_length: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: SearchRequest = await request.json();

        if (!body.source_text || body.source_text.trim().length === 0) {
            return NextResponse.json(
                { error: 'source_text is required' },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: 'Supabase not configured' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const limit = body.limit || 5;
        const sourceText = body.source_text.trim();

        // Strategy: Use multiple search approaches and combine results
        const matches: TMMatch[] = [];
        const seenIds = new Set<string>();

        // 1. Exact substring match (highest priority)
        const { data: exactMatches } = await supabase
            .from('translation_memory')
            .select('id, source_text, target_text, quality, domain')
            .ilike('source_text', `%${sourceText.substring(0, 50)}%`)
            .limit(limit);

        if (exactMatches) {
            for (const match of exactMatches) {
                if (!seenIds.has(match.id)) {
                    seenIds.add(match.id);
                    matches.push({
                        ...match,
                        similarity: calculateTextSimilarity(sourceText, match.source_text)
                    });
                }
            }
        }

        // 2. Word-based search - extract key terms
        const keyTerms = extractKeyTerms(sourceText);
        if (keyTerms.length > 0 && matches.length < limit) {
            for (const term of keyTerms.slice(0, 3)) {
                const { data: termMatches } = await supabase
                    .from('translation_memory')
                    .select('id, source_text, target_text, quality, domain')
                    .ilike('source_text', `%${term}%`)
                    .limit(5);

                if (termMatches) {
                    for (const match of termMatches) {
                        if (!seenIds.has(match.id) && matches.length < limit * 2) {
                            seenIds.add(match.id);
                            matches.push({
                                ...match,
                                similarity: calculateTextSimilarity(sourceText, match.source_text)
                            });
                        }
                    }
                }
            }
        }

        // Sort by similarity and return top results
        matches.sort((a, b) => b.similarity - a.similarity);
        const topMatches = matches.slice(0, limit);

        const result: SearchResponse = {
            matches: topMatches,
            query_length: sourceText.length,
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('TM Search error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Search failed' },
            { status: 500 }
        );
    }
}

/**
 * Calculate text similarity using character overlap (Jaccard-like)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
    const chars1 = new Set(text1.split(''));
    const chars2 = new Set(text2.split(''));

    let intersection = 0;
    for (const char of chars1) {
        if (chars2.has(char)) {
            intersection++;
        }
    }

    const union = chars1.size + chars2.size - intersection;
    const charSimilarity = union > 0 ? intersection / union : 0;

    // Also consider length ratio
    const lengthRatio = Math.min(text1.length, text2.length) / Math.max(text1.length, text2.length);

    // Weighted combination
    return charSimilarity * 0.7 + lengthRatio * 0.3;
}

/**
 * Extract key terms from Japanese text for search
 */
function extractKeyTerms(text: string): string[] {
    // Match kanji compounds, katakana words, and meaningful phrases
    const kanjiPattern = /[\u4e00-\u9faf]{2,}/g;
    const katakanaPattern = /[\u30a0-\u30ff]{3,}/g;

    const terms: string[] = [];

    const kanjiMatches = text.match(kanjiPattern) || [];
    const katakanaMatches = text.match(katakanaPattern) || [];

    terms.push(...kanjiMatches);
    terms.push(...katakanaMatches);

    // Deduplicate and limit
    const unique = [...new Set(terms)];
    return unique.slice(0, 10);
}
