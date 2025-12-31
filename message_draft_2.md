# TODO:

[] ROLE SPECIFIC VIEW


- TRANSLATOR VIEW:
- ADMIN VIEW:
    + TRANSLATOR VIEW with and additional ADMIN TABS
- READER VIEW:
    - TRANSLATOR VIEW BUT without on TRANSLATION TAB
    - READ ONLY, NO MODIFICATION

- Test each user role, follow this process:
    - login as user
    - navigate to each page
    - perform all actions
    - logout
    - update debug_process for any issue


---

## User Query for TODO: Implement Role-Specific Views

```
Follow @kendo-translation/development_guideline.md : Implement Role-Specific Views

Step 0: Preparation & Analysis
- Read @kendo-translation/development_guideline.md (full file, especially § Core Principles)
- Read @kendo-translation/project_description.md (§ User Roles)
- Read @kendo-translation/docs/debug_progress.md (Phase 4 - Testing Results)
- Read @kendo-translation/docs/NEXT_STEPS.md (Priority 1: Role-Based UI Features)
- Read @kendo-translation/packages/web/components/AuthHeader.tsx (current auth implementation)
- Read @kendo-translation/packages/web/middleware.ts (protected routes pattern)
- Update docs/ai_docs/AI_LOG_user_understanding_20251231.md
- Review test user credentials from AI_MEMORY_short_term-testing.md

Step 1: Design Role-Based Navigation
- Update AuthHeader.tsx with role-specific navigation items
  * ADMIN role:
    - Show "Admin Panel" link
    - Show "Translate Queue" link (inherits translator features)
    - Show all standard links
  * TRANSLATOR role:
    - Show "Translate Queue" link
    - Show all standard links
    - Hide "Admin Panel"
  * READER role:
    - Show only: Dashboard, Articles, Videos, Terminology, Bookmarks
    - Hide: Translate Queue, Admin Panel
- Pattern: Fetch role from /api/auth/me, conditionally render nav items

Step 2: Implement Page-Level Access Control
- Update middleware.ts with role-based route protection:
  * /admin/* → Redirect if role !== 'admin'
  * /translate/* → Redirect if role === 'reader'
  * All other routes → Allow authenticated users
- Add custom error parameter to redirect URL
- Display role-based error messages on login page

Step 3: Component-Level Feature Restrictions
- Articles Detail Page (/articles/[id]):
  * ADMIN/TRANSLATOR: Show "Translate This" button → /translate/[id]
  * READER: Hide translation button, show read-only view
- Video Detail Page (/videos/[id]):
  * ALL ROLES: Can view, add notes, bookmark (current behavior is correct)
- Translation Editor (/translate/[id]):
  * ADMIN/TRANSLATOR: Full edit access
  * READER: Should not reach this page (middleware blocks)
- Admin Panel (/admin):
  * ADMIN: Full access to user management
  * TRANSLATOR/READER: Blocked by middleware

Step 4: Test Each User Role
- Test as ADMIN (admin-1@test.com):
  * Login → Navigate to Dashboard
  * Visit each page: /, /articles, /articles/[id], /videos, /videos/[id], /translate, /admin
  * Verify "Admin Panel" and "Translate Queue" links visible
  * Test all actions: bookmark, translate, manage users
  * Logout
- Test as TRANSLATOR (translator-1@test.com):
  * Login → Navigate to Dashboard
  * Visit each page (except /admin which should redirect)
  * Verify "Translate Queue" visible, "Admin Panel" hidden
  * Test translation features work
  * Verify cannot access /admin
  * Logout
- Test as READER (reader-1@test.com):
  * Login → Navigate to Dashboard
  * Visit allowed pages: /, /articles, /videos, /bookmarks, /terminology
  * Verify translation and admin links hidden
  * Try to access /translate/[id] → verify redirect to login with error
  * Try to access /admin → verify redirect
  * Test read-only features: view articles, bookmark, view videos
  * Logout

Step 5: Create UI Indicators
- Add role badge to AuthHeader (already exists, verify it's visible)
- Add subtle role indicator on pages with restricted features
- Show helpful message for restricted features (e.g., "Upgrade to Translator to translate articles")

Step 6: Verify & Summary
- Run through complete test suite for all 3 roles
- Document any issues in docs/debug_progress.md
- Create test script: packages/web/scripts/test-role-based-ui.js
  * Automated test for navigation items per role
  * Automated test for route redirects
- Update AI_MEMORY_short_term-testing.md with role-based UI patterns
- Suggest: "Ready for next feature: Video Transcripts or Advanced Translation Features"; Write the user queries for each of these steps into message draft.
---

---

# Advanced Translation Features: MAC-RAG Integration

**Status**: ✅ Ready for next feature  
**Source**: @mARTr/MAC-RAG (Multi-Agent Collaboration for RAG-Enhanced Translation)

## MAC-RAG Overview

A Python-based JA→EN translation system with:
- **8 Specialized Agents**: Analysis, Retrieval, Translation, Reflection, Improvement, JA-EN Specialist, Quality, Memory
- **RAG-Enhanced**: Terminology DB (1000+ Kendo terms), Translation Memory (1264 entries), ChromaDB vector search
- **Quality Loop**: Translate → Reflect → Improve (max 3 iterations)
- **JA-EN Specialist**: Subject resolution, honorific handling, onomatopoeia rendering

## Architecture
```
Source Text → Analysis → JA-EN Specialist → Retrieval → Translation ↔ Reflection → Quality Gate → Output
                                                            ↑                           │
                                                            └── Improvement ←───────────┘
```

---

## User Query: Phase 1 - AI Translation API Backend

```
Follow @kendo-translation/development_guideline.md : Implement AI Translation Backend

Step 0: Preparation & Analysis
- Read @mARTr/MAC-RAG/HANDOFF.md (full integration guide)
- Read @mARTr/MAC-RAG/src/llm/provider.py (LLM abstraction pattern)
- Read @mARTr/MAC-RAG/src/agents/coordinator.py (pipeline orchestration)
- Read @mARTr/MAC-RAG/data/terminology/kendo_terms.json (terminology format)
- Read @kendo-translation/development_guideline.md (§ API Routes pattern)
- Update docs/ai_docs/AI_LOG_user_understanding_YYYYMMDD.md

Step 1: Create LLM Provider Service
- Create packages/web/lib/ai/provider.ts
  * Abstract LLMProvider interface
  * OpenRouterProvider implementation (using httpx→fetch)
  * OpenAIProvider implementation (optional)
  * Factory function: getLLMProvider()
- Add environment variables:
  * LLM_PROVIDER=openrouter
  * OPENROUTER_API_KEY=sk-or-xxx
  * TRANSLATION_MODEL=meta-llama/llama-3.3-70b-instruct
- Pattern: Follow @mARTr/MAC-RAG/src/llm/provider.py (lines 35-91)

Step 2: Create Translation API Routes
- Create packages/web/app/api/ai/translate/route.ts
  * POST /api/ai/translate
  * Input: { source_text: string, article_id?: string }
  * Output: { translation: string, quality_score: number, iterations: number }
  * Auth: Require translator or admin role
- Create packages/web/app/api/ai/analyze/route.ts
  * POST /api/ai/analyze
  * Input: { source_text: string }
  * Output: { domain: string, complexity: number, entities: [] }

Step 3: Implement Simple Translation Pipeline
- Create packages/web/lib/ai/translate.ts
  * analyzeText(text) → { domain, complexity, entities }
  * translateText(text, context) → { translation, quality }
  * Prompts: System prompts for JA→EN translation
- Simple flow: Analyze → Translate (no quality loop yet)
- Return translation with quality estimate

Step 4: Integrate with Translation Editor
- Update packages/web/app/translate/[id]/TranslationEditor.tsx
  * Add "AI Translate" button
  * Call /api/ai/translate with source text
  * Show loading state during API call
  * Insert AI translation into target textarea
  * Show quality score badge

Step 5: Verify & Test
- Test: Load article → Click AI Translate → Verify translation appears
- Test: Check quality score display
- Test: Verify role protection (only translator/admin can use)
- Update AI_MEMORY with translation API patterns
- Suggest: "Ready for Phase 2: RAG Enhancement"
```

---

## User Query: Phase 2 - RAG Enhancement (Terminology + TM)

```
Follow @kendo-translation/development_guideline.md : Add RAG Enhancement

Step 0: Preparation
- Read @mARTr/MAC-RAG/src/db/vector.py (ChromaDB patterns)
- Read @mARTr/MAC-RAG/data/terminology/kendo_terms.json (term format)
- Read @mARTr/MAC-RAG/src/agents/retrieval.py (retrieval agent)
- Review Phase 1 translation API implementation

Step 1: Import Kendo Terminology
- Copy @mARTr/MAC-RAG/data/terminology/kendo_terms.json to packages/web/data/
- Create Supabase migration: terminology table
  * id, source_term, target_term, reading, domain, term_type, notes
- Create API: POST /api/terminology/import (admin only)
- Run import: 1000+ Kendo terms

Step 2: Implement Terminology Lookup
- Create packages/web/lib/ai/retrieval.ts
  * searchTerminology(text) → matching terms
  * Simple Supabase text search (no vector DB yet)
- Update translate.ts to include terminology in prompt context
- Format: "Use these terms: 竹刀=shinai, 構え=stance, ..."

Step 3: Create Translation Memory Table
- Create Supabase migration: translation_memory table
  * id, source_text, target_text, domain, quality, human_approved
- API: GET /api/translation-memory?q=query
- API: POST /api/translation-memory (save approved translations)

Step 4: Integrate TM into Translation
- Update translate.ts:
  * Search TM for similar source text
  * Include high-quality matches in prompt
  * "Similar translations: ..."
- After human approval, save to TM

Step 5: Verify & Test
- Test: Translate text containing "竹刀" → verify "shinai" used
- Test: Translate similar text → verify TM match influences result
- Test: Approve translation → verify saved to TM
- Update AI_MEMORY with RAG patterns
- Suggest: "Ready for Phase 3: Quality Loop"
```

---

## User Query: Phase 3 - Quality Loop (Reflect + Improve)

```
Follow @kendo-translation/development_guideline.md : Implement Quality Loop

Step 0: Preparation
- Read @mARTr/MAC-RAG/src/agents/reflection.py (quality review)
- Read @mARTr/MAC-RAG/src/agents/improvement.py (apply feedback)
- Review Phase 1-2 implementation

Step 1: Create Reflection Module
- Create packages/web/lib/ai/reflection.ts
  * reflectOnTranslation(source, target) → { score, issues, suggestions }
  * Prompt: "Rate this translation 0-1, identify issues, suggest improvements"
  * Parse structured response

Step 2: Create Improvement Module
- Create packages/web/lib/ai/improvement.ts
  * improveTranslation(source, target, feedback) → improved translation
  * Prompt: "Apply these suggestions to improve the translation"

Step 3: Implement Quality Loop
- Update packages/web/lib/ai/translate.ts:
  * Loop: translate → reflect → (if score < 0.85) improve → reflect
  * Max 3 iterations
  * Track iteration count and quality history
- Return: { translation, quality, iterations, improvement_history }

Step 4: Show Quality Feedback in UI
- Update TranslationEditor:
  * Show quality score with color coding (green ≥0.85, yellow ≥0.70, red <0.70)
  * Show "Improved X times" badge
  * Optional: Show improvement history in collapsible section

Step 5: Verify & Test
- Test: Translate text → verify quality loop runs (check iterations)
- Test: Low quality → verify improvement attempts
- Test: UI shows correct quality indicators
- Update AI_MEMORY with quality loop patterns
- Suggest: "Ready for Phase 4: JA-EN Specialist"
```

---

## User Query: Phase 4 - JA-EN Specialist Features

```
Follow @kendo-translation/development_guideline.md : Implement JA-EN Specialist

Step 0: Preparation
- Read @mARTr/MAC-RAG/src/agents/ja_en_specialist.py (full implementation)
- Read @mARTr/MAC-RAG/data/onomatopoeia.json (onomatopoeia database)
- Review Phase 1-3 implementation

Step 1: Subject Resolution
- Create packages/web/lib/ai/ja-en-specialist.ts
  * resolveSubjects(text) → { resolved_text, subjects: [] }
  * Japanese often omits subjects - infer from context
  * Add explicit subjects: "私は" → mark as first person

Step 2: Honorific Handling
- Add to ja-en-specialist.ts:
  * handleHonorifics(text, strategy) → processed text
  * Strategies: 'retain' (田中先生 → Tanaka-sensei)
  *            'map' (先生 → Mr./Dr.)
  *            'contextual' (infer from register)
- Store honorific_strategy in user preferences or project settings

Step 3: Onomatopoeia Database
- Copy @mARTr/MAC-RAG/data/onomatopoeia.json to packages/web/data/
- Create lookup function: getOnomatopoeiaTranslation(jp) → english
- Integrate into translation prompt: "Translate ニコニコ as 'smiling brightly'"

Step 4: Integrate with Pipeline
- Update translate.ts:
  * Before translation: Run JA-EN specialist preprocessing
  * Include specialist output in translation prompt
  * After translation: Verify specialist recommendations applied

Step 5: Verify & Test
- Test: Text with 先生 → verify honorific strategy applied
- Test: Text with ニコニコ → verify onomatopoeia translated
- Test: Text with omitted subject → verify subject inferred
- Update AI_MEMORY with JA-EN specialist patterns
- Suggest: "Ready for Phase 5: Human Routing + Quality Gates"
```

---

## User Query: Phase 5 - Human Routing + Quality Gates

```
Follow @kendo-translation/development_guideline.md : Implement Human Routing

Step 0: Preparation
- Read @mARTr/MAC-RAG/HANDOFF.md (§ Human Routing)
- Review Phase 1-4 implementation
- Review current translation workflow in app

Step 1: Quality Thresholds Configuration
- Add to project/user settings:
  * QE_HIGH_THRESHOLD: 0.85 (AI-only, no human review)
  * QE_MEDIUM_THRESHOLD: 0.70 (light post-editing)
  * Below 0.70: Full human translation
- Create admin UI to configure thresholds

Step 2: Human Routing Logic
- Update translation pipeline:
  * Score ≥ 0.85 → route: 'ai_only', status: 'ready_for_publish'
  * Score 0.70-0.85 → route: 'light_pe', status: 'needs_review'
  * Score < 0.70 → route: 'full_revision', status: 'needs_translation'
- Store routing decision in translation record

Step 3: Translation Queue Updates
- Update /translate page:
  * Filter by routing: Show "Needs Review" vs "Needs Translation"
  * Color-code by routing type
  * Show AI quality score for each item

Step 4: Approval Workflow
- Add to TranslationEditor:
  * "Approve Translation" button (for translators/admins)
  * On approve: Set human_approved=true, save to TM
  * "Request Revision" button → mark for re-translation

Step 5: Verify & Test
- Test: High quality AI → verify routes to AI-only
- Test: Medium quality → verify routes to light PE queue
- Test: Low quality → verify routes to full revision
- Test: Approve flow → verify saved to TM
- Update AI_MEMORY with human routing patterns
- Suggest: "MAC-RAG Integration Complete!"
```

---

## Implementation Priority

| Phase | Feature | Complexity | Dependencies |
|-------|---------|------------|--------------|
| 1 | AI Translation API | Medium | OpenRouter API key |
| 2 | RAG (Terminology + TM) | Medium | Phase 1, kendo_terms.json |
| 3 | Quality Loop | High | Phase 1-2 |
| 4 | JA-EN Specialist | Medium | Phase 1-3 |
| 5 | Human Routing | Medium | Phase 1-4 |

**Estimated Total**: 5 implementation sessions

---

## Key Files from MAC-RAG to Reference

| File | Purpose | Port to |
|------|---------|---------|
| src/llm/provider.py | LLM abstraction | lib/ai/provider.ts |
| src/agents/coordinator.py | Pipeline orchestration | lib/ai/translate.ts |
| src/agents/reflection.py | Quality review | lib/ai/reflection.ts |
| src/agents/ja_en_specialist.py | JA-specific handling | lib/ai/ja-en-specialist.ts |
| data/terminology/kendo_terms.json | 1000+ Kendo terms | data/kendo_terms.json |
| data/onomatopoeia.json | JP onomatopoeia | data/onomatopoeia.json |

---

*Created: December 31, 2025*