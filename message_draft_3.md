# Complete Browser Test Run

## User Query for TODO: Complete Browser Test Run

```
Follow @kendo-translation/development_guideline.md : Complete Browser Test Run

Step 0: Preparation & Environment Check
- Ensure dev server is running on http://localhost:3001
- Read @kendo-translation/docs/debug_progress.md (current status)
- Review test user credentials:
  * Admin: admin-1@test.com / !12345678!
  * Translator: translator-1@test.com / !12345678!
  * Reader: reader-1@test.com / !12345678!

Step 1: Test Admin Role (admin-1@test.com)
- Login as admin
- Verify navigation shows: Dashboard, Articles, Videos, Terminology, Bookmarks, Translate, Admin
- Test Admin Panel (/admin):
  * View user list
  * Change a user's role
  * Verify role change persists
- Test Translation Editor (/translate):
  * Open an article
  * Click "⚙️ Agent Config" tab → verify 8 models available
  * Change model to llama-3.3-70b-instruct:free → Save
  * Click "🤖 Get AI Suggestion" → verify translation returned
  * Click "💬 Agent Logs" tab → verify log entry appears
  * Accept suggestion → Save translation
- Test Theme:
  * Toggle dark/light mode
  * Verify solarized colors (light: cream, dark: navy)
- Logout

Step 2: Test Translator Role (translator-1@test.com)
- Login as translator
- Verify navigation: Dashboard, Articles, Videos, Terminology, Bookmarks, Translate (NO Admin)
- Attempt to access /admin → verify redirect with error message
- Test Translation Flow:
  * Go to /translate
  * Open article "Practice Methods for Beginners"
  * Click "Get AI Suggestion"
  * Verify JA-EN Analysis panel shows:
    - Formality level
    - Inferred subjects
  * Click "Agent Logs" tab → verify conversation logged
  * Accept and Save translation
- Test Translation Memory:
  * Click "📚 Translation Memory" tab
  * Verify TM search works
- Logout

Step 3: Test Reader Role (reader-1@test.com)
- Login as reader
- Verify navigation: Dashboard, Articles, Videos, Terminology, Bookmarks (NO Translate, NO Admin)
- Test allowed pages:
  * /articles → view list
  * /articles/[id] → view article (NO translate button)
  * /videos → view list
  * /terminology → search terms
  * /bookmarks → view bookmarks
- Test restricted access:
  * Attempt /translate → verify redirect with error
  * Attempt /admin → verify redirect with error
- Test read-only features:
  * Bookmark an article
  * View a video, add a note
- Logout

Step 4: Test API Endpoints
- GET /api/agent/config → verify 8 models, default llama-3.3
- GET /api/terminology?q=竹刀 → verify returns "shinai"
- GET /api/translation-memory → verify empty or has entries

Step 5: Update Documentation
- Update docs/debug_progress.md with:
  * Test date
  * All test results (pass/fail)
  * Any bugs discovered
  * Screenshots of key features
- Mark all tested features as verified
```

## Expected Test Results

| Feature | Expected Result |
|---------|-----------------|
| Admin can manage users | ✅ Role dropdown works |
| Translator can translate | ✅ AI suggestion returned |
| Reader is read-only | ✅ Blocked from /translate, /admin |
| Agent Config editable | ✅ 8 models, saves to localStorage |
| Agent Logs visible | ✅ Shows conversation history |
| Theme toggle works | ✅ Solarized light/dark |
| Terminology search | ✅ Returns Kendo terms |
| Translation Memory | ✅ Can save/retrieve |

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin-1@test.com | !12345678! |
| Translator | translator-1@test.com | !12345678! |
| Reader | reader-1@test.com | !12345678! |


---

# MAC-RAG Translation System: Layer 1 Implementation

## User Query for TODO: Implement Layer 1 Core Pipeline

```
Follow @kendo-translation/development_guideline.md : MAC-RAG Layer 1 Core Pipeline
Reference: @kendo-translation/docs/mac_rag_implementation_plan.md

Step 0: Preparation
- Read docs/mac_rag_implementation_plan.md (implementation phases)
- Ensure dev server is running on http://localhost:3001
- Verify database is connected (Supabase)

Step 1: Create Context Builder (Step 1.1) ✅
- Create lib/context/context-builder.ts:
  * Define ContextObject interface
  * Build basic context from source text
  * Extract source/target language
  * Return structured context object

Step 2: Implement Domain/Style Analyzers (Step 1.2) ✅
- Create lib/context/analyzers.ts:
  * Rule-based domain classification (kendo, general, technical)
  * Style detection (formal/casual based on keigo markers)
  * Entity extraction (basic keyword matching for Kendo terms)
  * Kendo terminology database (70+ terms)

Step 3: Create Context Retrieval API (Step 1.3) ✅
- Create app/api/context/retrieve/route.ts:
  * TM lookup with simple matching
  * Terminology retrieval
  * Coverage calculation

Step 4: Create Quality Scorer (Step 1.5) ✅
- Create lib/quality/scorer.ts:
  * LLM-assisted quality evaluation
  * Score fluency, adequacy, terminology, style
  * Routing recommendation (auto/light PE/standard PE/full revision)

Step 5: Create Memory Save API (Step 1.6) ✅
- Create app/api/post/save/route.ts:
  * Save translation pairs to TM
  * Update terminology database
  * Record context feedback

Step 6: Update Translation API
- Modify app/api/translate/suggest/route.ts:
  * Integrate context builder
  * Use retrieval results in prompt
  * Return quality scores with translation

Step 7: Verification
- Test context builder with Kendo text
- Verify domain detection returns "kendo"
- Verify terminology extraction finds terms
- Test end-to-end translation flow
```

## Layer 1 Files Created

| File | Purpose | Status |
|------|---------|--------|
| `lib/context/context-builder.ts` | ContextObject + buildContext() | ✅ |
| `lib/context/analyzers.ts` | Domain/style/entity detection | ✅ |
| `app/api/context/retrieve/route.ts` | TM + terminology retrieval | ✅ |
| `lib/quality/scorer.ts` | LLM quality assessment | ✅ |
| `app/api/post/save/route.ts` | Memory save endpoint | ✅ |

## Next Steps: Layer 2 (UI & User Control)

After Layer 1 is verified, proceed to:
- ContextBuilderPanel.tsx
- TranslationCandidates.tsx
- PostTranslationPanel.tsx
