# Kendo Translation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KENDO TRANSLATION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐│
│  │   FRONTEND   │   │  API LAYER   │   │      DATA LAYER          ││
│  │   (Next.js)  │◄──┤ (API Routes) │◄──┤   (Supabase + pgvector)  ││
│  └──────────────┘   └──────────────┘   └──────────────────────────┘│
│         │                  │                      │                 │
│         ▼                  ▼                      ▼                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐│
│  │    Pages     │   │  /api/       │   │  Tables:                 ││
│  │  - /         │   │  - articles  │   │  - articles (634)        ││
│  │  - /articles │   │  - translate │   │  - terminology (920)     ││
│  │  - /videos   │   │  - tm/search │   │  - translation_memory    ││
│  │  - /translate│   │              │   │    (1,264)               ││
│  │  - /dashboard│   │              │   │  - bookmarks             ││
│  └──────────────┘   └──────────────┘   │  - reading_progress      ││
│                                        └──────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   EXTERNAL SERVICES  │
                    ├──────────────────────┤
                    │ • OpenRouter (LLM)   │
                    │ • Supabase Auth      │
                    │ • pgvector (embeddings)
                    └──────────────────────┘
```

## Routes and Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | page.tsx | Landing page |
| `/dashboard` | dashboard/page.tsx | Stats dashboard with StatCards |
| `/articles` | articles/page.tsx | Article list |
| `/articles/[id]` | articles/[id]/page.tsx | Article detail |
| `/videos` | videos/page.tsx | Video list |
| `/videos/[id]` | videos/[id]/page.tsx | Video player with notes |
| `/translate` | translate/page.tsx | Article selection |
| `/translate/[id]` | translate/[id]/page.tsx | Translation editor |
| `/terminology` | terminology/page.tsx | Term search |
| `/login` | login/page.tsx | Authentication |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/articles` | GET | List articles |
| `/api/articles/[id]` | GET | Get article |
| `/api/articles/[id]/translate` | PUT | Save translation |
| `/api/translate/suggest` | POST | AI translation |
| `/api/tm/search` | POST | TM similarity search |

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| TranslationEditor | components/ | Side-by-side translation UI |
| ThemeProvider | components/ | Dark/light mode context |
| ErrorBoundary | components/ | Error handling wrapper |

## Database Schema

```sql
-- Core Tables
articles (id, title, content_ja, content_en, source_url_*, translation_status)
terminology (id, term_ja, term_en, reading, domain, notes)
translation_memory (id, source_text, target_text, quality, embedding)

-- User Tables
bookmarks (id, user_id, content_type, content_id)
reading_progress (id, user_id, content_type, content_id, progress_pct)
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL + pgvector
- **LLM**: OpenRouter (Llama 3.3 70B)
- **Hosting**: Render.com
