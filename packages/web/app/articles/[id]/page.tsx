import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookmarkButton } from '@/components/BookmarkButton'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ArticleDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Get current user and their role
    const { data: { user } } = await supabase.auth.getUser()
    let userRole: string = 'reader'

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        userRole = profile?.role || 'reader'
    }

    // Check if user can translate (admin or translator)
    const canTranslate = user && (userRole === 'admin' || userRole === 'translator')

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
            <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                <Link href="/articles" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Articles
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 dark:text-white">{article.title}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{article.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Created: {new Date(article.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    {article.translation_status && (
                        <span className={`px-3 py-1 text-sm rounded-full ${article.translation_status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : article.translation_status === 'review'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                            {article.translation_status}
                        </span>
                    )}
                    <BookmarkButton contentType="article" contentId={article.id} />
                    {canTranslate && (
                        <Link
                            href={`/translate/${article.id}`}
                            className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Translate
                        </Link>
                    )}
                </div>
            </div>

            {/* Reader View - Side-by-side content */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Japanese */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Japanese (原文)
                    </h2>
                    <div className="prose dark:prose-invert max-w-none">
                        {article.content_ja ? (
                            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                                {article.content_ja}
                            </div>
                        ) : (
                            <p className="text-gray-400 dark:text-gray-500 italic">
                                No Japanese content available
                            </p>
                        )}
                    </div>
                </div>

                {/* English */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        English (翻訳)
                    </h2>
                    <div className="prose dark:prose-invert max-w-none">
                        {article.content_en ? (
                            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                                {article.content_en}
                            </div>
                        ) : (
                            <div className="text-gray-400 dark:text-gray-500 italic">
                                <p>Not yet translated</p>
                                {canTranslate ? (
                                    <Link
                                        href={`/translate/${article.id}`}
                                        className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                                    >
                                        Start translating →
                                    </Link>
                                ) : (
                                    <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">
                                        Translation pending
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span>Japanese: {article.content_ja?.length || 0} chars</span>
                <span>English: {article.content_en?.length || 0} chars</span>
                {article.quality_score !== undefined && article.quality_score !== null && (
                    <span>Quality: {(article.quality_score * 100).toFixed(0)}%</span>
                )}
            </div>
        </div>
    )
}
