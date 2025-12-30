import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Stat Card Component
function StatCard({
    icon,
    label,
    value,
    color
}: {
    icon: string;
    label: string;
    value: number;
    color: 'blue' | 'yellow' | 'green' | 'red' | 'purple'
}) {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
        green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
        red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    };

    return (
        <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} border`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-2xl font-bold text-white">{value.toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    );
}

// Mode Card Component
function ModeCard({
    href,
    title,
    description,
    icon,
    color,
    count,
    countLabel,
}: {
    href: string;
    title: string;
    description: string;
    icon: string;
    color: 'blue' | 'red' | 'green' | 'purple';
    count: number;
    countLabel: string;
}) {
    const colors = {
        blue: 'hover:border-blue-500/50',
        red: 'hover:border-red-500/50',
        green: 'hover:border-green-500/50',
        purple: 'hover:border-purple-500/50',
    };

    return (
        <Link
            href={href}
            className={`block p-6 rounded-2xl bg-slate-800/50 border border-slate-700 transition-all ${colors[color]} group`}
        >
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-inherit transition-colors">
                {title}
            </h3>
            <p className="text-slate-400 text-sm mb-4">{description}</p>
            <div className="text-sm text-slate-500">
                {count.toLocaleString()} {countLabel}
            </div>
        </Link>
    );
}

async function getStats() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return { articles: 0, terminology: 0, tm: 0, bookmarks: 0 };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const [articles, terminology, tm, bookmarks] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('terminology').select('*', { count: 'exact', head: true }),
        supabase.from('translation_memory').select('*', { count: 'exact', head: true }),
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
    ]);

    return {
        articles: articles.count || 0,
        terminology: terminology.count || 0,
        tm: tm.count || 0,
        bookmarks: bookmarks.count || 0,
    };
}

export default async function DashboardPage() {
    const stats = await getStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Kendo Translation
                        <span className="text-blue-400"> Dashboard</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        AI-powered Japanese-English translation with Translation Memory
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <StatCard
                        icon="📄"
                        label="Articles"
                        value={stats.articles}
                        color="blue"
                    />
                    <StatCard
                        icon="📚"
                        label="TM Entries"
                        value={stats.tm}
                        color="green"
                    />
                    <StatCard
                        icon="📖"
                        label="Terminology"
                        value={stats.terminology}
                        color="yellow"
                    />
                    <StatCard
                        icon="🔖"
                        label="Bookmarks"
                        value={stats.bookmarks}
                        color="purple"
                    />
                </div>

                {/* Mode Cards */}
                <h2 className="text-2xl font-semibold text-white mb-6">
                    Translation Modes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <ModeCard
                        href="/articles"
                        title="Article Browser"
                        description="Browse and translate Kendo Jidai articles with AI assistance"
                        icon="📰"
                        color="blue"
                        count={stats.articles}
                        countLabel="articles"
                    />
                    <ModeCard
                        href="/translate"
                        title="Translation Editor"
                        description="Side-by-side translation with TM lookup and AI suggestions"
                        icon="✏️"
                        color="green"
                        count={stats.tm}
                        countLabel="TM entries"
                    />
                    <ModeCard
                        href="/terminology"
                        title="Terminology"
                        description="Browse and search Kendo terminology database"
                        icon="📖"
                        color="purple"
                        count={stats.terminology}
                        countLabel="terms"
                    />
                </div>

                {/* Quick Actions */}
                <h2 className="text-2xl font-semibold text-white mb-6">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        href="/videos"
                        className="flex items-center gap-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-red-500/50 transition-colors group"
                    >
                        <div className="p-3 bg-red-500/20 rounded-lg text-3xl">
                            🎬
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                                Video Notes
                            </h3>
                            <p className="text-slate-400 text-sm">
                                Watch and annotate YouTube videos
                            </p>
                        </div>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors group"
                    >
                        <div className="p-3 bg-amber-500/20 rounded-lg text-3xl">
                            🏠
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                                Home
                            </h3>
                            <p className="text-slate-400 text-sm">
                                Return to main landing page
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-500 text-sm">
                    Kendo Translation Platform • Built with Next.js + Supabase
                </div>
            </div>
        </div>
    );
}
