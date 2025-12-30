export default function VideosPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">🎬 Videos</h1>
            <p className="text-gray-600 mb-8">
                Watch Kendo videos with timestamped notes and translations.
            </p>

            {/* Placeholder content */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 text-lg">
                    🚧 Coming in Iteration 3
                </p>
                <p className="text-yellow-600 mt-2">
                    YouTube video player with timestamped notes (adapted from youtube_note).
                </p>
            </div>

            {/* Placeholder video grid */}
            <div className="mt-8 grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-200 h-40 flex items-center justify-center">
                            <span className="text-4xl">▶️</span>
                        </div>
                        <div className="p-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
