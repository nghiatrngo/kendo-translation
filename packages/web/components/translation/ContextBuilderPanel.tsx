'use client';

/**
 * MAC-RAG Context Builder Panel
 * Pre-translation UI for viewing and editing context before translation
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { ContextObject, Entity, DomainClassification, StyleProfile } from '../../lib/context/context-builder';

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
    onStartTranslation?: (literalContext: string) => void;
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

    const [literalContext, setLiteralContext] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'instructions' | 'retrieval'>('instructions');

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

            // Auto-populate literalContext with detected analysis if empty
            if (data.context) {
                const domain = data.context.domain.primary;
                const style = data.context.style.formality;
                const suggestion = `Domain: ${domain}\nStyle: ${style}\n\nAdd any specific instructions here...`;
                setLiteralContext(prev => prev || suggestion);
            }

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
        // Initial build
        buildContext();
    }, []);

    const { context, tmMatches, terminology, coverageGaps, isLoading, error } = state;

    return (
        <div className="context-builder-panel">
            <style jsx>{`
                .context-builder-panel {
                    background: var(--bg-secondary, #f8f5e6);
                    border: 1px solid var(--border-color, #93a1a1);
                    border-radius: 8px;
                    overflow: hidden;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .panel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: #eee8d5;
                    cursor: pointer;
                    user-select: none;
                    border-bottom: 1px solid #d3d3d3;
                }
                .panel-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary, #073642);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .panel-body {
                    background: #fdf6e3;
                }
                .tabs {
                    display: flex;
                    border-bottom: 1px solid #d3d3d3;
                    background: #eee8d5;
                }
                .tab {
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    color: #586e75;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                .tab:hover { background: #e0d8c0; }
                .tab.active {
                    color: #268bd2;
                    border-bottom-color: #268bd2;
                    background: #fdf6e3;
                    font-weight: 600;
                }
                .tab-content {
                    padding: 20px;
                }
                .section {
                    margin-bottom: 20px;
                }
                .section-header {
                    font-size: 13px;
                    font-weight: 700;
                    color: #586e75;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .source-text-box {
                    background: white;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #d3d3d3;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #073642;
                    margin-bottom: 20px;
                }
                .instructions-input {
                    width: 100%;
                    min-height: 150px;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #d3d3d3;
                    font-size: 14px;
                    font-family: 'Monaco', 'Menlo', monospace;
                    line-height: 1.5;
                    resize: vertical;
                    background: white;
                }
                .analysis-item {
                    background: white;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #e0e0e0;
                    margin-bottom: 8px;
                }
                .actions {
                    display: flex;
                    gap: 12px;
                    padding: 16px 20px;
                    background: #eee8d5;
                    border-top: 1px solid #d3d3d3;
                }
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-primary {
                    background: var(--accent, #268bd2);
                    color: white;
                    margin-left: auto;
                }
                .btn-secondary {
                    background: white;
                    border: 1px solid #93a1a1;
                    color: #586e75;
                }
                .empty-state {
                    color: #93a1a1;
                    font-style: italic;
                    padding: 20px;
                    text-align: center;
                    background: #f8f8f8;
                    border-radius: 6px;
                }
            `}</style>
            
            <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="panel-title">
                    <span>📝 Context Building</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isLoading && <span style={{ fontSize: 13, color: '#586e75' }}>Building context...</span>}
                    <span>{isExpanded ? '▼' : '▶'}</span>
                </div>
            </div>

            {isExpanded && (
                <div className="panel-container">
                    {/* Tabs */}
                    <div className="tabs">
                        <div 
                            className={`tab ${activeTab === 'instructions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('instructions')}
                        >
                            Instructions & Source
                        </div>
                        <div 
                            className={`tab ${activeTab === 'retrieval' ? 'active' : ''}`}
                            onClick={() => setActiveTab('retrieval')}
                        >
                            Retrieval Results ({tmMatches.length + terminology.length})
                        </div>
                    </div>

                    <div className="panel-body">
                        {error && <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 6, marginBottom: 16 }}>⚠️ {error}</div>}

                        {/* TAB 1: Instructions */}
                        {activeTab === 'instructions' && (
                            <div className="tab-content">
                                {/* Source Text */}
                                <div className="section">
                                    <div className="section-header">Source Text</div>
                                    <div className="source-text-box">
                                        {sourceText}
                                    </div>
                                </div>

                                {/* Context / Instructions Editor */}
                                <div className="section">
                                    <div className="section-header">Context & Instructions</div>
                                    <textarea
                                        className="instructions-input"
                                        placeholder="Enter instructions, domain, style, or specific requirements..."
                                        value={literalContext}
                                        onChange={(e) => setLiteralContext(e.target.value)}
                                    />
                                    <div style={{ fontSize: 12, color: '#93a1a1', marginTop: 8 }}>
                                        * Edit raw instructions here. This text will be used to guide the translation model.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Retrieval Results */}
                        {activeTab === 'retrieval' && (
                            <div className="tab-content">
                                {/* Bilingual DB Matches */}
                                <div className="section">
                                    <div className="section-header">Bilingual DB Matches ({tmMatches.length})</div>
                                    {tmMatches.length > 0 ? (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {tmMatches.map(match => (
                                                <div key={match.id} className="analysis-item">
                                                    <div style={{ marginBottom: 4, color: '#586e75', fontSize: 13 }}>{match.sourceText}</div>
                                                    <div style={{ fontWeight: 500 }}>{match.targetText}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                                        <span style={{ fontSize: 11, background: '#eee8d5', padding: '2px 6px', borderRadius: 4 }}>
                                                            {match.matchPercentage}% Relevance
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">No bilingual database matches found.</div>
                                    )}
                                </div>

                                {/* Terminology */}
                                <div className="section">
                                    <div className="section-header">Terminology ({terminology.length})</div>
                                     {terminology.length > 0 ? (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {terminology.map(term => (
                                                <div key={term.id} className="analysis-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{term.sourceTerm}</span>
                                                    <span>→</span>
                                                    <span style={{ fontWeight: 600 }}>{term.targetTerm}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">No terminology found.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="actions">
                         <button className="btn btn-secondary" onClick={buildContext}>
                            🔄 Refresh Context
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={() => onStartTranslation && onStartTranslation(literalContext)}
                            disabled={!context || isLoading}
                        >
                            Generate Translation →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
