import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TranslationEditor from '@/components/TranslationEditor'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function TranslateArticlePage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect(`/login?redirectTo=/translate/${id}`)
    }

    // Fetch article
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
                <Link href="/translate" className="hover:text-blue-600">
                    Translation Queue
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{article.title}</span>
            </nav>

            {/* User info */}
            <div className="mb-4 text-sm text-gray-500">
                Translating as: <span className="text-gray-700">{user.email}</span>
            </div>

            {/* Translation Editor */}
            <TranslationEditor article={article} />

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
                <Link
                    href="/translate"
                    className="text-gray-600 hover:text-blue-600"
                >
                    ← Back to queue
                </Link>
                <Link
                    href={`/articles/${article.id}`}
                    className="text-gray-600 hover:text-blue-600"
                >
                    View article →
                </Link>
            </div>
        </div>
    )
}
