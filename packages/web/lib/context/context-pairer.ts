/**
 * MAC-RAG Context Pairer
 * Layer 3: Synthesize retrieved context into weighted, unified prompt context
 */

import type { ContextObject } from '../../lib/context/context-builder';
import type { TMMatch } from '../../lib/retrieval/tm-search';
import type { TerminologyConstraints, TermEntry } from '../../lib/retrieval/terminology';

export interface ContextWeight {
    source: 'tm' | 'terminology' | 'corpus' | 'user';
    weight: number; // 0.0 - 1.0
    reason: string;
}

export interface PairedContext {
    // Core context
    context: ContextObject;

    // Retrieved and weighted elements
    selectedTMMatches: Array<TMMatch & { weight: number }>;
    selectedTerms: Array<TermEntry & { weight: number }>;

    // Synthesis outputs
    promptContext: string;
    weights: ContextWeight[];

    // Metadata
    totalWeight: number;
    confidenceScore: number;
    gapsIdentified: string[];
}

export interface ContextPairingOptions {
    context: ContextObject;
    tmMatches: TMMatch[];
    terminology: TerminologyConstraints;
    userOverrides?: {
        includeTMIds?: string[];
        excludeTMIds?: string[];
        includeTermIds?: string[];
        excludeTermIds?: string[];
    };
    maxTMMatches?: number;
    maxTerms?: number;
}

/**
 * Calculate weight for a TM match based on various factors
 */
function calculateTMWeight(match: TMMatch, context: ContextObject): number {
    let weight = 0;

    // Match percentage is primary factor (normalized 0-0.5)
    weight += (match.matchPercentage / 100) * 0.5;

    // Domain match bonus
    if (match.domain === context.domain.primary) {
        weight += 0.15;
    } else if (match.domain === context.domain.secondary) {
        weight += 0.08;
    }

    // Quality score bonus
    if (match.qualityScore) {
        weight += match.qualityScore * 0.15;
    }

    // Recency bonus (newer is better)
    if (match.createdAt) {
        const daysSinceCreated = (Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 7) weight += 0.10;
        else if (daysSinceCreated < 30) weight += 0.05;
    }

    // Helpful count bonus
    if (match.metadata?.helpfulCount && match.metadata.helpfulCount > 0) {
        weight += Math.min(0.10, match.metadata.helpfulCount * 0.02);
    }

    return Math.min(1.0, weight);
}

/**
 * Calculate weight for a terminology entry
 */
function calculateTermWeight(term: TermEntry, context: ContextObject): number {
    let weight = term.confidence || 0.5;

    // Type priority
    switch (term.type) {
        case 'required':
            weight = Math.max(weight, 0.9);
            break;
        case 'do_not_translate':
            weight = Math.max(weight, 0.85);
            break;
        case 'preferred':
            weight *= 0.95;
            break;
        case 'forbidden':
            weight = 1.0; // Always include to avoid
            break;
    }

    // Domain match bonus
    if (term.domain === context.domain.primary) {
        weight = Math.min(1.0, weight + 0.10);
    }

    return weight;
}

/**
 * Identify gaps in context coverage
 */
function identifyGaps(
    context: ContextObject,
    tmMatches: TMMatch[],
    terminology: TerminologyConstraints
): string[] {
    const gaps: string[] = [];

    // Check if entities have term coverage
    for (const entity of context.entities) {
        const hasTerm =
            terminology.requiredTerms.some(t => t.japaneseTerm === entity.text) ||
            terminology.preferredTerms.some(t => t.japaneseTerm === entity.text) ||
            terminology.doNotTranslate.some(t => t.japaneseTerm === entity.text);

        if (!hasTerm && !entity.translation) {
            gaps.push(`No terminology for: "${entity.text}"`);
        }
    }

    // Check TM coverage
    if (tmMatches.length === 0 || (tmMatches[0] && tmMatches[0].matchPercentage < 50)) {
        gaps.push('Low TM coverage - no close matches found');
    }

    // Check for complex structures without examples
    if (context.estimatedComplexity === 'high' && tmMatches.length < 3) {
        gaps.push('Complex text with limited reference examples');
    }

    return gaps;
}

/**
 * Build the prompt context string from paired elements
 */
function buildPromptContext(
    context: ContextObject,
    selectedTM: Array<TMMatch & { weight: number }>,
    selectedTerms: Array<TermEntry & { weight: number }>
): string {
    const sections: string[] = [];

    // Header with analysis
    sections.push(`## Source Analysis
- Domain: ${context.domain.primary} (${Math.round(context.domain.confidence * 100)}% confidence)
- Style: ${context.style.formality}, ${context.style.tone}
- Audience: ${context.style.audience}
${context.style.keigoLevel ? `- Keigo Level: ${context.style.keigoLevel}` : ''}
- Complexity: ${context.estimatedComplexity}
- Segments: ${context.segmentCount}`);

    // TM References (sorted by weight)
    if (selectedTM.length > 0) {
        sections.push(`\n## Reference Translations (Translation Memory)`);
        const sortedTM = [...selectedTM].sort((a, b) => b.weight - a.weight);
        for (const match of sortedTM) {
            sections.push(`
### Match: ${match.matchPercentage}% (weight: ${Math.round(match.weight * 100)}%)
Source: ${match.sourceText}
Translation: ${match.targetText}`);
        }
    }

    // Terminology constraints
    const requiredTerms = selectedTerms.filter(t => t.type === 'required');
    const doNotTranslate = selectedTerms.filter(t => t.type === 'do_not_translate');
    const preferredTerms = selectedTerms.filter(t => t.type === 'preferred');

    if (requiredTerms.length > 0 || doNotTranslate.length > 0) {
        sections.push(`\n## Terminology Constraints`);

        if (requiredTerms.length > 0) {
            sections.push(`\n### Required Translations (MUST use these):`);
            for (const term of requiredTerms) {
                sections.push(`- ${term.japaneseTerm} → ${term.englishTerm}${term.notes ? ` (${term.notes})` : ''}`);
            }
        }

        if (doNotTranslate.length > 0) {
            sections.push(`\n### Do Not Translate (keep as romanized):`);
            for (const term of doNotTranslate) {
                sections.push(`- ${term.japaneseTerm} → ${term.englishTerm}`);
            }
        }

        if (preferredTerms.length > 0) {
            sections.push(`\n### Preferred (use when applicable):`);
            for (const term of preferredTerms) {
                sections.push(`- ${term.japaneseTerm} → ${term.englishTerm}`);
            }
        }
    }

    // Detected entities
    if (context.entities.length > 0) {
        sections.push(`\n## Detected Entities`);
        for (const entity of context.entities.slice(0, 10)) {
            sections.push(`- ${entity.text} (${entity.type})${entity.translation ? ` → ${entity.translation}` : ''}`);
        }
    }

    return sections.join('\n');
}

/**
 * Pair and synthesize context for translation
 */
export function pairContext(options: ContextPairingOptions): PairedContext {
    const {
        context,
        tmMatches,
        terminology,
        userOverrides = {},
        maxTMMatches = 5,
        maxTerms = 20,
    } = options;

    // Apply user overrides and calculate weights for TM matches
    let weightedTM = tmMatches
        .filter(tm => {
            if (userOverrides.excludeTMIds?.includes(tm.id)) return false;
            if (userOverrides.includeTMIds && !userOverrides.includeTMIds.includes(tm.id)) {
                return tm.matchPercentage >= 70; // Keep high matches even if not explicitly included
            }
            return true;
        })
        .map(tm => ({
            ...tm,
            weight: calculateTMWeight(tm, context),
        }));

    // Sort by weight and limit
    weightedTM = weightedTM
        .sort((a, b) => b.weight - a.weight)
        .slice(0, maxTMMatches);

    // Collect and weight terminology
    const allTerms = [
        ...terminology.requiredTerms,
        ...terminology.doNotTranslate,
        ...terminology.preferredTerms,
        ...terminology.forbiddenTerms,
    ];

    let weightedTerms = allTerms
        .filter(term => {
            if (userOverrides.excludeTermIds?.includes(term.id)) return false;
            return true;
        })
        .map(term => ({
            ...term,
            weight: calculateTermWeight(term, context),
        }));

    // Sort by weight and limit
    weightedTerms = weightedTerms
        .sort((a, b) => b.weight - a.weight)
        .slice(0, maxTerms);

    // Identify gaps
    const gaps = identifyGaps(context, tmMatches, terminology);

    // Build prompt context
    const promptContext = buildPromptContext(context, weightedTM, weightedTerms);

    // Calculate overall confidence
    const tmConfidence = weightedTM.length > 0
        ? weightedTM.reduce((sum, tm) => sum + tm.weight, 0) / weightedTM.length
        : 0.5;
    const termConfidence = weightedTerms.length > 0
        ? weightedTerms.reduce((sum, t) => sum + t.weight, 0) / weightedTerms.length
        : 0.5;
    const gapPenalty = Math.max(0, 0.1 * gaps.length);

    const confidenceScore = Math.max(0.3, (tmConfidence * 0.4 + termConfidence * 0.4 + context.domain.confidence * 0.2) - gapPenalty);

    // Build weights summary
    const weights: ContextWeight[] = [
        { source: 'tm', weight: tmConfidence, reason: `${weightedTM.length} TM matches selected` },
        { source: 'terminology', weight: termConfidence, reason: `${weightedTerms.length} terms applied` },
    ];

    return {
        context,
        selectedTMMatches: weightedTM,
        selectedTerms: weightedTerms,
        promptContext,
        weights,
        totalWeight: confidenceScore,
        confidenceScore,
        gapsIdentified: gaps,
    };
}

/**
 * Quick context synthesis for simple cases
 */
export function synthesizeQuickContext(
    context: ContextObject,
    terminology?: TerminologyConstraints
): string {
    const sections: string[] = [];

    sections.push(`Domain: ${context.domain.primary}`);
    sections.push(`Style: ${context.style.formality}`);

    if (terminology) {
        if (terminology.requiredTerms.length > 0) {
            sections.push(`\nRequired terms:`);
            for (const t of terminology.requiredTerms.slice(0, 5)) {
                sections.push(`  ${t.japaneseTerm} → ${t.englishTerm}`);
            }
        }
    }

    return sections.join('\n');
}
