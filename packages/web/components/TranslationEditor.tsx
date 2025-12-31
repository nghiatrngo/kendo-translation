'use client'

import { useState, useEffect } from 'react'
import AgentConfigPanel from './AgentConfigPanel'
import AgentConversationLog from './AgentConversationLog'

interface Article {
    id: string
    title: string
    content_ja?: string
    content_en?: string
    translation_status?: string
    quality_score?: number
}

interface SubjectResolution {
    sentence: string
    inferredSubject: string
    confidence: number
}

interface HonorificMapping {
    japanese: string
    englishRendering: string
}

interface OnomatopoeiaRendering {
    japanese: string
    recommended: string
    category: string
}

interface JAENFeatures {
    subjectResolutions: SubjectResolution[]
    honorificMappings: HonorificMapping[]
    onomatopoeiaRenderings: OnomatopoeiaRendering[]
    keigoLevel: string
    voiceGuidance?: string
}

interface AISuggestion {
    translation: string
    confidence: number
    jaenFeatures: JAENFeatures
}

interface TMMatch {
    id: string
    source_text: string
    target_text: string
    similarity: number
    quality: string
    domain: string
}

interface TranslationEditorProps {
    article: Article
    onSave?: (article: Article) => void
}

export default function TranslationEditor({ article, onSave }: TranslationEditorProps) {
    const [content_en, setContentEn] = useState(article.content_en || '')
    const [saving, setSaving] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
    const [showFeatures, setShowFeatures] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [tmMatches, setTmMatches] = useState<TMMatch[]>([])
    const [tmLoading, setTmLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'tm' | 'config' | 'logs'>('tm')

    // Fetch TM matches when component loads or source text changes
    useEffect(() => {
        const fetchTmMatches = async () => {
            if (!article.content_ja || article.content_ja.length < 10) return

            setTmLoading(true)
            try {
                // Use first 200 chars for TM lookup
                const searchText = article.content_ja.substring(0, 200)
                const response = await fetch('/api/tm/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source_text: searchText, limit: 5 }),
                })

                if (response.ok) {
                    const data = await response.json()
                    setTmMatches(data.matches || [])
                }
            } catch (error) {
                console.error('TM search error:', error)
            } finally {
                setTmLoading(false)
            }
        }

        fetchTmMatches()
    }, [article.content_ja])


    const handleSave = async () => {
        setSaving(true)
        setMessage(null)

        try {
            const response = await fetch(`/api/articles/${article.id}/translate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content_en,
                    translation_status: 'draft',
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save translation')
            }

            setMessage({ type: 'success', text: 'Translation saved!' })
            if (onSave && data.article) {
                onSave(data.article)
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to save',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleGetAISuggestion = async () => {
        if (!article.content_ja) {
            setMessage({ type: 'error', text: 'No Japanese content to translate' })
            return
        }

        setAiLoading(true)
        setMessage(null)
        setAiSuggestion(null)

        try {
            const response = await fetch('/api/translate/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_text: article.content_ja,
                    context: `Article title: ${article.title}`,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get AI suggestion')
            }

            setAiSuggestion(data)
            setShowFeatures(true)
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to get AI suggestion',
            })
        } finally {
            setAiLoading(false)
        }
    }

    const handleAcceptSuggestion = () => {
        if (aiSuggestion) {
            setContentEn(aiSuggestion.translation)
            setMessage({ type: 'success', text: 'AI suggestion accepted!' })
        }
    }

    const handleRejectSuggestion = () => {
        setAiSuggestion(null)
        setShowFeatures(false)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{article.title}</h2>
                <div className="flex items-center gap-2">
                    {aiSuggestion && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            AI: {(aiSuggestion.confidence * 100).toFixed(0)}% confident
                        </span>
                    )}
                    {article.translation_status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${article.translation_status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : article.translation_status === 'review'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {article.translation_status}
                        </span>
                    )}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* AI Suggestion Panel */}
            {aiSuggestion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-blue-800">🤖 AI Translation Suggestion</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAcceptSuggestion}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                ✓ Accept
                            </button>
                            <button
                                onClick={handleRejectSuggestion}
                                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                ✗ Reject
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded border border-blue-200 p-3 max-h-48 overflow-y-auto text-sm">
                        {aiSuggestion.translation}
                    </div>
                </div>
            )}

            {/* JA-EN Features Panel */}
            {showFeatures && aiSuggestion && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <button
                        onClick={() => setShowFeatures(!showFeatures)}
                        className="flex items-center justify-between w-full"
                    >
                        <h3 className="font-medium text-purple-800">📊 JA-EN Analysis</h3>
                        <span className="text-purple-600">{showFeatures ? '▼' : '▶'}</span>
                    </button>
                    {showFeatures && (
                        <div className="mt-3 space-y-3 text-sm">
                            {/* Keigo Level */}
                            <div>
                                <span className="font-medium text-purple-700">Formality:</span>{' '}
                                <span className="capitalize">{aiSuggestion.jaenFeatures.keigoLevel.replace('_', ' ')}</span>
                            </div>

                            {/* Honorifics */}
                            {aiSuggestion.jaenFeatures.honorificMappings.length > 0 && (
                                <div>
                                    <span className="font-medium text-purple-700">Honorifics:</span>
                                    <ul className="mt-1 ml-4 list-disc">
                                        {aiSuggestion.jaenFeatures.honorificMappings.map((h, i) => (
                                            <li key={i}>{h.japanese} → {h.englishRendering}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Onomatopoeia */}
                            {aiSuggestion.jaenFeatures.onomatopoeiaRenderings.length > 0 && (
                                <div>
                                    <span className="font-medium text-purple-700">Onomatopoeia:</span>
                                    <ul className="mt-1 ml-4 list-disc">
                                        {aiSuggestion.jaenFeatures.onomatopoeiaRenderings.map((o, i) => (
                                            <li key={i}>{o.japanese} → {o.recommended} ({o.category})</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Subject Resolutions */}
                            {aiSuggestion.jaenFeatures.subjectResolutions.length > 0 && (
                                <div>
                                    <span className="font-medium text-purple-700">Inferred Subjects:</span>
                                    <ul className="mt-1 ml-4 list-disc">
                                        {aiSuggestion.jaenFeatures.subjectResolutions.map((s, i) => (
                                            <li key={i}>
                                                &quot;{s.sentence.substring(0, 30)}...&quot; → {s.inferredSubject}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Editor Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Source (Japanese) */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        🇯🇵 Japanese (Source)
                    </label>
                    <div className="min-h-[300px] bg-gray-50 rounded border border-gray-200 p-3 whitespace-pre-wrap text-gray-800 overflow-y-auto">
                        {article.content_ja || (
                            <span className="text-gray-400 italic">
                                No Japanese content available
                            </span>
                        )}
                    </div>
                </div>

                {/* Target (English) */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        🇬🇧 English (Translation)
                    </label>
                    <textarea
                        value={content_en}
                        onChange={(e) => setContentEn(e.target.value)}
                        placeholder="Enter your translation here..."
                        className="w-full min-h-[300px] bg-white rounded border border-gray-300 p-3 resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
                <button
                    onClick={handleGetAISuggestion}
                    disabled={aiLoading || !article.content_ja}
                    className="px-6 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                    {aiLoading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Getting suggestion...
                        </>
                    ) : (
                        '🤖 Get AI Suggestion'
                    )}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                >
                    {saving ? 'Saving...' : '💾 Save Translation'}
                </button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-gray-500">
                <span>Source: {article.content_ja?.length || 0} chars</span>
                <span>Translation: {content_en.length} chars</span>
                {(article.quality_score !== undefined || aiSuggestion) && (
                    <span className="flex items-center gap-1">
                        Quality:
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500"
                                style={{
                                    width: `${((aiSuggestion?.confidence || article.quality_score || 0) * 100)}%`
                                }}
                            />
                        </div>
                        {((aiSuggestion?.confidence || article.quality_score || 0) * 100).toFixed(0)}%
                    </span>
                )}
            </div>

            {/* Tabbed Panel: TM, Agent Config, Agent Logs */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => setActiveTab('tm')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'tm'
                                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                    >
                        📚 Translation Memory
                        {tmMatches.length > 0 && (
                            <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                {tmMatches.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'config'
                                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                    >
                        ⚙️ Agent Config
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'logs'
                                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                    >
                        💬 Agent Logs
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 bg-white">
                    {/* TM Tab */}
                    {activeTab === 'tm' && (
                        <div>
                            {tmLoading && (
                                <p className="text-sm text-gray-500 animate-pulse">Searching translation memory...</p>
                            )}
                            {!tmLoading && tmMatches.length === 0 && (
                                <p className="text-sm text-gray-500">No similar translations found in TM.</p>
                            )}
                            {tmMatches.length > 0 && (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {tmMatches.map((match) => (
                                        <div
                                            key={match.id}
                                            className="bg-amber-50 rounded border border-amber-200 p-3 text-sm"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                                    {(match.similarity * 100).toFixed(0)}% match
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setContentEn(match.target_text)
                                                        setMessage({ type: 'success', text: 'TM translation applied!' })
                                                    }}
                                                    className="text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700"
                                                >
                                                    Use this
                                                </button>
                                            </div>
                                            <div className="text-gray-600 text-xs mb-1 line-clamp-2">
                                                <strong>JP:</strong> {match.source_text.substring(0, 100)}...
                                            </div>
                                            <div className="text-gray-800 text-xs line-clamp-2">
                                                <strong>EN:</strong> {match.target_text.substring(0, 100)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Agent Config Tab */}
                    {activeTab === 'config' && <AgentConfigPanel />}

                    {/* Agent Logs Tab */}
                    {activeTab === 'logs' && <AgentConversationLog autoRefresh={false} />}
                </div>
            </div>
        </div>
    )
}
