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
import ContextBuilderPanel from '@/components/translation/ContextBuilderPanel';
import TranslationCandidates from '@/components/translation/TranslationCandidates';
import PostTranslationPanel from '@/components/translation/PostTranslationPanel';

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
    const handleStartTranslation = async () => {
        setCurrentPhase('translate');
        await macRag.translate();
    };

    const handleAcceptCandidate = async () => {
        if (macRag.selectedCandidate) {
            setCurrentPhase('quality');
            await macRag.score(macRag.selectedCandidate.text);
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
        .source-panel {
          background: var(--bg-primary, #fdf6e3);
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .source-panel h3 {
          font-size: 14px;
          color: var(--text-secondary, #586e75);
          margin: 0 0 8px 0;
        }
        .source-text {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-primary, #073642);
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
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color, #93a1a1);
          border-top-color: var(--accent, #268bd2);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error {
          text-align: center;
          padding: 40px;
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
                <div className={`phase-step ${currentPhase === 'context' ? 'active' : currentPhase !== 'loading' ? 'completed' : ''}`}>
                    <span className="number">1</span>
                    Context
                </div>
                <div className={`phase-step ${currentPhase === 'translate' ? 'active' : ['quality', 'complete'].includes(currentPhase) ? 'completed' : ''}`}>
                    <span className="number">2</span>
                    Translate
                </div>
                <div className={`phase-step ${currentPhase === 'quality' ? 'active' : currentPhase === 'complete' ? 'completed' : ''}`}>
                    <span className="number">3</span>
                    Quality
                </div>
            </div>

            {/* Source Text Panel */}
            <div className="source-panel">
                <h3>📄 Source Text (Japanese)</h3>
                <div className="source-text">{article.content_ja}</div>
            </div>

            {/* Phase Content */}
            <div className="phase-content">
                {/* PHASE 1: Context Building */}
                {currentPhase === 'context' && (
                    <>
                        <ContextBuilderPanel
                            sourceText={article.content_ja || ''}
                            sourceLang="ja"
                            targetLang="en"
                            onContextReady={() => { }}
                            onStartTranslation={handleStartTranslation}
                        />

                        {/* JA-EN Analysis */}
                        {macRag.jaAnalysis && (
                            <div className="ja-analysis">
                                <h4>🇯🇵 JA-EN Analysis</h4>
                                <div className="ja-item">
                                    <span className="ja-label">Keigo Level:</span>
                                    <span className="ja-value">{macRag.jaAnalysis.honorifics?.level || 'N/A'}</span>
                                </div>
                                <div className="ja-item">
                                    <span className="ja-label">Register:</span>
                                    <span className="ja-value">{macRag.jaAnalysis.honorifics?.targetRegister || 'N/A'}</span>
                                </div>
                                {macRag.jaAnalysis.subjects && macRag.jaAnalysis.subjects.length > 0 && (
                                    <div className="ja-item">
                                        <span className="ja-label">Subjects:</span>
                                        <span className="ja-value">
                                            {macRag.jaAnalysis.subjects.map(s => s.inferredSubject).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* PHASE 2: Translation Candidates */}
                {currentPhase === 'translate' && (
                    <TranslationCandidates
                        sourceText={article.content_ja || ''}
                        sourceLang="ja"
                        candidates={macRag.candidates.map((c, i) => ({
                            ...c,
                            isRecommended: i === macRag.recommendedIndex,
                        }))}
                        onSelect={(candidate) => macRag.selectCandidate(candidate.id)}
                        onAccept={handleAcceptCandidate}
                        onRegenerate={() => macRag.translate()}
                        isLoading={macRag.isLoading}
                    />
                )}

                {/* PHASE 3: Quality & Save */}
                {currentPhase === 'quality' && macRag.selectedCandidate && (
                    <PostTranslationPanel
                        sourceText={article.content_ja || ''}
                        translation={macRag.selectedCandidate.text}
                        scores={macRag.qualityAssessment?.scores}
                        issues={macRag.qualityAssessment?.issues as any}
                        routing={macRag.routing?.decision as 'auto_accept' | 'light_pe' | 'standard_pe' | 'full_revision'}
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
        </div>
    );
}
