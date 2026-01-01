'use client';

/**
 * MAC-RAG Translation Queue
 * Lists articles available for MAC-RAG translation
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
    id: string;
    title: string;
    content_ja?: string;
    translation_status?: string;
    created_at: string;
}

export default function MacRagQueuePage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch('/api/articles');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                // Filter to articles with Japanese content
                const jaArticles = (data.articles || data || []).filter(
                    (a: Article) => a.content_ja && a.content_ja.length > 0
                );
                setArticles(jaArticles);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load articles');
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    if (loading) {
        return (
            <div className="mac-rag-queue-page">
                <h1>🔬 MAC-RAG Translation</h1>
                <p>Loading articles...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mac-rag-queue-page">
                <h1>🔬 MAC-RAG Translation</h1>
                <p style={{ color: 'red' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="mac-rag-queue-page" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
            <style jsx>{`
        .mac-rag-queue-page h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #586e75;
          margin-bottom: 24px;
        }
        .article-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .article-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #fdf6e3;
          border: 1px solid #93a1a1;
          border-radius: 8px;
        }
        .article-card:hover {
          border-color: #268bd2;
        }
        .article-title {
          font-weight: 500;
          color: #073642;
        }
        .article-meta {
          font-size: 12px;
          color: #93a1a1;
          margin-top: 4px;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-translated {
          background: #d1fae5;
          color: #065f46;
        }
        .translate-btn {
          padding: 8px 16px;
          background: #268bd2;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
        }
        .translate-btn:hover {
          background: #1a6ba8;
        }
      `}</style>

            <h1>🔬 MAC-RAG Translation</h1>
            <p className="subtitle">
                Select an article to translate using the full 3-phase MAC-RAG pipeline
            </p>

            <div className="article-list">
                {articles.length === 0 ? (
                    <p>No articles with Japanese content found.</p>
                ) : (
                    articles.map(article => (
                        <div key={article.id} className="article-card">
                            <div>
                                <div className="article-title">{article.title}</div>
                                <div className="article-meta">
                                    {article.content_ja?.slice(0, 60)}...
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className={`status-badge status-${article.translation_status || 'pending'}`}>
                                    {article.translation_status || 'pending'}
                                </span>
                                <Link
                                    href={`/translate/mac-rag/${article.id}`}
                                    className="translate-btn"
                                >
                                    Translate →
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
