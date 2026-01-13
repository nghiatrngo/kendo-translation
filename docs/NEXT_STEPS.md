# Next Steps & Roadmap

**Date**: January 12, 2025  
**Status**: ✅ Phase 6 (MAC-RAG) Complete

---

## ✅ Completed (as of January 2025)

### Phase 1-4: Core Features (December 2024)

- ✅ User authentication with role-based access
- ✅ Article CRUD and translation editing
- ✅ Video player with timestamped notes
- ✅ Terminology search (920+ terms)
- ✅ Bookmarks for articles and videos
- ✅ Dark mode with proper contrast
- ✅ Role-based navigation (Admin/Translator/Reader)

### Phase 5: MAC-RAG Translation (January 2025)

- ✅ MAC-RAG pipeline with context-aware translation
- ✅ Bilingual database retrieval (renamed from TM)
- ✅ Agent conversation logging with article/video ID
- ✅ ContextBuilderPanel with tabbed UI
- ✅ useMacRag React hook for state management

---

## 📋 Test User Credentials

For development/testing:

| Email                 | Password   | Role       |
| --------------------- | ---------- | ---------- |
| admin-1@test.com      | !12345678! | admin      |
| translator-1@test.com | !12345678! | translator |
| reader-1@test.com     | !12345678! | reader     |

---

## 🎯 Suggested Next Steps

### Priority 1: Vector Embeddings for Retrieval

**Enhance bilingual matching with semantic similarity:**

```
Step 1: Generate embeddings for translation_memory entries
- Use OpenAI/Voyage embeddings
- Store in pgvector column

Step 2: Update /api/context/retrieve
- Query by embedding similarity
- Combine with text matching

Step 3: Test retrieval quality
- Compare with current text matching
- Measure relevance improvement
```

---

### Priority 2: Reading Progress Tracking

**Track user progress through articles:**

```
Step 1: Create reading_progress table
- user_id, article_id, progress_percent, last_read

Step 2: Add progress indicator to article detail
- Show "Continue reading" on article list
- Auto-save scroll position

Step 3: Dashboard integration
- Show "Recently read" section
```

---

### Priority 3: YouTube Transcript Integration

**Add transcript display and sync:**

```
Step 1: Fetch transcripts via YouTube API or yt-dlp
- Store in video_transcripts table
- Parse VTT/SRT format

Step 2: Display in VideoPlayer component
- Highlight current segment
- Click to seek

Step 3: Enable transcript search
- Search across all video transcripts
```

---

### Priority 4: Quality Scoring Enhancement

**Implement detailed quality assessment:**

```
Step 1: Extend MAC-RAG score phase
- Fluency, adequacy, terminology, style scores
- Issue detection and suggestions

Step 2: Quality routing
- Auto-flag low-quality translations
- Suggest review workflow

Step 3: Error tracking
- Integrate Sentry for production errors
```

---

## 📊 Current Project Status

| Component         | Status     | Notes                        |
| ----------------- | ---------- | ---------------------------- |
| Authentication    | ✅ Working | 3 roles with RLS             |
| Articles CRUD     | ✅ Working | 634 articles                 |
| Videos + Notes    | ✅ Working | E2E tested                   |
| Bookmarks         | ✅ Working | Articles + videos            |
| Terminology       | ✅ Working | 920+ terms                   |
| Dark Mode         | ✅ Working | All pages                    |
| MAC-RAG Pipeline  | ✅ Working | Context + translation + logs |
| Role-Based UI     | ✅ Working | Dynamic navigation           |
| Vector Embeddings | ⏳ Pending | Priority 1                   |
| Reading Progress  | ⏳ Pending | Priority 2                   |
| Video Transcripts | ⏳ Pending | Priority 3                   |

---

## 💡 Key Learnings

1. **RLS Policy Design**: Never query the same table within its RLS policy. Use `SECURITY DEFINER` functions.

2. **API Authentication**: Always use server-side API routes for authenticated operations, never client-side Supabase calls in components.

3. **user_id Injection**: For RLS-protected tables, always inject `user_id` from session in API routes.

4. **Agent Logging**: Propagate metadata (articleId, videoId) through entire call chain for proper log association.

5. **Stats Calculation**: Calculate stats from fetched data, not in-memory storage (important for serverless).

---

_Last Updated: January 12, 2025_
