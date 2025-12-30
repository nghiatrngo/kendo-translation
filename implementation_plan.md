# Kendo Translation - Implementation Plan (Breadth-First)

**Approach**: Breadth-First Software Development  
**Philosophy**: Build a basic but functional version across ALL layers first, then iteratively add depth.  
**Last Updated**: December 30, 2024

---

## Breadth-First Principle

```
Traditional (Depth-First)          Breadth-First
├── Phase 1: Complete DB           ├── Iteration 1: Basic skeleton everywhere
├── Phase 2: Complete API          ├── Iteration 2: Core flows working
├── Phase 3: Complete UI           ├── Iteration 3: Real data integration
└── Phase 4: Deploy                ├── Iteration 4: Polish + edge cases
                                   └── Iteration 5: Production ready

Goal: Working prototype as early as possible, then refine.
```

---

## Iteration 1: Skeleton (Day 1-2)

**Goal**: App runs, all pages exist with placeholder content, database connected.

### All Layers in Parallel

| Layer | Task | Time |
|-------|------|------|
| **Repo** | Initialize monorepo, git, .gitignore, README | 30m |
| **Frontend** | `npx create-next-app packages/web` | 15m |
| **Database** | Create Supabase project, run initial migration | 30m |
| **Deploy** | GitHub repo, Render service, env vars | 30m |

### Frontend Skeleton (2h)
```
packages/web/src/app/
├── page.tsx              → "Welcome to Kendo Translation" hero
├── articles/page.tsx     → "Articles (coming soon)" placeholder
├── videos/page.tsx       → "Videos (coming soon)" placeholder  
├── translate/page.tsx    → "Translator (coming soon)" placeholder
├── login/page.tsx        → Login form (non-functional skeleton)
└── layout.tsx            → Header with nav links
```

**Acceptance Criteria**:
- [ ] `npm run dev` works
- [ ] All routes render (even if just placeholders)
- [ ] Deployed to GitHub Pages (static export)
- [ ] Deployed to Render (API)

### Database Skeleton (1h)
```sql
-- Minimal schema to prove connection
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria**:
- [ ] Supabase project created
- [ ] Tables exist
- [ ] Can read from Next.js API route

---

## Iteration 2: Core Flows (Day 3-5)

**Goal**: Basic auth works, can CRUD articles, one translation works end-to-end.

### Auth Flow (4h)
| Task | Details |
|------|---------|
| Login page | Email/password form |
| Supabase Auth | Use `@supabase/ssr` for Next.js |
| Protected routes | Middleware for `/translate/*` |
| User context | React context for auth state |

### Article Flow (4h)
| Task | Details |
|------|---------|
| `/articles` | Fetch and display list (title only) |
| `/articles/[id]` | Display single article |
| Add article | Admin-only form |
| Database | Full `articles` table schema |

### Translation Flow (4h)
| Task | Details |
|------|---------|
| `/translate` | Queue of articles without translations |
| TranslationEditor | Source text + target text textarea |
| Save translation | Store in `articles.content_en` |
| No AI yet | Manual translation only |

**Acceptance Criteria**:
- [ ] Can log in / log out
- [ ] Can view articles list
- [ ] Can open article and see Japanese text
- [ ] Can save English translation

---

## Iteration 3: Real Data (Day 6-8)

**Goal**: Import real Kendo Jidai data, video player works, terminology lookup exists.

### Data Import (4h)
| Task | Details |
|------|---------|
| Import script | `scripts/import-articles.ts` |
| Parse crawler data | From `mARTr/data_crawler/kendo_jidai/` |
| 315 article pairs | Import matched JP/EN articles |
| Terminology | Import `kendo_terms.json` (1000+ terms) |

### Articles Enhancement (3h)
| Task | Details |
|------|---------|
| Bilingual view | Side-by-side JP/EN display |
| Tag filtering | Filter by domain (technique, philosophy) |
| Search | Full-text search on title |

### Video Player (4h)
| Task | Details |
|------|---------|
| `/videos` | Video list from Supabase |
| `/videos/[id]` | YouTube IFrame player |
| Notes | Timestamped note input (adapt from youtube_note) |
| Save notes | Store in `video_notes` table |

### Terminology (2h)
| Task | Details |
|------|---------|
| `/terminology` | Searchable term list |
| Term card | Source → Target with reading |
| Quick lookup | In-translation-editor hover |

**Acceptance Criteria**:
- [ ] 315 articles visible in `/articles`
- [ ] Can search and filter articles
- [ ] YouTube video plays in `/videos/[id]`
- [ ] Can create timestamped notes
- [ ] Terminology search works

---

## Iteration 4: AI Translation (Day 9-12)

**Goal**: AI suggestions work, JA-EN specialist features active, quality scoring.

### LLM Integration (4h)
| Task | Details |
|------|---------|
| Port `provider.ts` | OpenAI/OpenRouter abstraction |
| Environment config | Per-agent model selection |
| API route | `POST /api/translate/suggest` |

### AI Suggestion UI (4h)
| Task | Details |
|------|---------|
| "Get AI Suggestion" button | In TranslationEditor |
| Loading state | Streaming or wait |
| Accept/Reject | One-click accept |
| Show confidence | Display score |

### JA-EN Features (6h)
| Task | Details |
|------|---------|
| Subject resolution | Identify omitted subjects |
| Honorific handling | 先生 → "-sensei" toggle |
| Onomatopoeia | ニコニコ → "smiling brightly" |
| Enhanced prompt | Include JA-EN context |

### Quality Scoring (4h)
| Task | Details |
|------|---------|
| Reflection agent | Score 0-1 |
| Improvement suggestions | List of fixes |
| Re-translate | Apply feedback button |
| Store scores | `articles.quality_score` |

**Acceptance Criteria**:
- [ ] Click "Get AI Suggestion" → translation appears
- [ ] JA-EN features visible (subjects, honorifics)
- [ ] Quality score displayed
- [ ] Can iterate on translation

---

## Iteration 5: Translation Memory (Day 13-15)

**Goal**: RAG retrieval works, TM suggestions, terminology enforcement.

### Translation Memory (6h)
| Task | Details |
|------|---------|
| Import TM | 1,264 entries from MAC-RAG |
| Vector embeddings | Supabase pg_vector or separate |
| Similarity search | Find similar past translations |
| TM panel | Show matches in editor |

### Terminology Enforcement (4h)
| Task | Details |
|------|---------|
| Term detection | Highlight terms in source |
| Required terms | Flag if not used in target |
| Auto-insert | One-click term insertion |

### Retrieval Agent (4h)
| Task | Details |
|------|---------|
| Port from MAC-RAG | Terminology + TM retrieval |
| Context injection | Add to AI prompt |
| Attribution | Show what was retrieved |

**Acceptance Criteria**:
- [ ] Similar translations shown in editor
- [ ] Terms highlighted in source
- [ ] AI uses terminology correctly
- [ ] Can see retrieval sources

---

## Iteration 6: User Experience (Day 16-18)

**Goal**: Reader experience polished, progress tracking, bookmarks.

### Reader Experience (6h)
| Task | Details |
|------|---------|
| Reading progress | Track position in article |
| Bookmarks | Save articles/videos |
| Theme toggle | Light/dark mode |
| Mobile responsive | Test on phone |

### Translator Experience (4h)
| Task | Details |
|------|---------|
| Translation queue | Sorted by priority |
| Batch selection | Select multiple |
| Stats dashboard | Translations per day |
| Keyboard shortcuts | Save, next, previous |

### Search & Filter (3h)
| Task | Details |
|------|---------|
| Global search | Search across articles, videos, terms |
| Advanced filters | Date, domain, status |
| Sort options | Recent, popular, quality |

**Acceptance Criteria**:
- [ ] Reading progress persists
- [ ] Bookmarks work
- [ ] Dark mode works
- [ ] Mobile layout good

---

## Iteration 7: Production (Day 19-21)

**Goal**: Production-ready, monitoring, documentation.

### Performance (4h)
| Task | Details |
|------|---------|
| Static export | Next.js `output: 'export'` |
| Image optimization | Next/Image |
| Lazy loading | Dynamic imports |
| Lighthouse | Score > 90 |

### Monitoring (3h)
| Task | Details |
|------|---------|
| Error tracking | Sentry or similar |
| Analytics | Simple page views |
| API logging | Request/response |

### Documentation (4h)
| Task | Details |
|------|---------|
| README | Quick start, features |
| API docs | All endpoints |
| Deployment guide | Step-by-step |

### Launch (2h)
| Task | Details |
|------|---------|
| Final deploy | Production env vars |
| DNS | Custom domain (optional) |
| Announce | Share with community |

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Lighthouse > 90
- [ ] Error tracking active
- [ ] Documentation complete

---

## Iteration Summary

| Iteration | Duration | Output |
|-----------|----------|--------|
| 1. Skeleton | Day 1-2 | App runs, all routes exist |
| 2. Core Flows | Day 3-5 | Auth + CRUD + basic translation |
| 3. Real Data | Day 6-8 | 315 articles + videos + terminology |
| 4. AI Translation | Day 9-12 | AI suggestions + JA-EN features |
| 5. Translation Memory | Day 13-15 | RAG + TM + terminology enforcement |
| 6. User Experience | Day 16-18 | Polish + progress + bookmarks |
| 7. Production | Day 19-21 | Deploy + monitor + document |

**Total**: 21 days (3 weeks)

---

## Database Schema (Progressive)

### Iteration 1-2: Minimal
```sql
CREATE TABLE users (id, email, created_at);
CREATE TABLE articles (id, title, created_at);
```

### Iteration 3: Articles + Videos
```sql
ALTER TABLE articles ADD COLUMN content_ja TEXT;
ALTER TABLE articles ADD COLUMN content_en TEXT;
ALTER TABLE articles ADD COLUMN source_url TEXT;
ALTER TABLE articles ADD COLUMN tags TEXT[];

CREATE TABLE videos (id, youtube_id, title);
CREATE TABLE video_notes (id, video_id, user_id, start_time, end_time, text);
```

### Iteration 4: Translation Metadata
```sql
ALTER TABLE articles ADD COLUMN translation_status TEXT;
ALTER TABLE articles ADD COLUMN quality_score FLOAT;
ALTER TABLE articles ADD COLUMN translator_id UUID;
ALTER TABLE articles ADD COLUMN ai_suggestion TEXT;
```

### Iteration 5: TM + Terminology
```sql
CREATE TABLE terminology (id, source_term, target_term, reading, domain);
CREATE TABLE translation_memory (id, source_text, target_text, quality, domain);
```

### Iteration 6: User Tracking
```sql
CREATE TABLE reading_progress (user_id, content_type, content_id, progress);
CREATE TABLE bookmarks (user_id, content_type, content_id);
```

---

## File Structure (Progressive)

### Iteration 1
```
kendo-translation/
├── packages/web/
│   ├── src/app/
│   │   ├── page.tsx
│   │   ├── articles/page.tsx
│   │   ├── videos/page.tsx
│   │   └── layout.tsx
│   └── package.json
└── README.md
```

### Iteration 3
```
kendo-translation/
├── packages/web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── videos/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── translate/page.tsx
│   │   │   └── api/
│   │   │       ├── articles/route.ts
│   │   │       └── videos/route.ts
│   │   └── lib/
│   │       └── supabase.ts
│   └── package.json
├── scripts/
│   └── import-articles.ts
└── supabase/
    └── migrations/001_initial.sql
```

### Iteration 7 (Final)
```
kendo-translation/
├── packages/
│   ├── web/                    # Next.js frontend
│   └── translation-engine/     # Python MAC-RAG (optional)
├── supabase/
│   └── migrations/
├── scripts/
├── docs/
│   ├── project_description.md
│   ├── implementation_plan.md
│   ├── reference_docs.md
│   └── api_reference.md
├── .github/
│   └── workflows/deploy.yml
└── README.md
```

---

## Success Metrics per Iteration

| Iteration | Key Metric | Target |
|-----------|------------|--------|
| 1 | App loads | Yes/No |
| 2 | Can complete login → translate → save | Yes/No |
| 3 | Articles count | 315 |
| 4 | AI response time | < 5s |
| 5 | TM matches found | > 0 for most texts |
| 6 | Mobile usability | All features work |
| 7 | Lighthouse score | > 90 |

---

*Implementation plan revised: December 30, 2024*  
*Approach: Breadth-First Software Development*
