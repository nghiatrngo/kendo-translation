/**
 * MAC-RAG Multi-Candidate Translation Generator
 * Layer 3: Generate multiple translation candidates with different approaches
 */

import { agentChat } from '@/lib/llm/provider';
import type { ContextObject } from '@/lib/context/context-builder';
import type { TerminologyConstraints } from '@/lib/retrieval/terminology';
import type { TMMatch } from '@/lib/retrieval/tm-search';

export interface TranslationCandidate {
    id: string;
    text: string;
    approach: 'literal' | 'natural' | 'formal';
    confidence: number;
    tokensUsed?: number;
    processingTime?: number;
}

export interface MultiGenOptions {
    sourceText: string;
    context: ContextObject;
    tmMatches?: TMMatch[];
    terminology?: TerminologyConstraints;
    approaches?: Array<'literal' | 'natural' | 'formal'>;
    parallel?: boolean;
    articleId?: string;
    videoId?: string;
}

export interface MultiGenResult {
    candidates: TranslationCandidate[];
    recommendedIndex: number;
    totalTime: number;
}

// Approach-specific system prompts
const APPROACH_PROMPTS: Record<string, string> = {
    literal: `You are a precise translator focused on accuracy and faithfulness to the source text.
Your translation style:
- Preserve the exact meaning and structure where possible
- Maintain close correspondence to source sentence order
- Prioritize accuracy over natural flow
- Keep technical terms and proper nouns intact
- Suitable for: technical documentation, legal text, academic papers`,

    natural: `You are a fluent translator focused on natural, readable target language.
Your translation style:
- Prioritize natural, idiomatic expression in the target language
- Restructure sentences as needed for better flow
- Use common expressions that native speakers would use
- Balance accuracy with readability
- Suitable for: general content, articles, educational materials`,

    formal: `You are a formal translator focused on professional, elevated language.
Your translation style:
- Use formal register and sophisticated vocabulary
- Maintain respectful, professional tone throughout
- Appropriate for official or ceremonial contexts
- Preserve cultural nuances with appropriate formality
- Suitable for: business documents, official statements, ceremonial text`,
};

/**
 * Generate a single translation candidate
 */
async function generateCandidate(
    sourceText: string,
    approach: 'literal' | 'natural' | 'formal',
    context: ContextObject,
    tmMatches?: TMMatch[],
    terminology?: TerminologyConstraints,
    options?: { articleId?: string; videoId?: string }
): Promise<TranslationCandidate> {
    const startTime = Date.now();

    // Build context sections
    let contextSection = '';

    // Add Literal Context (Pre-input)
    // This is injected BEFORE other context to ensure high priority instructions
    const literalContext = (context as any).literalContext; // Hack: Need to update ContextObject type properly later
    if (literalContext) {
        contextSection += `\n## Special Instructions\n${literalContext}\n`;
    }

    // Add TM matches as reference
    if (tmMatches && tmMatches.length > 0) {
        contextSection += '\n## Reference Translations (from Bilingual Database Matches)\n';
        for (const match of tmMatches.slice(0, 3)) {
            contextSection += `Source: ${match.sourceText.slice(0, 100)}...\n`;
            contextSection += `Translation: ${match.targetText.slice(0, 100)}...\n`;
            contextSection += `(${match.matchPercentage}% match)\n\n`;
        }
    }

    // Add terminology constraints
    if (terminology) {
        if (terminology.requiredTerms.length > 0) {
            contextSection += '\n## Required Terminology\n';
            for (const term of terminology.requiredTerms) {
                contextSection += `${term.japaneseTerm} → ${term.englishTerm}\n`;
            }
        }
        if (terminology.doNotTranslate.length > 0) {
            contextSection += '\n## Do Not Translate (keep as-is)\n';
            for (const term of terminology.doNotTranslate) {
                contextSection += `${term.japaneseTerm} → ${term.englishTerm}\n`;
            }
        }
    }

    // specific import to avoid cycle if any, though PromptService is standalone usually
    const { getPromptTemplate } = await import('@/lib/agents/prompts');
    const template = await getPromptTemplate('translation', approach);

    const systemPrompt = template;
    const userPrompt = `Domain: ${context.domain.primary}
Formality: ${context.style.formality}
Audience: ${context.style.audience}
${contextSection}

Translate the following ${context.sourceLang.toUpperCase()} text to ${context.targetLang.toUpperCase()}:

${sourceText}

CRITICAL INSTRUCTIONS:
- OUTPUT ONLY the translated text.
- Do NOT include "Here is the translation", "Sure", or any other conversational filler.
- Do NOT wrap the output in quotes unless the original text has quotes.
- Do NOT provide alternative options or explanations.
- Return PURE text only.`;

    try {
        const response = await agentChat('translation', [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], {
            temperature: approach === 'literal' ? 0.3 : approach === 'formal' ? 0.4 : 0.5,
            articleId: options?.articleId, // Pass metadata
            videoId: options?.videoId,
        });

        // Clean response content
        let cleanText = response.content.trim();
        // Remove common chat prefixes
        cleanText = cleanText.replace(/^(Here is|Sure,|Okay,|Here's) .*?:\s*/i, '');
        // Remove surrounding quotes if they wrap the entire text
        if (cleanText.startsWith('"') && cleanText.endsWith('"') && sourceText.trim().charAt(0) !== '"') {
            cleanText = cleanText.slice(1, -1);
        }

        // Extract confidence from response if available, otherwise estimate
        const confidence = estimateConfidence(cleanText, context, terminology);

        return {
            id: `${approach}-${Date.now()}`,
            text: cleanText,
            approach,
            confidence,
            processingTime: Date.now() - startTime,
        };
    } catch (error) {
        console.error(`${approach} translation error:`, error);
        return {
            id: `${approach}-${Date.now()}`,
            text: `[Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}]`,
            approach,
            confidence: 0,
            processingTime: Date.now() - startTime,
        };
    }
}

/**
 * Estimate translation confidence based on various factors
 */
function estimateConfidence(
    translation: string,
    context: ContextObject,
    terminology?: TerminologyConstraints
): number {
    let score = 0.75; // Base score

    // Length ratio check
    const sourceLen = context.sourceText.length;
    const transLen = translation.length;
    const ratio = transLen / sourceLen;

    if (context.sourceLang === 'ja' && context.targetLang === 'en') {
        // Japanese to English typically expands 1.5-2.5x
        if (ratio >= 1.2 && ratio <= 3.0) score += 0.10;
        else if (ratio >= 0.8 && ratio <= 4.0) score += 0.05;
        else score -= 0.10;
    } else {
        // English to Japanese typically shrinks 0.4-0.8x
        if (ratio >= 0.3 && ratio <= 1.0) score += 0.10;
        else if (ratio >= 0.2 && ratio <= 1.5) score += 0.05;
        else score -= 0.10;
    }

    // Terminology check
    if (terminology) {
        const required = terminology.requiredTerms;
        if (required.length > 0) {
            const found = required.filter(t =>
                translation.toLowerCase().includes(t.englishTerm.toLowerCase())
            ).length;
            score += (found / required.length) * 0.10;
        }
    }

    // Cap score
    return Math.min(0.98, Math.max(0.20, score));
}

/**
 * Generate multiple translation candidates with different approaches
 */
export async function generateMultipleCandidates(
    options: MultiGenOptions
): Promise<MultiGenResult> {
    const startTime = Date.now();
    const {
        sourceText,
        context,
        tmMatches,
        terminology,
        approaches = ['literal', 'natural', 'formal'],
        parallel = true,
        articleId,
        videoId,
    } = options;

    let candidates: TranslationCandidate[];

    if (parallel) {
        // Generate all candidates in parallel
        const promises = approaches.map(approach =>
            generateCandidate(sourceText, approach, context, tmMatches, terminology, { articleId, videoId })
        );
        candidates = await Promise.all(promises);
    } else {
        // Generate sequentially
        candidates = [];
        for (const approach of approaches) {
            const candidate = await generateCandidate(
                sourceText, approach, context, tmMatches, terminology, { articleId, videoId }
            );
            candidates.push(candidate);
        }
    }

    // Find recommended candidate (highest confidence)
    let recommendedIndex = 0;
    let maxConfidence = 0;

    for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].confidence > maxConfidence) {
            maxConfidence = candidates[i].confidence;
            recommendedIndex = i;
        }
    }

    // Mark recommended
    candidates[recommendedIndex] = {
        ...candidates[recommendedIndex],
        // Add isRecommended flag through the return
    };

    return {
        candidates,
        recommendedIndex,
        totalTime: Date.now() - startTime,
    };
}

/**
 * Generate a single best translation (for simple use cases)
 */
export async function generateTranslation(
    sourceText: string,
    context: ContextObject,
    approach: 'literal' | 'natural' | 'formal' = 'natural'
): Promise<TranslationCandidate> {
    return generateCandidate(sourceText, approach, context);
}
