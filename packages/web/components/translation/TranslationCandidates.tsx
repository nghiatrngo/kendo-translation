'use client';

/**
 * MAC-RAG Translation Candidates Panel
 * Phase 3: Display multiple translation candidates for user selection
 */

import React, { useState } from 'react';

// === TYPE DEFINITIONS ===

export interface TranslationCandidate {
    id: string;
    text: string;
    approach: 'literal' | 'natural' | 'formal';
    confidence: number;
    isRecommended?: boolean;
}

interface TranslationCandidatesProps {
    sourceText: string;
    sourceLang?: 'ja' | 'en';
    candidates: TranslationCandidate[];
    onSelect?: (candidate: TranslationCandidate) => void;
    onEdit?: (candidate: TranslationCandidate, newText: string) => void;
    onRegenerate?: () => void;
    onAccept?: (candidate: TranslationCandidate) => void;
    isLoading?: boolean;
}

// === HELPER COMPONENTS ===

function ConfidenceBadge({ confidence }: { confidence: number }) {
    const percentage = Math.round(confidence * 100);
    const color = confidence >= 0.90 ? '#10b981' : confidence >= 0.80 ? '#3b82f6' : '#f59e0b';

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 500,
            color: color,
            background: `${color}15`,
        }}>
            {percentage}%
        </span>
    );
}

function ApproachLabel({ approach }: { approach: string }) {
    const config: Record<string, { label: string; icon: string }> = {
        literal: { label: 'Literal', icon: '📐' },
        natural: { label: 'Natural', icon: '✨' },
        formal: { label: 'Formal', icon: '👔' },
    };

    const { label, icon } = config[approach] || { label: approach, icon: '📝' };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: 'var(--text-secondary, #586e75)',
        }}>
            {icon} {label}
        </span>
    );
}

// === MAIN COMPONENT ===

export default function TranslationCandidates({
    sourceText,
    sourceLang = 'ja',
    candidates,
    onSelect,
    onEdit,
    onRegenerate,
    onAccept,
    isLoading = false,
}: TranslationCandidatesProps) {
    const [selectedId, setSelectedId] = useState<string | null>(
        candidates.find(c => c.isRecommended)?.id || candidates[0]?.id || null
    );
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const handleSelect = (candidate: TranslationCandidate) => {
        setSelectedId(candidate.id);
        onSelect?.(candidate);
    };

    const startEditing = (candidate: TranslationCandidate) => {
        setEditingId(candidate.id);
        setEditText(candidate.text);
    };

    const saveEdit = (candidate: TranslationCandidate) => {
        if (editText.trim() && editText !== candidate.text) {
            onEdit?.(candidate, editText);
        }
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const selectedCandidate = candidates.find(c => c.id === selectedId);

    return (
        <div className="translation-candidates">
            <style jsx>{`
        .translation-candidates {
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
        .source-section {
          margin-bottom: 16px;
        }
        .source-label {
          font-size: 12px;
          color: var(--text-secondary, #586e75);
          margin-bottom: 4px;
        }
        .source-text {
          padding: 12px;
          background: var(--bg-primary, #fdf6e3);
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary, #073642);
        }
        .candidate-card {
          position: relative;
          margin-bottom: 12px;
          padding: 12px;
          background: var(--bg-primary, #fdf6e3);
          border: 2px solid var(--border-color, #93a1a1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .candidate-card:last-child {
          margin-bottom: 0;
        }
        .candidate-card:hover {
          border-color: var(--accent, #268bd2);
        }
        .candidate-card.selected {
          border-color: var(--accent, #268bd2);
          background: rgba(38, 139, 210, 0.05);
        }
        .candidate-card.recommended {
          border-color: #10b981;
        }
        .candidate-card.recommended::after {
          content: '✓ RECOMMENDED';
          position: absolute;
          top: -10px;
          right: 12px;
          padding: 2px 8px;
          background: #10b981;
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 4px;
        }
        .candidate-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .candidate-radio {
          width: 18px;
          height: 18px;
          accent-color: var(--accent, #268bd2);
        }
        .candidate-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary, #073642);
          padding-left: 30px;
        }
        .candidate-textarea {
          width: 100%;
          min-height: 80px;
          padding: 8px;
          border: 1px solid var(--accent, #268bd2);
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.6;
          font-family: inherit;
          resize: vertical;
        }
        .candidate-actions {
          display: flex;
          gap: 8px;
          padding-left: 30px;
          margin-top: 8px;
        }
        .edit-btn {
          padding: 4px 8px;
          font-size: 11px;
          color: var(--text-secondary, #586e75);
          background: none;
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 4px;
          cursor: pointer;
        }
        .edit-btn:hover {
          background: var(--bg-secondary, #eee8d5);
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
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary, #586e75);
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-color, #93a1a1);
          border-top-color: var(--accent, #268bd2);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-muted, #93a1a1);
        }
      `}</style>

            <div className="panel-header">
                <span className="panel-title">🔄 Translation Candidates</span>
                {!isLoading && candidates.length > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {candidates.length} options
                    </span>
                )}
            </div>

            {/* Source Text */}
            <div className="source-section">
                <div className="source-label">Source ({sourceLang.toUpperCase()})</div>
                <div className="source-text">{sourceText}</div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <span>Generating translations...</span>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && candidates.length === 0 && (
                <div className="empty-state">
                    No translation candidates yet.<br />
                    Click &quot;Generate&quot; to create translations.
                </div>
            )}

            {/* Candidates List */}
            {!isLoading && candidates.map(candidate => (
                <div
                    key={candidate.id}
                    className={`candidate-card ${selectedId === candidate.id ? 'selected' : ''} ${candidate.isRecommended ? 'recommended' : ''}`}
                    onClick={() => handleSelect(candidate)}
                >
                    <div className="candidate-header">
                        <input
                            type="radio"
                            name="candidate"
                            className="candidate-radio"
                            checked={selectedId === candidate.id}
                            onChange={() => handleSelect(candidate)}
                        />
                        <ApproachLabel approach={candidate.approach} />
                        <ConfidenceBadge confidence={candidate.confidence} />
                    </div>

                    {editingId === candidate.id ? (
                        <>
                            <textarea
                                className="candidate-textarea"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="candidate-actions" onClick={(e) => e.stopPropagation()}>
                                <button className="edit-btn" onClick={() => saveEdit(candidate)}>
                                    ✓ Save
                                </button>
                                <button className="edit-btn" onClick={cancelEdit}>
                                    ✕ Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="candidate-text">{candidate.text}</div>
                            <div className="candidate-actions" onClick={(e) => e.stopPropagation()}>
                                <button className="edit-btn" onClick={() => startEditing(candidate)}>
                                    ✏️ Edit
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Actions */}
            {!isLoading && (
                <div className="actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onRegenerate}
                        disabled={isLoading}
                    >
                        🔄 Regenerate
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => selectedCandidate && onAccept?.(selectedCandidate)}
                        disabled={!selectedCandidate || isLoading}
                        style={{ marginLeft: 'auto' }}
                    >
                        ✓ Accept & Continue
                    </button>
                </div>
            )}
        </div>
    );
}
