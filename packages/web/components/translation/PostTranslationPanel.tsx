'use client';

/**
 * MAC-RAG Post-Translation Panel
 * Phase 4: Quality assessment and memory update decisions
 */

import React, { useState } from 'react';

// === TYPE DEFINITIONS ===

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
}

export interface SaveOptions {
    saveToTM: boolean;
    newTerms: Array<{
        id: string;
        sourceTerm: string;
        targetTerm: string;
        save: boolean;
    }>;
    contextFeedback: Array<{
        id: string;
        sourcePreview: string;
        wasHelpful: boolean;
    }>;
}

interface PostTranslationPanelProps {
    sourceText: string;
    translation: string;
    scores?: QualityScores;
    issues?: QualityIssue[];
    routing?: 'auto_accept' | 'light_pe' | 'standard_pe' | 'full_revision';
    detectedTerms?: Array<{ source: string; target: string }>;
    usedTMMatches?: Array<{ id: string; sourcePreview: string }>;
    onSave?: (options: SaveOptions) => void;
    onSkip?: () => void;
    isLoading?: boolean;
}

// === HELPER COMPONENTS ===

function ScoreBar({ score, label }: { score: number; label: string }) {
    const percentage = Math.round(score * 100);
    const color = score >= 0.85 ? '#10b981' : score >= 0.70 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #586e75)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{percentage}%</span>
            </div>
            <div style={{
                height: 8,
                background: 'var(--bg-secondary, #eee8d5)',
                borderRadius: 4,
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: color,
                    borderRadius: 4,
                    transition: 'width 0.3s ease'
                }} />
            </div>
        </div>
    );
}

function RoutingBadge({ routing }: { routing: string }) {
    const config = {
        auto_accept: { label: '✅ Auto Accept', color: '#10b981', bg: '#d1fae5' },
        light_pe: { label: '👀 Light PE', color: '#3b82f6', bg: '#dbeafe' },
        standard_pe: { label: '⚠️ Standard PE', color: '#f59e0b', bg: '#fef3c7' },
        full_revision: { label: '❌ Full Revision', color: '#ef4444', bg: '#fee2e2' },
    }[routing] || { label: routing, color: '#6b7280', bg: '#f3f4f6' };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            color: config.color,
            background: config.bg,
        }}>
            {config.label}
        </span>
    );
}

// === MAIN COMPONENT ===

export default function PostTranslationPanel({
    sourceText,
    translation,
    scores,
    issues = [],
    routing = 'standard_pe',
    detectedTerms = [],
    usedTMMatches = [],
    onSave,
    onSkip,
    isLoading = false,
}: PostTranslationPanelProps) {
    const [saveToTM, setSaveToTM] = useState(true);
    const [termSelections, setTermSelections] = useState<Record<string, boolean>>(
        Object.fromEntries(detectedTerms.map((t, i) => [i.toString(), true]))
    );
    const [tmFeedback, setTMFeedback] = useState<Record<string, boolean>>(
        Object.fromEntries(usedTMMatches.map(m => [m.id, true]))
    );

    const handleSave = () => {
        if (!onSave) return;

        onSave({
            saveToTM,
            newTerms: detectedTerms.map((t, i) => ({
                id: i.toString(),
                sourceTerm: t.source,
                targetTerm: t.target,
                save: termSelections[i.toString()] ?? true,
            })),
            contextFeedback: usedTMMatches.map(m => ({
                id: m.id,
                sourcePreview: m.sourcePreview,
                wasHelpful: tmFeedback[m.id] ?? true,
            })),
        });
    };

    return (
        <div className="post-translation-panel">
            <style jsx>{`
        .post-translation-panel {
          background: var(--bg-secondary, #f8f5e6);
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 8px;
          padding: 16px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, #93a1a1);
        }
        .panel-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #073642);
        }
        .section {
          margin-bottom: 16px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #586e75);
        }
        .section-content {
          background: var(--bg-primary, #fdf6e3);
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 6px;
          padding: 12px;
        }
        .overall-score {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        .score-number {
          font-size: 36px;
          font-weight: 700;
          color: var(--text-primary, #073642);
        }
        .issue-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          background: var(--bg-secondary, #eee8d5);
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .issue-item:last-child { margin-bottom: 0; }
        .issue-type {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .issue-type.minor { background: #fef3c7; color: #92400e; }
        .issue-type.major { background: #fed7aa; color: #9a3412; }
        .issue-type.critical { background: #fee2e2; color: #991b1b; }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-light, #eee8d5);
        }
        .checkbox-row:last-child { border-bottom: none; }
        .checkbox-label {
          flex: 1;
          font-size: 13px;
          color: var(--text-primary, #073642);
        }
        .checkbox-meta {
          font-size: 11px;
          color: var(--text-muted, #93a1a1);
        }
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #93a1a1);
        }
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-primary {
          background: var(--accent, #268bd2);
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background: #1a6ba8;
        }
        .btn-secondary {
          background: var(--bg-secondary, #eee8d5);
          color: var(--text-primary, #073642);
          border: 1px solid var(--border-color, #93a1a1);
        }
        .btn-secondary:hover:not(:disabled) {
          background: var(--border-color, #93a1a1);
        }
        .feedback-toggle {
          display: flex;
          gap: 4px;
        }
        .feedback-btn {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          border: 1px solid var(--border-color, #93a1a1);
          background: var(--bg-primary, #fdf6e3);
        }
        .feedback-btn.active {
          background: var(--accent, #268bd2);
          color: white;
          border-color: var(--accent, #268bd2);
        }
      `}</style>

            <div className="panel-header">
                <span className="panel-title">📊 Post-Translation</span>
                <RoutingBadge routing={routing} />
            </div>

            {/* Quality Assessment */}
            <div className="section">
                <div className="section-header">
                    <span className="section-title">Quality Assessment</span>
                </div>
                <div className="section-content">
                    {scores ? (
                        <>
                            <div className="overall-score">
                                <span className="score-number">{Math.round(scores.overall * 100)}%</span>
                                <div style={{ flex: 1 }}>
                                    <ScoreBar score={scores.fluency} label="Fluency" />
                                    <ScoreBar score={scores.adequacy} label="Adequacy" />
                                    <ScoreBar score={scores.terminology} label="Terminology" />
                                    <ScoreBar score={scores.style} label="Style" />
                                </div>
                            </div>

                            {issues.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                                        Issues Found ({issues.length})
                                    </div>
                                    {issues.map((issue, i) => (
                                        <div key={i} className="issue-item">
                                            <span className={`issue-type ${issue.severity}`}>
                                                {issue.severity}
                                            </span>
                                            <div>
                                                <div>{issue.description}</div>
                                                {issue.suggestion && (
                                                    <div style={{ color: 'var(--accent, #268bd2)', marginTop: 4 }}>
                                                        💡 {issue.suggestion}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                            {isLoading ? 'Calculating scores...' : 'No quality scores available'}
                        </div>
                    )}
                </div>
            </div>

            {/* Translation Memory Save */}
            <div className="section">
                <div className="section-header">
                    <span className="section-title">💾 Translation Memory</span>
                </div>
                <div className="section-content">
                    <div className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={saveToTM}
                            onChange={(e) => setSaveToTM(e.target.checked)}
                            id="save-tm"
                        />
                        <label htmlFor="save-tm" className="checkbox-label">
                            Save this translation pair to TM
                        </label>
                    </div>
                    {saveToTM && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                            Source: {sourceText.slice(0, 50)}...<br />
                            Target: {translation.slice(0, 50)}...
                        </div>
                    )}
                </div>
            </div>

            {/* Terminology Updates */}
            {detectedTerms.length > 0 && (
                <div className="section">
                    <div className="section-header">
                        <span className="section-title">📖 New Terms Detected</span>
                    </div>
                    <div className="section-content">
                        {detectedTerms.map((term, i) => (
                            <div key={i} className="checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={termSelections[i.toString()] ?? true}
                                    onChange={(e) => setTermSelections(prev => ({
                                        ...prev,
                                        [i.toString()]: e.target.checked
                                    }))}
                                    id={`term-${i}`}
                                />
                                <label htmlFor={`term-${i}`} className="checkbox-label">
                                    {term.source} → {term.target}
                                </label>
                                <span className="checkbox-meta">Add to glossary</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Context Feedback */}
            {usedTMMatches.length > 0 && (
                <div className="section">
                    <div className="section-header">
                        <span className="section-title">📊 Context Feedback</span>
                    </div>
                    <div className="section-content">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Was this TM context helpful?
                        </div>
                        {usedTMMatches.map(match => (
                            <div key={match.id} className="checkbox-row">
                                <span className="checkbox-label" style={{ fontSize: 12 }}>
                                    {match.sourcePreview}...
                                </span>
                                <div className="feedback-toggle">
                                    <button
                                        className={`feedback-btn ${tmFeedback[match.id] === true ? 'active' : ''}`}
                                        onClick={() => setTMFeedback(prev => ({ ...prev, [match.id]: true }))}
                                    >
                                        👍 Helpful
                                    </button>
                                    <button
                                        className={`feedback-btn ${tmFeedback[match.id] === false ? 'active' : ''}`}
                                        onClick={() => setTMFeedback(prev => ({ ...prev, [match.id]: false }))}
                                    >
                                        👎 Not used
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="actions">
                <button
                    className="btn btn-secondary"
                    onClick={onSkip}
                    disabled={isLoading}
                >
                    Skip Updates
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isLoading}
                    style={{ marginLeft: 'auto' }}
                >
                    {isLoading ? 'Saving...' : '✓ Save & Finish'}
                </button>
            </div>
        </div>
    );
}
