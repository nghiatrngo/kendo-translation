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

export default async function TranslateListPage() {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Get articles that need translation (no content_en or status !== 'published')
    const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching articles:', error)
    }

    // Split into needs translation and completed
    const needsTranslation = articles?.filter(a => !a.content_en || a.translation_status !== 'published') || []
    const completed = articles?.filter(a => a.content_en && a.translation_status === 'published') || []

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">🌐 Translation Queue</h1>
                    <p className="text-gray-600 mt-1">
                        Select an article to translate
                    </p>
                </div>
                {user ? (
                    <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        ✓ Logged in as {user.email}
                    </span>
                ) : (
                    <Link
                        href="/login?redirectTo=/translate"
                        className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100"
                    >
                        Login to translate →
                    </Link>
                )}
            </div>

            {/* Needs Translation Section */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📝 Needs Translation ({needsTranslation.length})
                </h2>

                {needsTranslation.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <p className="text-green-800">🎉 All articles translated!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {needsTranslation.map((article: Article) => (
                            <Link
                                key={article.id}
                                href={`/translate/${article.id}`}
                                className="block bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{article.title}</h3>
                                        {article.content_ja && (
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                                                {article.content_ja.substring(0, 100)}...
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {article.translation_status && (
                                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                {article.translation_status}
                                            </span>
                                        )}
                                        <span className="text-blue-600">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed Section */}
            {completed.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        ✅ Completed ({completed.length})
                    </h2>
                    <div className="grid gap-2">
                        {completed.map((article: Article) => (
                            <div
                                key={article.id}
                                className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">{article.title}</span>
                                    <Link
                                        href={`/articles/${article.id}`}
                                        className="text-sm text-gray-500 hover:text-blue-600"
                                    >
                                        View →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
