import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ArticleDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !article) {
        notFound()
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-6">
                <Link href="/articles" className="hover:text-blue-600">
                    Articles
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{article.title}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
                    <p className="text-gray-500 mt-1">
                        Created: {new Date(article.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    {article.translation_status && (
                        <span className={`px-3 py-1 text-sm rounded-full ${article.translation_status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : article.translation_status === 'review'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                            {article.translation_status}
                        </span>
                    )}
                    <Link
                        href={`/translate/${article.id}`}
                        className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                        ✏️ Translate
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Japanese */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        🇯🇵 Japanese
                    </h2>
                    <div className="prose max-w-none">
                        {article.content_ja ? (
                            <div className="whitespace-pre-wrap text-gray-800">
                                {article.content_ja}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">
                                No Japanese content available
                            </p>
                        )}
                    </div>
                </div>

                {/* English */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        🇬🇧 English
                    </h2>
                    <div className="prose max-w-none">
                        {article.content_en ? (
                            <div className="whitespace-pre-wrap text-gray-800">
                                {article.content_en}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">
                                Not yet translated - <Link href={`/translate/${article.id}`} className="text-blue-600 hover:underline">Start translating</Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg flex gap-6 text-sm text-gray-600">
                <span>Japanese: {article.content_ja?.length || 0} chars</span>
                <span>English: {article.content_en?.length || 0} chars</span>
                {article.quality_score !== undefined && article.quality_score !== null && (
                    <span>Quality: {(article.quality_score * 100).toFixed(0)}%</span>
                )}
            </div>
        </div>
    )
}
