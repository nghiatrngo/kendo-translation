# AI Memory: MAC-RAG Integration

## Current Status

✅ Implementation Complete
✅ Verification Complete (Jan 2025)

## Files Created/Modified

- `app/translate/mac-rag/page.tsx` - Article queue for MAC-RAG
- `app/translate/mac-rag/[id]/page.tsx` - Single-phase translation page
- `components/translation/ContextBuilderPanel.tsx` - Tabbed context & retrieval
- `lib/hooks/useMacRag.ts` - React hook for pipeline
- `lib/llm/agent-logger.ts` - Logging with articleId/videoId
- Updated `RoleBasedNavigation.tsx` - Added 🔬 MAC-RAG nav link

## Current Workflow (Simplified)

1. **Context Building**: Special instructions, source text display
2. **Retrieval Results**: Bilingual DB Matches, Terminology (in tabs)
3. **Generate Translation**: Single "Natural" translation output
4. **Agent Logs**: Viewable per-article, persisted to DB

## Key Components

- `useMacRag` hook → `buildContext()`, `translate({ articleId })`, `score()`
- `ContextBuilderPanel` → Tabbed UI (Instructions | Retrieval)
- `AgentConversationLog` → Shows logs filtered by `articleId`

## Verified Features (Jan 2025)

- [x] Login as Translator
- [x] Navigation to MAC-RAG
- [x] Queue Page load
- [x] Context Building & Retrieval display
- [x] Translation Generation
- [x] Agent Logs visibility (with articleId propagation)
- [x] Bilingual DB Matches (renamed from TM)
- [x] Terminology display
