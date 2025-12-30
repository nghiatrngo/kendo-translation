# Kendo Translation

A bilingual platform for translating and reading Kendo resources from Japanese to English.

[![Deploy to GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue)](https://nghiatrngo.github.io/kendo-translation)
[![API Status](https://img.shields.io/badge/API-Render.com-green)](https://kendo-translation-api.onrender.com)

## ✨ Features

### For Readers 📖
- Browse Kendo articles in Japanese and English (side-by-side)
- Watch Kendo videos with timestamped notes
- Search 1000+ Kendo terminology entries
- Track reading progress and bookmarks
- Multi-theme support (light/dark)

### For Translators 🌐
- AI-assisted translation with multi-agent system
- Quality review workflow with scoring
- Terminology and translation memory management
- Batch translation processing
- MLflow performance metrics

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/nghiatrngo/kendo-translation.git
cd kendo-translation

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     kendo-translation                        │
├──────────────┬──────────────────┬───────────────────────────┤
│ Reader View  │ Translator View  │      Shared Services      │
│  Articles    │  Translation UI  │   Supabase Auth + DB      │
│  Video Notes │  AI Suggestions  │   Translation Memory      │
└──────────────┴──────────────────┴───────────────────────────┘
         │                 │                    │
         └─────────────────┴────────────────────┘
                           ▼
              ┌────────────────────────┐
              │   Supabase PostgreSQL  │
              │   • Users & Profiles   │
              │   • Articles & Videos  │
              │   • Translations & TM  │
              └────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Next.js API Routes |
| Translation | Python MAC-RAG (multi-agent) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | GitHub Pages + Render.com |

## 📁 Project Structure

```
kendo-translation/
├── packages/
│   ├── web/                 # Next.js frontend
│   │   ├── src/app/         # Pages and API routes
│   │   └── src/components/  # React components
│   └── translation-engine/  # Python MAC-RAG service
├── supabase/
│   └── migrations/          # Database schema
├── scripts/                 # Import utilities
├── docs/                    # Documentation
└── README.md
```

## 📊 Data Sources

| Source | Content |
|--------|---------|
| Kendo Jidai | 315 matched EN/JP article pairs |
| Terminology | 1000+ Kendo terms |
| Translation Memory | 1,264 verified pairs |
| Onomatopoeia | Japanese sound words database |

## 🚀 Deployment

| Component | Platform | Status |
|-----------|----------|--------|
| Frontend | GitHub Pages | 🔵 Ready |
| API | Render.com | 🔵 Ready |
| Database | Supabase | 🔵 Ready |

**Live Demo**: [https://nghiatrngo.github.io/kendo-translation](https://nghiatrngo.github.io/kendo-translation)

## 📝 API Endpoints

### Public
```bash
GET  /api/articles          # List articles
GET  /api/articles/:id      # Article detail
GET  /api/terminology       # Search terms
```

### Authenticated
```bash
POST /api/notes             # Create note
GET  /api/bookmarks         # Get bookmarks
POST /api/translate/suggest # AI translation
```

## 📚 Documentation

- [Project Description](./docs/project_description.md)
- [Implementation Plan](./docs/implementation_plan.md)
- [API Reference](./docs/api_reference.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

*Built with ❤️ for the Kendo community*
