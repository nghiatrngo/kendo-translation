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
│  │  - /videos   │   │  - context   │   │  - translation_memory    ││
│  │  - /translate│   │  - agent     │   │  - agent_logs            ││
│  │  - /dashboard│   │  - tm        │   │  - agent_prompts         ││
│  │  - /mac-rag  │   │              │   │  - videos, video_notes   ││
│  └──────────────┘   └──────────────┘   │  - bookmarks, profiles   ││
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

| Route                     | Page                            | Description                    |
| ------------------------- | ------------------------------- | ------------------------------ |
| `/`                       | page.tsx                        | Landing page                   |
| `/dashboard`              | dashboard/page.tsx              | Stats dashboard with StatCards |
| `/articles`               | articles/page.tsx               | Article list                   |
| `/articles/[id]`          | articles/[id]/page.tsx          | Article detail (reader mode)   |
| `/videos`                 | videos/page.tsx                 | Video list                     |
| `/videos/[id]`            | videos/[id]/page.tsx            | Video player with notes        |
| `/translate`              | translate/page.tsx              | Article selection (basic)      |
| `/translate/[id]`         | translate/[id]/page.tsx         | Translation editor             |
| `/translate/mac-rag`      | translate/mac-rag/page.tsx      | MAC-RAG article queue          |
| `/translate/mac-rag/[id]` | translate/mac-rag/[id]/page.tsx | MAC-RAG translation page       |
| `/terminology`            | terminology/page.tsx            | Term search                    |
| `/bookmarks`              | bookmarks/page.tsx              | User bookmarks                 |
| `/admin`                  | admin/page.tsx                  | Admin panel (admin only)       |
| `/login`                  | login/page.tsx                  | Authentication                 |

## API Endpoints

| Endpoint                       | Method            | Description                |
| ------------------------------ | ----------------- | -------------------------- |
| `/api/articles`                | GET, POST         | List/create articles       |
| `/api/articles/[id]`           | GET, PUT          | Get/update article         |
| `/api/articles/[id]/translate` | PUT               | Save translation           |
| `/api/translate/suggest`       | POST              | AI translation (basic)     |
| `/api/translate/mac-rag`       | POST              | MAC-RAG pipeline           |
| `/api/context/retrieve`        | POST              | Bilingual DB + terminology |
| `/api/agent/logs`              | GET, POST, DELETE | Agent conversation logs    |
| `/api/tm/search`               | POST              | TM similarity search       |
| `/api/auth/me`                 | GET               | Current user + profile     |
| `/api/auth/logout`             | POST              | Logout                     |

## Components

| Component            | Location                | Purpose                          |
| -------------------- | ----------------------- | -------------------------------- |
| TranslationEditor    | components/             | Basic translation UI             |
| ContextBuilderPanel  | components/translation/ | MAC-RAG context + retrieval tabs |
| AgentConversationLog | components/             | Agent log viewer                 |
| VideoPlayer          | components/             | YouTube player with notes        |
| ThemeProvider        | components/             | Dark/light mode context          |
| RoleBasedNavigation  | components/             | Dynamic nav based on role        |
| AuthHeader           | components/             | Login/logout + user info         |
| BookmarkButton       | components/             | Reusable bookmark toggle         |
| ErrorBoundary        | components/             | Error handling wrapper           |

## Database Schema

```sql
-- Core Tables
articles (id, title, content_ja, content_en, source_url_*, translation_status)
terminology (id, term_ja, term_en, reading, domain, notes)
translation_memory (id, source_text, target_text, quality, embedding)
videos (id, youtube_url, title, notes)
video_notes (id, video_id, user_id, content, start_time, end_time)

-- User Tables
profiles (id, user_id, role, display_name)
bookmarks (id, user_id, content_type, content_id)

-- Agent Tables
agent_logs (id, user_id, article_id, video_id, agent_type, model, system_prompt,
            user_prompt, response, prompt_tokens, completion_tokens, duration_ms)
agent_prompts (id, agent_type, name, prompt_template, is_default)
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL + pgvector
- **LLM**: OpenRouter (Llama 3.3 70B)
- **Hosting**: Render.com

## Key Lib Utilities

| Directory          | Contents                            |
| ------------------ | ----------------------------------- |
| `lib/llm/`         | Provider (OpenRouter), agent-logger |
| `lib/agents/`      | JA-EN specialist, prompts service   |
| `lib/translation/` | multi-gen.ts (candidate generation) |
| `lib/context/`     | context-builder.ts                  |
| `lib/retrieval/`   | tm-search.ts, terminology.ts        |
| `lib/hooks/`       | useMacRag.ts (React hook)           |
| `lib/supabase/`    | Client (server/browser), middleware |

---

_Last Updated: January 12, 2025_
