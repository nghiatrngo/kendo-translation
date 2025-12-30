export default function ArticlesPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">📚 Articles</h1>
            <p className="text-gray-600 mb-8">
                Browse and read bilingual Kendo articles from Kendo Jidai.
            </p>

            {/* Placeholder content */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 text-lg">
                    🚧 Coming in Iteration 3
                </p>
                <p className="text-yellow-600 mt-2">
                    315 articles will be imported from Kendo Jidai data.
                </p>
            </div>

            {/* Placeholder article list */}
            <div className="mt-8 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
