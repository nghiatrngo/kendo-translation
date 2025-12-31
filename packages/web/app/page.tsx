export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Kendo Translation
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Translate and read Kendo resources from Japanese to English.
            AI-powered translation with Kendo terminology expertise.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/articles"
              className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Browse Articles
            </a>
            <a
              href="/translate"
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition border border-blue-500"
            >
              Start Translating
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            emoji="📚"
            title="Articles"
            description="Browse 315+ bilingual Kendo articles from Kendo Jidai"
          />
          <FeatureCard
            emoji="🎬"
            title="Videos"
            description="Watch Kendo videos with timestamped notes and translations"
          />
          <FeatureCard
            emoji="🤖"
            title="AI Translation"
            description="JA→EN specialist AI with Kendo terminology expertise"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-100 dark:bg-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number="315+" label="Articles" />
            <StatCard number="1000+" label="Terms" />
            <StatCard number="1264" label="Translation Memory" />
            <StatCard number="∞" label="Possibilities" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 Kendo Translation. Breadth-First Development.</p>
          <p className="text-sm mt-2">
            Iteration 1: Project Skeleton ✅
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-blue-600">{number}</div>
      <div className="text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
}
