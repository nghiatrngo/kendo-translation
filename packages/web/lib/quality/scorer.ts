/**
 * MAC-RAG Quality Scorer
 * Phase 4: LLM-assisted quality assessment for translations
 */

import { agentChat } from '@/lib/llm/provider';

export interface QualityScores {
    overall: number;
    fluency: number;
    adequacy: number;
    terminology: number;
    style: number;
}

export interface QualityIssue {
    type: 'fluency' | 'adequacy' | 'terminology' | 'style';
    severity: 'minor' | 'major' | 'critical';
    description: string;
    suggestion?: string;
    location?: string;
}

export interface QualityAssessment {
    scores: QualityScores;
    issues: QualityIssue[];
    routing: 'auto_accept' | 'light_pe' | 'standard_pe' | 'full_revision';
    summary: string;
}

export interface ScoringOptions {
    sourceText: string;
    translation: string;
    sourceLang: 'ja' | 'en';
    targetLang: 'ja' | 'en';
    requiredTerms?: Array<{ source: string; target: string }>;
    style?: {
        formality: 'formal' | 'semi_formal' | 'casual';
        tone: string;
    };
}

const QUALITY_SCORING_PROMPT = `You are a professional translation quality evaluator. Analyze the translation below and provide detailed quality scores.

SOURCE TEXT ({sourceLang}):
{sourceText}

TRANSLATION ({targetLang}):
{translation}

{terminologySection}

{styleSection}

SCORING CRITERIA:
1. **Fluency** (0.0-1.0): Does the translation read naturally in the target language? Check for awkward phrasing, grammar errors, and unnatural word choices.

2. **Adequacy** (0.0-1.0): Is the meaning of the source text fully and accurately preserved? Check for omissions, additions, or misinterpretations.

3. **Terminology** (0.0-1.0): Are domain-specific terms translated correctly and consistently? Are required terms used as specified?

4. **Style** (0.0-1.0): Does the translation match the expected register, tone, and formality level?

RESPONSE FORMAT (JSON):
{
  "scores": {
    "fluency": <number 0.0-1.0>,
    "adequacy": <number 0.0-1.0>,
    "terminology": <number 0.0-1.0>,
    "style": <number 0.0-1.0>
  },
  "issues": [
    {
      "type": "<fluency|adequacy|terminology|style>",
      "severity": "<minor|major|critical>",
      "description": "<specific issue description>",
      "suggestion": "<improvement suggestion>",
      "location": "<where in text>"
    }
  ],
  "summary": "<one sentence overall assessment>"
}

Respond ONLY with valid JSON.`;

/**
 * Score a translation using LLM-assisted evaluation
 */
export async function scoreTranslation(options: ScoringOptions): Promise<QualityAssessment> {
    const { sourceText, translation, sourceLang, targetLang, requiredTerms, style } = options;

    // Build terminology section
    let terminologySection = '';
    if (requiredTerms && requiredTerms.length > 0) {
        terminologySection = 'REQUIRED TERMINOLOGY:\n' +
            requiredTerms.map(t => `- "${t.source}" → "${t.target}"`).join('\n');
    }

    // Build style section
    let styleSection = '';
    if (style) {
        styleSection = `EXPECTED STYLE:\n- Formality: ${style.formality}\n- Tone: ${style.tone}`;
    }

    // Build literal context section if provided
    const literalContext = (options as any).literalContext;
    let literalContextSection = '';
    if (literalContext) {
        literalContextSection = `SPECIAL INSTRUCTIONS:\n${literalContext}`;
    }

    // Get prompt template
    const { getPromptTemplate } = await import('@/lib/agents/prompts');
    const template = await getPromptTemplate('reflection', 'quality');

    // Build prompt
    const prompt = template
        .replace('{sourceLang}', sourceLang.toUpperCase())
        .replace('{targetLang}', targetLang.toUpperCase())
        .replace('{sourceText}', sourceText)
        .replace('{translation}', translation)
        .replace('{terminologySection}', terminologySection)
        .replace('{styleSection}', styleSection)
        .replace('{literalContextSection}', literalContextSection);

    try {
        // Call LLM for scoring
        const response = await agentChat('reflection', [
            { role: 'user', content: prompt }
        ], {
            temperature: 0.2, // Low temperature for consistent scoring
        });

        // Parse response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Calculate overall score (weighted average)
        const overall =
            parsed.scores.fluency * 0.30 +
            parsed.scores.adequacy * 0.35 +
            parsed.scores.terminology * 0.20 +
            parsed.scores.style * 0.15;

        // Determine routing based on overall score
        let routing: QualityAssessment['routing'];
        if (overall >= 0.90) {
            routing = 'auto_accept';
        } else if (overall >= 0.85) {
            routing = 'light_pe';
        } else if (overall >= 0.70) {
            routing = 'standard_pe';
        } else {
            routing = 'full_revision';
        }

        return {
            scores: {
                overall: Math.round(overall * 100) / 100,
                fluency: parsed.scores.fluency,
                adequacy: parsed.scores.adequacy,
                terminology: parsed.scores.terminology,
                style: parsed.scores.style,
            },
            issues: parsed.issues || [],
            routing,
            summary: parsed.summary || '',
        };
    } catch (error) {
        console.error('Quality scoring error:', error);

        // Return fallback scores
        return {
            scores: {
                overall: 0.75,
                fluency: 0.75,
                adequacy: 0.75,
                terminology: 0.75,
                style: 0.75,
            },
            issues: [{
                type: 'adequacy',
                severity: 'minor',
                description: 'Unable to perform automated quality assessment',
                suggestion: 'Manual review recommended',
            }],
            routing: 'standard_pe',
            summary: 'Automated scoring unavailable. Please review manually.',
        };
    }
}

/**
 * Quick score without LLM (rule-based heuristics)
 */
export function quickScore(options: ScoringOptions): QualityScores {
    const { sourceText, translation, requiredTerms } = options;

    // Basic length ratio check
    const lengthRatio = translation.length / sourceText.length;
    const lengthScore = lengthRatio >= 0.5 && lengthRatio <= 3.0 ? 0.8 : 0.6;

    // Terminology check
    let termScore = 0.8;
    if (requiredTerms && requiredTerms.length > 0) {
        const foundTerms = requiredTerms.filter(t =>
            translation.toLowerCase().includes(t.target.toLowerCase())
        ).length;
        termScore = foundTerms / requiredTerms.length;
    }

    // Simple overall
    const overall = (lengthScore * 0.3 + termScore * 0.3 + 0.7 * 0.4);

    return {
        overall: Math.round(overall * 100) / 100,
        fluency: 0.75, // Placeholder
        adequacy: lengthScore,
        terminology: termScore,
        style: 0.75, // Placeholder
    };
}
