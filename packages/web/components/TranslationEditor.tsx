'use client'

import { useState } from 'react'

interface Article {
    id: string
    title: string
    content_ja?: string
    content_en?: string
    translation_status?: string
    quality_score?: number
}

interface TranslationEditorProps {
    article: Article
    onSave?: (article: Article) => void
}

export default function TranslationEditor({ article, onSave }: TranslationEditorProps) {
    const [content_en, setContentEn] = useState(article.content_en || '')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{article.title}</h2>
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

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Editor Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Source (Japanese) */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        🇯🇵 Japanese (Source)
                    </label>
                    <div className="min-h-[300px] bg-gray-50 rounded border border-gray-200 p-3 whitespace-pre-wrap text-gray-800">
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
                    disabled
                    className="px-6 py-2 border border-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                    🤖 Get AI Suggestion (Iteration 4)
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
                {article.quality_score !== undefined && (
                    <span>Quality: {(article.quality_score * 100).toFixed(0)}%</span>
                )}
            </div>
        </div>
    )
}
