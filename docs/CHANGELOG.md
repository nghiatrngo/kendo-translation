# Changelog

All notable changes to Kendo Translation.

---

## [0.5.0] - 2025-01-12

### Added

- **MAC-RAG Translation Pipeline**: Context-aware translation with bilingual DB retrieval
- Agent Conversation Log viewer with per-article filtering
- `ContextBuilderPanel` with tabbed UI (Instructions | Retrieval)
- `useMacRag` React hook for pipeline state management
- Agent logging with `articleId`/`videoId` propagation
- `/api/translate/mac-rag` endpoint (phases: context, translate, score, full)
- `/api/context/retrieve` endpoint (bilingual matches + terminology)
- `/api/agent/logs` endpoint with dynamic stats

### Changed

- Renamed "Translation Memory" to "Bilingual DB Matches" throughout UI
- Simplified MAC-RAG page to single "Natural" translation output
- Updated documentation (API.md, ARCHITECTURE.md, DEVELOPER_GUIDE.md)

### Fixed

- Agent logs not appearing in UI (articleId propagation)
- Stats bar showing "Total: 0" (calculated from fetched logs)
- Async logging in serverless environment (await DB insert)

---

## [0.4.0] - 2024-12-30

### Added

- AI-powered translation suggestions
- JA-EN specialist features (honorifics, onomatopoeia, subject resolution)
- Quality score display
- Translation Memory search and panel
- Dashboard with stats

### Changed

- Updated documentation for accuracy

---

## [0.3.0] - 2024-12-30

### Added

- Real data import (634 articles)
- Terminology page (920+ terms)
- Video player with timestamped notes
- Import scripts for articles, terminology, TM

---

## [0.2.0] - 2024-12-30

### Added

- Supabase authentication
- Article CRUD endpoints
- Protected routes via middleware
- Translation editor component
- Theme toggle (light/dark)

---

## [0.1.0] - 2024-12-30

### Added

- Initial project skeleton
- All page routes (placeholder)
- Supabase database connection
- Render.com deployment

---

_Versioning follows [Semantic Versioning](https://semver.org/)_
