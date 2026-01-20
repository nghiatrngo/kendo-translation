/**
 * MAC-RAG Quality Routing
 * Layer 4: Route translations based on quality thresholds
 */

import type { QualityScores, QualityAssessment } from '../../lib/quality/scorer';

export type RoutingDecision =
    | 'auto_accept'    // ≥0.90: High quality, no review needed
    | 'light_pe'       // 0.85-0.89: Quick review for minor issues
    | 'standard_pe'    // 0.70-0.84: Standard post-editing
    | 'full_revision'  // <0.70: Needs significant revision
    | 'reject';        // <0.50: Too low quality, retranslate

export interface RoutingThresholds {
    autoAccept: number;
    lightPE: number;
    standardPE: number;
    reject: number;
}

export interface RoutingResult {
    decision: RoutingDecision;
    confidence: number;
    reasons: string[];
    estimatedEffort: 'minimal' | 'low' | 'medium' | 'high';
    suggestedActions: string[];
}

// Default thresholds
const DEFAULT_THRESHOLDS: RoutingThresholds = {
    autoAccept: 0.90,
    lightPE: 0.85,
    standardPE: 0.70,
    reject: 0.50,
};

// Dimension-specific thresholds that override overall score
const CRITICAL_DIMENSIONS = {
    terminology: 0.80, // Must have good term compliance
    adequacy: 0.75,    // Must preserve meaning
};

/**
 * Determine routing based on quality scores
 */
export function routeByQuality(
    scores: QualityScores,
    thresholds: Partial<RoutingThresholds> = {}
): RoutingResult {
    const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
    const reasons: string[] = [];
    const suggestedActions: string[] = [];

    // Check critical dimensions first
    let criticalFail = false;

    if (scores.terminology < CRITICAL_DIMENSIONS.terminology) {
        criticalFail = true;
        reasons.push(`Terminology score (${Math.round(scores.terminology * 100)}%) below threshold`);
        suggestedActions.push('Review and correct terminology usage');
    }

    if (scores.adequacy < CRITICAL_DIMENSIONS.adequacy) {
        criticalFail = true;
        reasons.push(`Adequacy score (${Math.round(scores.adequacy * 100)}%) below threshold`);
        suggestedActions.push('Verify meaning is fully preserved');
    }

    // Determine base decision from overall score
    let decision: RoutingDecision;
    let estimatedEffort: RoutingResult['estimatedEffort'];

    if (scores.overall < t.reject) {
        decision = 'reject';
        estimatedEffort = 'high';
        reasons.push(`Overall score (${Math.round(scores.overall * 100)}%) too low`);
        suggestedActions.push('Consider retranslating from scratch');
    } else if (scores.overall < t.standardPE || criticalFail) {
        decision = criticalFail && scores.overall >= t.standardPE ? 'standard_pe' :
            scores.overall < t.standardPE ? 'full_revision' : 'standard_pe';
        estimatedEffort = decision === 'full_revision' ? 'high' : 'medium';
        if (!criticalFail) {
            reasons.push(`Overall score (${Math.round(scores.overall * 100)}%) needs revision`);
        }
        suggestedActions.push('Full review with corrections needed');
    } else if (scores.overall < t.lightPE) {
        decision = 'standard_pe';
        estimatedEffort = 'medium';
        reasons.push(`Score at standard review level (${Math.round(scores.overall * 100)}%)`);
        suggestedActions.push('Review all sections, fix issues');
    } else if (scores.overall < t.autoAccept) {
        decision = 'light_pe';
        estimatedEffort = 'low';
        reasons.push(`Good quality (${Math.round(scores.overall * 100)}%), minor review`);
        suggestedActions.push('Quick check for fluency and style');
    } else {
        decision = 'auto_accept';
        estimatedEffort = 'minimal';
        reasons.push(`High quality (${Math.round(scores.overall * 100)}%)`);
        suggestedActions.push('Spot-check only, approve for publication');
    }

    // Add dimension-specific suggestions
    if (scores.fluency < 0.80) {
        suggestedActions.push('Improve sentence flow and readability');
    }
    if (scores.style < 0.80) {
        suggestedActions.push('Adjust register/tone as needed');
    }

    return {
        decision,
        confidence: scores.overall,
        reasons,
        estimatedEffort,
        suggestedActions: [...new Set(suggestedActions)], // Remove duplicates
    };
}

/**
 * Get human-readable label for routing decision
 */
export function getRoutingLabel(decision: RoutingDecision): {
    label: string;
    icon: string;
    color: string;
    description: string;
} {
    switch (decision) {
        case 'auto_accept':
            return {
                label: 'Auto Accept',
                icon: '✅',
                color: '#10b981',
                description: 'High quality - ready for publication',
            };
        case 'light_pe':
            return {
                label: 'Light PE',
                icon: '👀',
                color: '#3b82f6',
                description: 'Quick review recommended',
            };
        case 'standard_pe':
            return {
                label: 'Standard PE',
                icon: '⚠️',
                color: '#f59e0b',
                description: 'Full review with corrections',
            };
        case 'full_revision':
            return {
                label: 'Full Revision',
                icon: '🔧',
                color: '#ef4444',
                description: 'Significant revision required',
            };
        case 'reject':
            return {
                label: 'Reject',
                icon: '❌',
                color: '#991b1b',
                description: 'Retranslation recommended',
            };
    }
}

/**
 * Calculate estimated time for review based on routing
 */
export function estimateReviewTime(
    decision: RoutingDecision,
    wordCount: number
): { minutes: number; range: string } {
    // Words per minute for different review types
    const wpmRates: Record<RoutingDecision, number> = {
        auto_accept: 500,     // Just scanning
        light_pe: 200,        // Quick read
        standard_pe: 100,     // Careful review
        full_revision: 50,    // Deep revision
        reject: 30,           // Retranslation
    };

    const minutes = Math.ceil(wordCount / wpmRates[decision]);

    // Add range buffer
    const minTime = Math.max(1, Math.floor(minutes * 0.8));
    const maxTime = Math.ceil(minutes * 1.3);

    return {
        minutes,
        range: minTime === maxTime ? `~${minutes} min` : `${minTime}-${maxTime} min`,
    };
}

/**
 * Batch routing for multiple translations
 */
export function routeBatch(
    translations: Array<{ id: string; scores: QualityScores }>
): {
    byDecision: Record<RoutingDecision, string[]>;
    summary: { decision: RoutingDecision; count: number }[];
} {
    const byDecision: Record<RoutingDecision, string[]> = {
        auto_accept: [],
        light_pe: [],
        standard_pe: [],
        full_revision: [],
        reject: [],
    };

    for (const { id, scores } of translations) {
        const result = routeByQuality(scores);
        byDecision[result.decision].push(id);
    }

    const summary = Object.entries(byDecision)
        .filter(([_, ids]) => ids.length > 0)
        .map(([decision, ids]) => ({
            decision: decision as RoutingDecision,
            count: ids.length,
        }))
        .sort((a, b) => {
            const order: RoutingDecision[] = ['auto_accept', 'light_pe', 'standard_pe', 'full_revision', 'reject'];
            return order.indexOf(a.decision) - order.indexOf(b.decision);
        });

    return { byDecision, summary };
}
