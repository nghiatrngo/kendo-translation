'use client';

/**
 * MAC-RAG Context Builder Panel
 * Pre-translation UI for viewing and editing context before translation
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { ContextObject, Entity, DomainClassification, StyleProfile } from '@/lib/context/context-builder';

// === TYPE DEFINITIONS ===

export interface TMMatch {
    id: string;
    sourceText: string;
    targetText: string;
    matchPercentage: number;
    domain?: string;
    qualityScore?: number;
    selected: boolean;
}

export interface TermEntry {
    id: string;
    sourceTerm: string;
    targetTerm: string;
    type: 'required' | 'preferred' | 'do_not_translate';
    selected: boolean;
}

export interface ContextBuilderState {
    context: ContextObject | null;
    tmMatches: TMMatch[];
    terminology: TermEntry[];
    coverageGaps: string[];
    isLoading: boolean;
    error: string | null;
}

interface ContextBuilderPanelProps {
    sourceText: string;
    sourceLang?: 'ja' | 'en';
    targetLang?: 'ja' | 'en';
    onContextReady?: (context: ContextObject, tmMatches: TMMatch[], terminology: TermEntry[]) => void;
    onStartTranslation?: () => void;
}

// === MAIN COMPONENT ===

export default function ContextBuilderPanel({
    sourceText,
    sourceLang = 'ja',
    targetLang = 'en',
    onContextReady,
    onStartTranslation,
}: ContextBuilderPanelProps) {
    const [state, setState] = useState<ContextBuilderState>({
        context: null,
        tmMatches: [],
        terminology: [],
        coverageGaps: [],
        isLoading: false,
        error: null,
    });

    const [editingDomain, setEditingDomain] = useState(false);
    const [editingStyle, setEditingStyle] = useState(false);

    // Build context when source text changes
    const buildContext = useCallback(async () => {
        if (!sourceText.trim()) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch('/api/context/retrieve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceText, sourceLang, targetLang }),
            });

            if (!response.ok) throw new Error('Failed to build context');

            const data = await response.json();

            const tmMatches: TMMatch[] = (data.retrieval?.tmMatches || []).map((m: TMMatch) => ({
                ...m,
                selected: m.matchPercentage >= 70,
            }));

            const terminology: TermEntry[] = (data.retrieval?.terminology || []).map((t: TermEntry) => ({
                ...t,
                selected: true,
            }));

            setState({
                context: data.context,
                tmMatches,
                terminology,
                coverageGaps: data.retrieval?.coverageReport?.gaps || [],
                isLoading: false,
                error: null,
            });

            if (onContextReady && data.context) {
                onContextReady(data.context, tmMatches, terminology);
            }
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Unknown error',
            }));
        }
    }, [sourceText, sourceLang, targetLang, onContextReady]);

    useEffect(() => {
        if (sourceText.trim().length > 10) {
            const debounce = setTimeout(buildContext, 500);
            return () => clearTimeout(debounce);
        }
    }, [sourceText, buildContext]);

    // Toggle TM match selection
    const toggleTMMatch = (id: string) => {
        setState(prev => ({
            ...prev,
            tmMatches: prev.tmMatches.map(m =>
                m.id === id ? { ...m, selected: !m.selected } : m
            ),
        }));
    };

    // Toggle terminology selection
    const toggleTerm = (id: string) => {
        setState(prev => ({
            ...prev,
            terminology: prev.terminology.map(t =>
                t.id === id ? { ...t, selected: !t.selected } : t
            ),
        }));
    };

    // Update domain
    const updateDomain = (primary: DomainClassification['primary']) => {
        if (!state.context) return;
        setState(prev => ({
            ...prev,
            context: prev.context ? {
                ...prev.context,
                domain: { ...prev.context.domain, primary },
            } : null,
        }));
        setEditingDomain(false);
    };

    // Update style
    const updateStyle = (formality: StyleProfile['formality']) => {
        if (!state.context) return;
        setState(prev => ({
            ...prev,
            context: prev.context ? {
                ...prev.context,
                style: { ...prev.context.style, formality },
            } : null,
        }));
        setEditingStyle(false);
    };

    const { context, tmMatches, terminology, coverageGaps, isLoading, error } = state;

    return (
        <div className="context-builder-panel">
            <style jsx>{`
        .context-builder-panel {
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
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          background: var(--accent-bg, #eee8d5);
          color: var(--text-primary, #073642);
          cursor: pointer;
        }
        .tag:hover {
          background: var(--accent-hover, #d9d2c2);
        }
        .tag.editable {
          border: 1px dashed var(--border-color, #93a1a1);
        }
        .entity-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .entity-tag {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          background: var(--highlight, #b58900);
          color: white;
        }
        .entity-tag.technique { background: #268bd2; }
        .entity-tag.equipment { background: #2aa198; }
        .entity-tag.term { background: #6c71c4; }
        .entity-tag.person { background: #d33682; }
        .tm-match, .term-entry {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          border-bottom: 1px solid var(--border-light, #eee8d5);
        }
        .tm-match:last-child, .term-entry:last-child {
          border-bottom: none;
        }
        .tm-match input[type="checkbox"],
        .term-entry input[type="checkbox"] {
          margin-top: 4px;
        }
        .tm-content, .term-content {
          flex: 1;
        }
        .tm-source {
          font-size: 12px;
          color: var(--text-secondary, #586e75);
          margin-bottom: 4px;
        }
        .tm-target {
          font-size: 13px;
          color: var(--text-primary, #073642);
        }
        .tm-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          font-size: 11px;
          color: var(--text-muted, #93a1a1);
        }
        .match-score {
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }
        .match-score.high { background: #d1fae5; color: #065f46; }
        .match-score.medium { background: #fef3c7; color: #92400e; }
        .match-score.low { background: #fee2e2; color: #991b1b; }
        .term-source {
          font-weight: 500;
          color: var(--text-primary, #073642);
        }
        .term-arrow {
          color: var(--text-muted, #93a1a1);
          margin: 0 4px;
        }
        .term-target {
          color: var(--accent, #268bd2);
        }
        .term-type {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          background: var(--accent-bg, #eee8d5);
          margin-left: 8px;
        }
        .gap-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #fef3c7;
          border-radius: 4px;
          font-size: 12px;
          color: #92400e;
          margin-bottom: 8px;
        }
        .gap-alert:last-child { margin-bottom: 0; }
        .summary-bar {
          display: flex;
          gap: 16px;
          padding: 12px;
          background: var(--bg-primary, #fdf6e3);
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 6px;
          margin-top: 16px;
        }
        .summary-item {
          font-size: 12px;
          color: var(--text-secondary, #586e75);
        }
        .summary-item strong {
          color: var(--text-primary, #073642);
        }
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--accent, #268bd2);
          color: white;
        }
        .btn-primary:hover {
          background: #1a6ba8;
        }
        .btn-secondary {
          background: var(--bg-secondary, #eee8d5);
          color: var(--text-primary, #073642);
          border: 1px solid var(--border-color, #93a1a1);
        }
        .btn-secondary:hover {
          background: var(--border-color, #93a1a1);
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary, #586e75);
        }
        .error {
          padding: 12px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 6px;
          font-size: 13px;
        }
        .empty-state {
          text-align: center;
          padding: 20px;
          color: var(--text-muted, #93a1a1);
          font-size: 13px;
        }
        .dropdown {
          position: relative;
          display: inline-block;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 10;
          min-width: 150px;
          background: white;
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          padding: 4px;
        }
        .dropdown-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          text-align: left;
          background: none;
          border: none;
          font-size: 13px;
          cursor: pointer;
          border-radius: 4px;
        }
        .dropdown-item:hover {
          background: var(--accent-bg, #eee8d5);
        }
      `}</style>

            <div className="panel-header">
                <span className="panel-title">📋 Context Builder</span>
                {isLoading && <span style={{ fontSize: 12, color: '#586e75' }}>Building...</span>}
            </div>

            {error && <div className="error">⚠️ {error}</div>}

            {isLoading && !context && (
                <div className="loading">Analyzing source text...</div>
            )}

            {context && (
                <>
                    {/* Source Analysis Section */}
                    <div className="section">
                        <div className="section-header">
                            <span className="section-title">📊 Source Analysis</span>
                        </div>
                        <div className="section-content">
                            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                <div className="dropdown">
                                    <span
                                        className="tag editable"
                                        onClick={() => setEditingDomain(!editingDomain)}
                                    >
                                        Domain: {context.domain.primary} ▼
                                    </span>
                                    {editingDomain && (
                                        <div className="dropdown-menu">
                                            {['kendo', 'martial_arts', 'technical', 'general'].map(d => (
                                                <button
                                                    key={d}
                                                    className="dropdown-item"
                                                    onClick={() => updateDomain(d as DomainClassification['primary'])}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="dropdown">
                                    <span
                                        className="tag editable"
                                        onClick={() => setEditingStyle(!editingStyle)}
                                    >
                                        Style: {context.style.formality} ▼
                                    </span>
                                    {editingStyle && (
                                        <div className="dropdown-menu">
                                            {['formal', 'semi_formal', 'casual', 'colloquial'].map(s => (
                                                <button
                                                    key={s}
                                                    className="dropdown-item"
                                                    onClick={() => updateStyle(s as StyleProfile['formality'])}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {context.style.keigoLevel && (
                                    <span className="tag">
                                        Keigo: {context.style.keigoLevel}
                                    </span>
                                )}
                            </div>

                            <div className="entity-list">
                                {context.entities.slice(0, 10).map((entity, i) => (
                                    <span key={i} className={`entity-tag ${entity.type}`}>
                                        {entity.text}
                                        {entity.translation && ` → ${entity.translation}`}
                                    </span>
                                ))}
                                {context.entities.length > 10 && (
                                    <span className="tag">+{context.entities.length - 10} more</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TM Matches Section */}
                    <div className="section">
                        <div className="section-header">
                            <span className="section-title">📚 Translation Memory ({tmMatches.length})</span>
                        </div>
                        <div className="section-content">
                            {tmMatches.length === 0 ? (
                                <div className="empty-state">No TM matches found</div>
                            ) : (
                                tmMatches.map(match => (
                                    <div key={match.id} className="tm-match">
                                        <input
                                            type="checkbox"
                                            checked={match.selected}
                                            onChange={() => toggleTMMatch(match.id)}
                                        />
                                        <div className="tm-content">
                                            <div className="tm-source">{match.sourceText.slice(0, 100)}...</div>
                                            <div className="tm-target">{match.targetText.slice(0, 100)}...</div>
                                            <div className="tm-meta">
                                                <span className={`match-score ${match.matchPercentage >= 90 ? 'high' :
                                                        match.matchPercentage >= 70 ? 'medium' : 'low'
                                                    }`}>
                                                    {match.matchPercentage}%
                                                </span>
                                                {match.domain && <span>Domain: {match.domain}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Terminology Section */}
                    <div className="section">
                        <div className="section-header">
                            <span className="section-title">📖 Terminology ({terminology.length})</span>
                        </div>
                        <div className="section-content">
                            {terminology.length === 0 ? (
                                <div className="empty-state">No terminology matches</div>
                            ) : (
                                terminology.map(term => (
                                    <div key={term.id} className="term-entry">
                                        <input
                                            type="checkbox"
                                            checked={term.selected}
                                            onChange={() => toggleTerm(term.id)}
                                        />
                                        <div className="term-content">
                                            <span className="term-source">{term.sourceTerm}</span>
                                            <span className="term-arrow">→</span>
                                            <span className="term-target">{term.targetTerm}</span>
                                            <span className="term-type">{term.type}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Coverage Gaps */}
                    {coverageGaps.length > 0 && (
                        <div className="section">
                            <div className="section-header">
                                <span className="section-title">⚠️ Coverage Gaps</span>
                            </div>
                            <div className="section-content">
                                {coverageGaps.map((gap, i) => (
                                    <div key={i} className="gap-alert">
                                        <span>⚠️</span>
                                        <span>{gap}</span>
                                        <button className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: 11 }}>
                                            Add to DB
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Bar */}
                    <div className="summary-bar">
                        <div className="summary-item">
                            <strong>{tmMatches.filter(m => m.selected).length}</strong> TM matches
                        </div>
                        <div className="summary-item">
                            <strong>{terminology.filter(t => t.selected).length}</strong> terms
                        </div>
                        <div className="summary-item">
                            <strong>{context.entities.length}</strong> entities
                        </div>
                        <div className="summary-item">
                            Complexity: <strong>{context.estimatedComplexity}</strong>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="actions">
                        <button className="btn btn-secondary" onClick={buildContext}>
                            🔄 Refresh
                        </button>
                        <button className="btn btn-secondary">
                            💾 Save Preset
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={onStartTranslation}
                            style={{ marginLeft: 'auto' }}
                        >
                            → Start Translation
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
