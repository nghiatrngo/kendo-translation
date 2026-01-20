/**
 * MAC-RAG Memory Save API
 * Phase 4: Save translation pairs to TM and update terminology
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export interface SaveTMRequest {
    sourceText: string;
    targetText: string;
    sourceLang: 'ja' | 'en';
    targetLang: 'ja' | 'en';
    domain?: string;
    qualityScore?: number;
    articleId?: string;
    userId?: string;
}

export interface SaveTermRequest {
    sourceTerm: string;
    targetTerm: string;
    domain?: string;
    type: 'required' | 'preferred' | 'do_not_translate';
    notes?: string;
}

export interface SaveMemoryRequest {
    translationMemory?: SaveTMRequest;
    terminology?: SaveTermRequest[];
    contextFeedback?: {
        tmMatchId?: string;
        wasHelpful: boolean;
    }[];
}

// POST: Save translation to memory
export async function POST(request: NextRequest) {
    try {
        const body: SaveMemoryRequest = await request.json();
        const supabase = await createClient();

        const results = {
            tmSaved: false,
            termsSaved: 0,
            feedbackSaved: 0,
            errors: [] as string[],
        };

        // Save to Translation Memory
        if (body.translationMemory) {
            try {
                const tm = body.translationMemory;
                const { error } = await supabase
                    .from('translation_memory')
                    .insert({
                        source_text: tm.sourceText,
                        target_text: tm.targetText,
                        source_lang: tm.sourceLang,
                        target_lang: tm.targetLang,
                        domain: tm.domain || 'general',
                        quality_score: tm.qualityScore || 0.75,
                        article_id: tm.articleId,
                        user_id: tm.userId,
                        created_at: new Date().toISOString(),
                    });

                if (error) {
                    console.error('TM save error:', error);
                    results.errors.push(`TM save failed: ${error.message}`);
                } else {
                    results.tmSaved = true;
                }
            } catch (err) {
                console.error('TM save exception:', err);
                results.errors.push('TM save failed: unexpected error');
            }
        }

        // Save terminology
        if (body.terminology && body.terminology.length > 0) {
            for (const term of body.terminology) {
                try {
                    const { error } = await supabase
                        .from('terminology')
                        .upsert({
                            japanese_term: term.sourceTerm,
                            english_term: term.targetTerm,
                            domain: term.domain || 'kendo',
                            type: term.type,
                            notes: term.notes,
                            updated_at: new Date().toISOString(),
                        }, {
                            onConflict: 'japanese_term',
                        });

                    if (error) {
                        console.error('Term save error:', error);
                        results.errors.push(`Term "${term.sourceTerm}" save failed`);
                    } else {
                        results.termsSaved++;
                    }
                } catch (err) {
                    console.error('Term save exception:', err);
                }
            }
        }

        // Save context feedback (for improving retrieval)
        if (body.contextFeedback && body.contextFeedback.length > 0) {
            for (const feedback of body.contextFeedback) {
                if (!feedback.tmMatchId) continue;

                try {
                    // Update TM entry with feedback (increment helpful/not helpful counter)
                    const column = feedback.wasHelpful ? 'helpful_count' : 'not_helpful_count';
                    const { error } = await supabase.rpc('increment_tm_feedback', {
                        tm_id: feedback.tmMatchId,
                        column_name: column,
                    });

                    if (!error) {
                        results.feedbackSaved++;
                    }
                } catch (err) {
                    // Ignore feedback save errors - not critical
                }
            }
        }

        return NextResponse.json({
            success: results.errors.length === 0,
            ...results,
        });
    } catch (error) {
        console.error('Memory save error:', error);
        return NextResponse.json(
            { error: 'Failed to save to memory', success: false },
            { status: 500 }
        );
    }
}

// GET: Check if translation pair exists in TM
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sourceText = searchParams.get('sourceText');

        if (!sourceText) {
            return NextResponse.json({ exists: false });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('translation_memory')
            .select('id, target_text, quality_score')
            .eq('source_text', sourceText)
            .limit(1);

        if (error || !data || data.length === 0) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({
            exists: true,
            existingTranslation: data[0].target_text,
            qualityScore: data[0].quality_score,
            tmId: data[0].id,
        });
    } catch (error) {
        console.error('TM check error:', error);
        return NextResponse.json({ exists: false });
    }
}
