export default function TerminologyPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">📖 Terminology</h1>
            <p className="text-gray-600 mb-8">
                Searchable database of 1000+ Kendo terms.
            </p>

            {/* Placeholder content */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-8">
                <p className="text-yellow-800 text-lg">
                    🚧 Coming in Iteration 3
                </p>
                <p className="text-yellow-600 mt-2">
                    Terminology database from kendo_terms.json.
                </p>
            </div>

            {/* Placeholder search */}
            <div className="mb-8">
                <input
                    type="text"
                    disabled
                    placeholder="🔍 Search terms..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400"
                />
            </div>

            {/* Placeholder term cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { jp: "面", en: "Men", reading: "めん" },
                    { jp: "小手", en: "Kote", reading: "こて" },
                    { jp: "胴", en: "Do", reading: "どう" },
                    { jp: "突き", en: "Tsuki", reading: "つき" },
                    { jp: "気剣体一致", en: "Ki-Ken-Tai-Ichi", reading: "きけんたいいっち" },
                    { jp: "残心", en: "Zanshin", reading: "ざんしん" },
                ].map((term, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">{term.jp}</div>
                        <div className="text-gray-500 text-sm mb-2">{term.reading}</div>
                        <div className="text-gray-700">{term.en}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
