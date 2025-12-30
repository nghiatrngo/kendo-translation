import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Article {
    id: string
    title: string
    content_ja?: string
    content_en?: string
    translation_status?: string
    created_at: string
}

export default async function ArticlesPage() {
    const supabase = await createClient()

    const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching articles:', error)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">📚 Articles</h1>
                    <p className="text-gray-600 mt-1">
                        Browse and read bilingual Kendo articles
                    </p>
                </div>
                <span className="text-sm text-gray-500">
                    {articles?.length || 0} articles
                </span>
            </div>

            {!articles || articles.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 text-lg">
                        📭 No articles yet
                    </p>
                    <p className="text-yellow-600 mt-2">
                        Articles will be imported in Iteration 3
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {articles.map((article: Article) => (
                        <Link
                            key={article.id}
                            href={`/articles/${article.id}`}
                            className="block bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                                        {article.title}
                                    </h2>
                                    {article.content_ja && (
                                        <p className="text-gray-600 mt-1 line-clamp-2 text-sm">
                                            {article.content_ja.substring(0, 150)}...
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-4">
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
                                    <span className="text-xs text-gray-400">
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                {article.content_ja && <span>🇯🇵 Japanese</span>}
                                {article.content_en && <span>🇬🇧 English</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
