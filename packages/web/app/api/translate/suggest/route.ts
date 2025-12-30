/**
 * Translation Suggestion API
 * 
 * POST /api/translate/suggest
 * 
 * Accepts Japanese source text and returns AI translation suggestion
 * with JA-EN specialist analysis and confidence score.
 */

import { NextRequest, NextResponse } from 'next/server';
import { agentChat } from '@/lib/llm/provider';
import { analyzeJAEN, type JAENAnalysis } from '@/lib/agents/ja-en-specialist';
import { createClient } from '@supabase/supabase-js';

interface TranslationRequest {
    source_text: string;
    context?: string;
    article_id?: string;
}

interface TranslationResponse {
    translation: string;
    confidence: number;
    jaenFeatures: JAENAnalysis;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: TranslationRequest = await request.json();

        if (!body.source_text || body.source_text.trim().length === 0) {
            return NextResponse.json(
                { error: 'source_text is required' },
                { status: 400 }
            );
        }

        // Check for API key
        if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'LLM API key not configured. Please set OPENROUTER_API_KEY or OPENAI_API_KEY in .env.local' },
                { status: 500 }
            );
        }

        // Step 1: Analyze JA-EN features
        const jaenFeatures = await analyzeJAEN(body.source_text, {
            honorificStrategy: "retain" // For Kendo content, retain Japanese honorifics
        });

        // Step 2: Fetch terminology from Supabase for context
        let terminologyContext = '';
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            try {
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                );

                // Extract potential terms from the source text (words with kanji or katakana)
                const potentialTerms = body.source_text.match(/[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]+/g) || [];

                if (potentialTerms.length > 0) {
                    const { data: terms } = await supabase
                        .from('terminology')
                        .select('source_term, target_term, reading')
                        .in('source_term', potentialTerms.slice(0, 20)); // Limit to 20 terms

                    if (terms && terms.length > 0) {
                        terminologyContext = '\n\n## Kendo Terminology\n' +
                            terms.map(t => `- ${t.source_term} (${t.reading || ''}) → ${t.target_term}`).join('\n');
                    }
                }
            } catch {
                // Ignore terminology lookup errors
            }
        }

        // Step 3: Build translation prompt
        const systemPrompt = `You are an expert Japanese to English translator specializing in Kendo (剣道) and martial arts content.

Your translations should:
1. Preserve domain-specific terminology (e.g., 面, 小手, 胴 as Men, Kote, Do)
2. Retain Japanese honorifics (-sensei, -san) in Kendo context
3. Be natural and fluent in English while preserving the original meaning
4. Handle onomatopoeia appropriately for English readers
5. Maintain the speaker's voice and tone

${jaenFeatures.enhancedPrompt}${terminologyContext}`;

        const userPrompt = `Translate the following Japanese text to English:

${body.source_text}

${body.context ? `Additional context: ${body.context}` : ''}

Provide a natural, fluent English translation that preserves the meaning and tone of the original.`;

        // Step 4: Get translation from LLM
        const response = await agentChat("translation", [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], { temperature: 0.3 });

        // Step 5: Calculate confidence score based on features
        const confidence = calculateConfidence(body.source_text, response.content, jaenFeatures);

        const result: TranslationResponse = {
            translation: response.content,
            confidence,
            jaenFeatures,
            usage: response.usage,
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('Translation API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Translation failed' },
            { status: 500 }
        );
    }
}

/**
 * Calculate translation confidence score (0-1)
 */
function calculateConfidence(
    source: string,
    translation: string,
    features: JAENAnalysis
): number {
    let score = 0.7; // Base score

    // Boost for detected terminology coverage
    if (features.onomatopoeiaRenderings.length > 0) {
        // Check if onomatopoeia were rendered
        const allRendered = features.onomatopoeiaRenderings.every(
            o => o.englishOptions.some(opt => translation.toLowerCase().includes(opt.toLowerCase()))
        );
        if (allRendered) score += 0.05;
    }

    // Boost for honorific handling
    if (features.honorificMappings.length > 0) {
        const allMapped = features.honorificMappings.every(
            h => translation.includes(h.name) || translation.includes(h.englishRendering)
        );
        if (allMapped) score += 0.05;
    }

    // Boost for subject resolution
    if (features.subjectResolutions.length > 0) {
        score += 0.05; // Complex sentence handling
    }

    // Length ratio check (translations typically 1.2-2x source length in characters)
    const ratio = translation.length / source.length;
    if (ratio >= 0.5 && ratio <= 3.0) {
        score += 0.05;
    }

    // Keigo awareness
    if (features.keigoLevel !== "casual") {
        score += 0.05; // Formal language detected and handled
    }

    return Math.min(score, 1.0);
}
