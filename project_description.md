# Kendo Translation Project

**Project Name**: kendo-translation  
**Repository**: https://github.com/nghiatrngo/kendo-translation  
**Status**: Planning Phase

---

## Vision

A unified web platform for translating and reading Kendo resources from Japanese to English. The platform serves two user roles with distinct experiences while sharing a centralized database.

---

## User Roles

### 📖 READER
- Browse and search translated Kendo content
- Read bilingual articles (Japanese/English side-by-side)
- Watch Kendo videos with timestamped notes
- Filter by content type (books, videos, articles)
- Bookmark and track reading progress

### 🌐 TRANSLATOR
- Access AI-assisted translation workflow
- Review and approve translations
- Manage terminology database
- Quality control with scoring metrics
- Batch translation processing

---

## Content Types

| Type | Source | Features |
|------|--------|----------|
| **Articles** | Kendo Jidai blog posts | Bilingual display, search, tags |
| **Videos** | YouTube (Kendo Jidai, etc.) | Timestamped notes, clips, bilingual subtitles |
| **Books** | Kendo instructional texts | Chapter navigation, glossary links |
| **Terminology** | Kendo glossary | 1000+ terms, pronunciation, examples |

---

## Core Features

### Translation Engine (from MAC-RAG)
- Multi-agent collaboration (Analysis → Retrieval → Translation → Reflection)
- JA→EN specialization (honorifics, onomatopoeia, subject resolution)
- Quality scoring with automated iteration
- Translation memory and terminology database

### Annotation Interface (from annotation_platform)
- Side-by-side Japanese/English view
- AI translation suggestions
- Quality rating system
- Data import (JSON, JSONL, TSV)

### Video Notes (from youtube_note)
- YouTube player integration
- Timestamped notes with clip playback
- Cloud sync across devices
- Note preview and export

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         kendo-translation                            │
├──────────────────┬────────────────────┬──────────────────────────────┤
│   READER VIEW    │  TRANSLATOR VIEW   │         SHARED             │
│  ─────────────   │  ────────────────  │   ──────────────────       │
│  • Article List  │  • Translation UI  │   • User Auth              │
│  • Video Player  │  • AI Suggestions  │   • Supabase DB            │
│  • Search/Filter │  • Quality Review  │   • Translation Memory     │
│  • Bookmarks     │  • Term Management │   • Terminology DB         │
└──────────────────┴────────────────────┴──────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Backend Services                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Next.js   │  │   Python    │  │   Express   │                 │
│  │     API     │  │  MAC-RAG    │  │  Video API  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│        │                │                │                          │
│        ▼                ▼                ▼                          │
│  ┌──────────────────────────────────────────────────┐              │
│  │           Supabase (PostgreSQL)                   │              │
│  │  • users, articles, videos, translations          │              │
│  │  • terminology, translation_memory                │              │
│  │  • notes, bookmarks, reading_progress             │              │
│  └──────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Source |
|-------|------------|--------|
| **Frontend** | Next.js 14 + Tailwind CSS | annotation_platform |
| **Backend API** | Next.js API Routes + Express | Combined |
| **Translation Engine** | Python (MAC-RAG agents) | MAC-RAG |
| **Database** | Supabase (PostgreSQL) | youtube_note pattern |
| **Vector Search** | Supabase pg_vector or ChromaDB | MAC-RAG |
| **Authentication** | Supabase Auth | youtube_note pattern |
| **Hosting** | GitHub Pages + Render | youtube_note pattern |

---

## Data Sources

### From mARTr Project
- **Kendo Jidai Articles**: 550 English + 399 Japanese (315 matched pairs)
- **Terminology Database**: 1000+ Kendo terms
- **Onomatopoeia Database**: Japanese sound words with English renderings
- **Translation Memory**: 1,264 verified translation pairs

### From youtube_note
- **User Authentication**: JWT-based auth system
- **Note Storage**: Timestamped video notes
- **Deployment Pattern**: GitHub Pages + Render + Supabase

---

## Deployment Strategy

Following youtube_note's proven architecture:

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | GitHub Pages | https://nghiatrngo.github.io/kendo-translation |
| API Server | Render.com | https://kendo-translation-api.onrender.com |
| Database | Supabase | PostgreSQL with Realtime |

---

## Project Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project repository
- [ ] Configure Supabase database
- [ ] Create unified database schema
- [ ] Set up Next.js frontend

### Phase 2: Reader Experience (Week 3-4)
- [ ] Article listing and search
- [ ] Bilingual article display
- [ ] Video player with notes
- [ ] User authentication

### Phase 3: Translator Experience (Week 5-6)
- [ ] Translation annotation interface
- [ ] AI suggestion integration
- [ ] Quality review workflow
- [ ] Terminology management

### Phase 4: Integration (Week 7-8)
- [ ] MAC-RAG Python backend integration
- [ ] Translation memory sync
- [ ] Batch processing
- [ ] Performance optimization

### Phase 5: Polish & Deploy (Week 9-10)
- [ ] UI polish and mobile responsiveness
- [ ] Deploy to production
- [ ] Data migration from existing projects
- [ ] Documentation

---

## Related Projects

| Project | Purpose | Location |
|---------|---------|----------|
| annotation_platform | Translation annotation UI | mARTr/annotation_platform |
| MAC-RAG | Multi-agent translation engine | mARTr/MAC-RAG |
| youtube_note | Video note-taking | youtube_note |
| data_crawler | Kendo Jidai scraper | mARTr/data_crawler |

---

*Last updated: December 30, 2024*