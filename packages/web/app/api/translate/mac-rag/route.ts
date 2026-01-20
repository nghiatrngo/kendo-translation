/**
 * MAC-RAG Translation Pipeline API
 * 
 * POST /api/translate/mac-rag
 * 
 * Full 3-phase translation pipeline:
 * - Phase 1: Pre-translation (context building, TM/term retrieval)
 * - Phase 2: Translation (multi-candidate generation)
 * - Phase 3: Post-translation (quality scoring, save options)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { buildContext, type ContextObject } from '../../../../lib/context/context-builder';
import { searchTM, type TMMatch } from '../../../../lib/retrieval/tm-search';
import { searchTerminology, type TerminologyConstraints } from '../../../../lib/retrieval/terminology';
import { pairContext, type PairedContext } from '../../../../lib/context/context-pairer';
import { generateMultipleCandidates, type TranslationCandidate } from '../../../../lib/translation/multi-gen';
import { analyzeJaForTranslation, generateTranslationGuidance, type JaEnAnalysis } from '../../../../lib/agents/ja-en-agent';
import { detectGaps, type CoverageReport } from '../../../../lib/context/gap-detector';
import { scoreTranslation, type QualityAssessment } from '../../../../lib/quality/scorer';
import { routeByQuality, type RoutingResult } from '../../../../lib/quality/routing';

// === REQUEST/RESPONSE TYPES ===

interface MacRagRequest {
    sourceText: string;
    sourceLang?: 'ja' | 'en';
    targetLang?: 'ja' | 'en';
    phase?: 'context' | 'translate' | 'score' | 'full';
    literalContext?: string; // New: User-provided instructions
    options?: {
        approaches?: Array<'literal' | 'natural' | 'formal'>;
        includeTMIds?: string[];
        excludeTMIds?: string[];
        selectedCandidateId?: string;
    };
    // For phase 'score'
    translation?: string;
    // Metadata for logging
    articleId?: string;
    videoId?: string;
}

interface MacRagResponse {
    phase: string;
    // Phase 1: Context
    context?: ContextObject;
    pairedContext?: PairedContext;
    tmMatches?: TMMatch[];
    terminology?: TerminologyConstraints;
    jaAnalysis?: JaEnAnalysis;
    jaGuidance?: string;
    coverageReport?: CoverageReport;
    // Phase 2: Translation
    candidates?: TranslationCandidate[];
    recommendedIndex?: number;
    // Phase 3: Quality
    qualityAssessment?: QualityAssessment;
    routing?: RoutingResult;
    // Metadata
    timings?: Record<string, number>;
    errors?: string[];
}

// === MAIN HANDLER ===

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const timings: Record<string, number> = {};
    const errors: string[] = [];

    try {
        const body: MacRagRequest = await request.json();
        const {
            sourceText,
            sourceLang = 'ja',
            targetLang = 'en',
            phase = 'full',
            literalContext,
            options = {},
            translation,
        } = body;

        if (!sourceText?.trim()) {
            return NextResponse.json({ error: 'sourceText is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const response: MacRagResponse = { phase, timings };

        // === PHASE 1: PRE-TRANSLATION (Context Building) ===
        if (phase === 'context' || phase === 'full') {
            const contextStart = Date.now();

            // Build context
            const context = await buildContext({
                sourceText,
                sourceLang,
                targetLang,
            });
            if (literalContext) (context as any).literalContext = literalContext;
            response.context = context;

            // Search TM
            const tmResult = await searchTM(supabase, {
                sourceText,
                sourceLang,
                domain: context.domain.primary,
                minMatchScore: 50,
                maxResults: 10,
            });
            response.tmMatches = tmResult.matches;

            // Search terminology
            const termResult = await searchTerminology(supabase, {
                text: sourceText,
                sourceLang,
                domain: context.domain.primary,
            });
            response.terminology = termResult.constraints;

            // Pair context
            const paired = pairContext({
                context,
                tmMatches: tmResult.matches,
                terminology: termResult.constraints,
                userOverrides: {
                    includeTMIds: options.includeTMIds,
                    excludeTMIds: options.excludeTMIds,
                },
            });
            response.pairedContext = paired;

            // JA-specific analysis (if source is Japanese)
            if (sourceLang === 'ja') {
                const jaAnalysis = analyzeJaForTranslation(sourceText);
                response.jaAnalysis = jaAnalysis;
                response.jaGuidance = generateTranslationGuidance(jaAnalysis);
            }

            // Gap detection
            const gaps = detectGaps({
                context,
                tmMatches: tmResult.matches,
                terminology: termResult.constraints,
            });
            response.coverageReport = gaps;

            timings.context = Date.now() - contextStart;
        }

        // === PHASE 2: TRANSLATION (Multi-Candidate Generation) ===
        if (phase === 'translate' || phase === 'full') {
            const translateStart = Date.now();

            // Ensure we have context
            const context = response.context || await buildContext({
                sourceText,
                sourceLang,
                targetLang,
            });
            if (literalContext) (context as any).literalContext = literalContext;

            // Generate candidates
            const result = await generateMultipleCandidates({
                sourceText,
                context,
                tmMatches: response.tmMatches,
                terminology: response.terminology,
                approaches: options.approaches || ['literal', 'natural', 'formal'],
                parallel: true,
                articleId: body.articleId,
                videoId: body.videoId,
            });

            response.candidates = result.candidates.map((c, i) => ({
                ...c,
                isRecommended: i === result.recommendedIndex,
            }));
            response.recommendedIndex = result.recommendedIndex;

            timings.translate = Date.now() - translateStart;
        }

        // === PHASE 3: POST-TRANSLATION (Quality & Routing) ===
        if (phase === 'score' || phase === 'full') {
            const scoreStart = Date.now();

            // Determine which translation to score
            let textToScore = translation;

            if (!textToScore && response.candidates && response.recommendedIndex !== undefined) {
                textToScore = response.candidates[response.recommendedIndex].text;
            }

            if (textToScore) {
                // Score translation
                const requiredTerms = response.terminology?.requiredTerms.map(t => ({
                    source: t.japaneseTerm,
                    target: t.englishTerm,
                })) || [];

                const assessment = await scoreTranslation({
                    sourceText,
                    translation: textToScore,
                    sourceLang,
                    targetLang,
                    requiredTerms,
                    style: response.context?.style ? {
                        formality: response.context.style.formality,
                        tone: response.context.style.tone,
                    } : undefined,
                    ...({ literalContext } as any)
                });
                response.qualityAssessment = assessment;

                // Get routing recommendation
                const routing = routeByQuality(assessment.scores);
                response.routing = routing;
            }

            timings.score = Date.now() - scoreStart;
        }

        // Total timing
        timings.total = Date.now() - startTime;
        response.timings = timings;
        response.errors = errors.length > 0 ? errors : undefined;

        return NextResponse.json(response);

    } catch (error) {
        console.error('MAC-RAG pipeline error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Pipeline failed',
            timings: { total: Date.now() - startTime },
        }, { status: 500 });
    }
}

// GET: Return pipeline info
export async function GET() {
    return NextResponse.json({
        name: 'MAC-RAG Translation Pipeline',
        version: '1.0',
        phases: ['context', 'translate', 'score', 'full'],
        endpoints: {
            context: 'Build context without translation',
            translate: 'Generate translation candidates',
            score: 'Score an existing translation',
            full: 'Run complete 3-phase pipeline',
        },
    });
}
