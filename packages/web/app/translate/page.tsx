export default function TranslatePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">🌐 Translate</h1>
            <p className="text-gray-600 mb-8">
                AI-powered translation with Kendo terminology expertise.
            </p>

            {/* Placeholder content */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-8">
                <p className="text-yellow-800 text-lg">
                    🚧 Coming in Iteration 2
                </p>
                <p className="text-yellow-600 mt-2">
                    Translation editor with AI suggestions (Iteration 4).
                </p>
            </div>

            {/* Placeholder translation editor */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Japanese (Source)
                    </label>
                    <div className="h-48 bg-gray-50 rounded border border-gray-200 p-3">
                        <p className="text-gray-400">
                            日本語のテキストがここに表示されます...
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        English (Target)
                    </label>
                    <div className="h-48 bg-gray-50 rounded border border-gray-200 p-3">
                        <p className="text-gray-400">
                            English translation will appear here...
                        </p>
                    </div>
                </div>
            </div>

            {/* Placeholder buttons */}
            <div className="mt-4 flex gap-4 justify-center">
                <button
                    disabled
                    className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed"
                >
                    🤖 Get AI Suggestion
                </button>
                <button
                    disabled
                    className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed"
                >
                    💾 Save Translation
                </button>
            </div>
        </div>
    );
}
