'use client';

/**
 * MAC-RAG Integrated Translation Page
 * Full 3-phase translation workflow:
 * - Phase 1: Context Building (pre-translation)
 * - Phase 2: Translation (multi-candidate generation)
 * - Phase 3: Quality & Save (post-translation)
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useMacRag from '@/lib/hooks/useMacRag';
import ContextBuilderPanel from '../../../../components/translation/ContextBuilderPanel';
import TranslationOutput from '../../../../components/translation/TranslationOutput';
import PostTranslationPanel from '../../../../components/translation/PostTranslationPanel';
import AgentConfigPanel from '@/components/AgentConfigPanel';
import AgentConversationLog from '@/components/AgentConversationLog';

// Types
interface Article {
    id: string;
    title: string;
    content_ja?: string;
    content_en?: string;
    translation_status?: string;
}

type Phase = 'loading' | 'context' | 'translate' | 'quality' | 'complete';

export default function MacRagTranslatePage() {
    const params = useParams();
    const router = useRouter();
    const articleId = params.id as string;

    // Article state
    const [article, setArticle] = useState<Article | null>(null);
    const [loadingArticle, setLoadingArticle] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Phase state
    const [currentPhase, setCurrentPhase] = useState<Phase>('loading');

    // Tab state for Agent Config / Logs panel
    const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

    // Context panel visibility
    const [showContextPanel, setShowContextPanel] = useState(true);

    // Literal Context (Special Instructions)
    const [literalContext, setLiteralContext] = useState('');

    // MAC-RAG hook
    const macRag = useMacRag();

    // Fetch article on mount
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`/api/articles/${articleId}`);
                if (!response.ok) throw new Error('Article not found');
                const data = await response.json();

                // API returns { article: {...} } so extract it
                const articleData = data.article || data;
                setArticle(articleData);
                setCurrentPhase('context');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load article');
            } finally {
                setLoadingArticle(false);
            }
        };

        if (articleId) {
            fetchArticle();
        }
    }, [articleId]);

    // Phase 1: Build context when entering context phase
    useEffect(() => {
        if (currentPhase === 'context' && article?.content_ja && !macRag.context && !macRag.isLoading) {
            macRag.buildContext(article.content_ja, {
                sourceLang: 'ja',
                targetLang: 'en',
            });
        }
    }, [currentPhase, article, macRag]);

    // Handlers
    const handleStartTranslation = async (contextInstructions?: string) => {
        setCurrentPhase('translate');
        // Request ONLY Natural translation
        await macRag.translate({
            literalContext: contextInstructions,
            approaches: ['natural'],
            articleId, // Pass ID for logging
        });
    };

    const handleAcceptCandidate = async () => {
        // If we have a selected candidate (which is the only one), proceed
        if (macRag.selectedCandidate) {
            setCurrentPhase('quality');
            await macRag.score(macRag.selectedCandidate.text, { literalContext });
        }
    };

    const handleSave = async () => {
        if (!article || !macRag.selectedCandidate) return;

        try {
            // Save translation to article
            const response = await fetch(`/api/articles/${articleId}/translate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content_en: macRag.selectedCandidate.text,
                    translation_status: 'translated',
                    quality_score: macRag.qualityAssessment?.scores.overall,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to save translation');
            }

            // Save to TM if requested
            await fetch('/api/post/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceText: article.content_ja,
                    targetText: macRag.selectedCandidate.text,
                    sourceLang: 'ja',
                    targetLang: 'en',
                    domain: macRag.context?.domain.primary || 'kendo',
                    qualityScore: macRag.qualityAssessment?.scores.overall,
                    saveToTM: true,
                }),
            });

            setCurrentPhase('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    const handleSkip = () => {
        setCurrentPhase('complete');
    };

    // Loading state
    if (loadingArticle) {
        return (
            <div className="mac-rag-page loading">
                <style jsx>{`
                    .loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 400px;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid #eee8d5;
                        border-top-color: #268bd2;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 16px;
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
                <div className="spinner" />
                <p>Loading article...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="mac-rag-page error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => router.push('/translate')}>Back to Translate</button>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="mac-rag-page error">
                <h2>Article Not Found</h2>
                <button onClick={() => router.push('/translate')}>Back to Translate</button>
            </div>
        );
    }

    return (
        <div className="mac-rag-page">
            <style jsx>{`
        .mac-rag-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .header {
          margin-bottom: 24px;
        }
        .header h1 {
          font-size: 24px;
          color: var(--text-primary, #073642);
          margin: 0 0 8px 0;
        }
        .header .subtitle {
          color: var(--text-secondary, #586e75);
          font-size: 14px;
        }
        .phase-indicator {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }
        .phase-step {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          background: var(--bg-secondary, #eee8d5);
          color: var(--text-secondary, #586e75);
        }
        .phase-step.active {
          background: var(--accent, #268bd2);
          color: white;
        }
        .phase-step.completed {
          background: #10b981;
          color: white;
        }
        .phase-step .number {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          font-weight: 700;
        }
        .phase-content {
          margin-bottom: 24px;
        }
        .complete-panel {
          text-align: center;
          padding: 40px;
          background: #d1fae5;
          border-radius: 8px;
        }
        .complete-panel h2 {
          color: #065f46;
          margin: 0 0 8px 0;
        }
        .complete-panel p {
          color: #047857;
        }
        .complete-panel .actions {
          margin-top: 16px;
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
        }
        .btn-primary {
          background: var(--accent, #268bd2);
          color: white;
        }
        .btn-secondary {
          background: var(--bg-secondary, #eee8d5);
          color: var(--text-primary, #073642);
          border: 1px solid var(--border-color, #93a1a1);
        }
        .ja-analysis {
          background: var(--bg-secondary, #eee8d5);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        .ja-analysis h4 {
          font-size: 14px;
          margin: 0 0 12px 0;
          color: var(--text-secondary, #586e75);
        }
        .ja-item {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .ja-label {
          color: var(--text-secondary, #586e75);
          min-width: 100px;
        }
        .ja-value {
          color: var(--text-primary, #073642);
        }
      `}</style>

            {/* Header */}
            <div className="header">
                <h1>🔬 MAC-RAG Translation</h1>
                <div className="subtitle">{article.title}</div>
            </div>

            {/* Phase Indicator */}
            <div className="phase-indicator">
                <button
                    className={`phase-step ${currentPhase === 'context' ? 'active' : currentPhase !== 'loading' ? 'completed' : ''}`}
                    onClick={() => currentPhase !== 'loading' && setCurrentPhase('context')}
                    style={{ cursor: currentPhase !== 'loading' ? 'pointer' : 'default', border: 'none' }}
                    disabled={currentPhase === 'loading'}
                >
                    <span className="number">1</span>
                    Context
                </button>
                <button
                    className={`phase-step ${currentPhase === 'translate' ? 'active' : ['quality', 'complete'].includes(currentPhase) ? 'completed' : ''}`}
                    onClick={() => ['translate', 'quality', 'complete'].includes(currentPhase) && setCurrentPhase('translate')}
                    style={{ cursor: ['translate', 'quality', 'complete'].includes(currentPhase) ? 'pointer' : 'default', border: 'none' }}
                    disabled={currentPhase === 'context' || currentPhase === 'loading'}
                >
                    <span className="number">2</span>
                    Translate
                </button>
                <button
                    className={`phase-step ${currentPhase === 'quality' ? 'active' : currentPhase === 'complete' ? 'completed' : ''}`}
                    onClick={() => ['quality', 'complete'].includes(currentPhase) && setCurrentPhase('quality')}
                    style={{ cursor: ['quality', 'complete'].includes(currentPhase) ? 'pointer' : 'default', border: 'none' }}
                    disabled={!['quality', 'complete'].includes(currentPhase)}
                >
                    <span className="number">3</span>
                    Quality
                </button>
            </div>

            {/* Phase Content */}
            <div className="phase-content">
                {/* PHASE 1: Context Building */}
                {(currentPhase === 'context' || currentPhase === 'translate') && (
                    <div style={{ marginBottom: 24 }}>
                        <ContextBuilderPanel
                            sourceText={article.content_ja || ''}
                            sourceLang="ja"
                            targetLang="en"
                            onContextReady={() => { }}
                            onStartTranslation={(context) => handleStartTranslation(context)}
                        />
                    </div>
                )}

                {/* PHASE 2: Translation Output */}
                {currentPhase === 'translate' && (
                    <TranslationOutput
                        translation={macRag.selectedCandidate?.text || ''}
                        modelName="Meta Llama 3.3 (Natural)"
                        isLoading={macRag.isLoading}
                        onAccept={handleAcceptCandidate}
                        onRegenerate={() => macRag.translate({ literalContext, approaches: ['natural'] })}
                    />
                )}

                {/* PHASE 3: Quality & Save */}
                {currentPhase === 'quality' && macRag.selectedCandidate && (
                    <PostTranslationPanel
                        sourceText={article.content_ja || ''}
                        translation={macRag.selectedCandidate.text}
                        scores={macRag.qualityAssessment?.scores}
                        issues={macRag.qualityAssessment?.issues as any}
                        routing={macRag.routing?.decision as any}
                        onSave={handleSave}
                        onSkip={handleSkip}
                        isLoading={macRag.isLoading}
                    />
                )}

                {/* COMPLETE */}
                {currentPhase === 'complete' && (
                    <div className="complete-panel">
                        <h2>✅ Translation Complete!</h2>
                        <p>Your translation has been saved successfully.</p>
                        <div className="actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => router.push('/translate')}
                            >
                                Back to Queue
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => router.push(`/articles/${articleId}`)}
                            >
                                View Article
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error display */}
            {macRag.error && (
                <div style={{
                    padding: 16,
                    background: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: 8,
                    marginTop: 16
                }}>
                    ⚠️ {macRag.error}
                </div>
            )}

            {/* Agent Config / Logs Panel */}
            <div style={{ marginTop: 24, border: '1px solid var(--border-color, #93a1a1)', borderRadius: 8, overflow: 'hidden' }}>
                {/* Tab Headers */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #93a1a1)', background: 'var(--bg-secondary, #eee8d5)' }}>
                    <button
                        onClick={() => setActiveTab('config')}
                        style={{
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 500,
                            border: 'none',
                            background: activeTab === 'config' ? 'var(--bg-primary, #fdf6e3)' : 'transparent',
                            borderBottom: activeTab === 'config' ? '2px solid var(--accent, #268bd2)' : 'none',
                            color: activeTab === 'config' ? 'var(--accent, #268bd2)' : 'var(--text-secondary, #586e75)',
                            cursor: 'pointer'
                        }}
                    >
                        ⚙️ Agent Config
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        style={{
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 500,
                            border: 'none',
                            background: activeTab === 'logs' ? 'var(--bg-primary, #fdf6e3)' : 'transparent',
                            borderBottom: activeTab === 'logs' ? '2px solid var(--accent, #268bd2)' : 'none',
                            color: activeTab === 'logs' ? 'var(--accent, #268bd2)' : 'var(--text-secondary, #586e75)',
                            cursor: 'pointer'
                        }}
                    >
                        💬 Agent Logs
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{ padding: 16, background: 'var(--bg-primary, #fdf6e3)' }}>
                    {activeTab === 'config' && <AgentConfigPanel />}
                    {activeTab === 'logs' && <AgentConversationLog autoRefresh={false} articleId={articleId} />}
                </div>
            </div>
        </div>
    );
}
