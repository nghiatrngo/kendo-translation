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

# IN-DEPTH Translation Revision: MAC-RAG Implementation

## User Query for TODO: Enhance Translation Process with MAC-RAG Architecture

```
Follow @kendo-translation/development_guideline.md : In-Depth Translation Revision

Step 0: Preparation & Commit
- Commit all recent changes with message: "Pre-enhancement: Translation system baseline"
- Read reference documents:
  * @mARTr/professional-agent-translation.md (target architecture)
  * @mARTr/project_description.md (project goals)
- Read current implementation:
  * @kendo-translation/packages/web/app/api/translate/suggest/route.ts
  * @kendo-translation/packages/web/components/TranslationEditor.tsx
  * @kendo-translation/docs/debug_progress.md

Step 1: Gap Analysis & Planning
- Compare current implementation vs MAC-RAG target:
  * Current: Single LLM call → AI suggestion
  * Target: Multi-agent pipeline (Analysis → Retrieval → Translation → Reflection → Improvement)
- Document gaps in @kendo-translation/docs/translation_enhancement_plan.md:
  * Missing agents (Analysis, Reflection, Improvement, Language-Specific)
  * Missing RAG components (TM search, terminology enforcement)
  * Missing quality gates (CometKiwi scoring, human routing)
- Create implementation phases (prioritized for Kendo domain):
  * Phase 1: JA→EN Analysis Agent (subject inference, keigo detection)
  * Phase 2: Reflection-Improvement Loop (translate-reflect-improve pattern)
  * Phase 3: RAG Enhancement (Translation Memory, Terminology DB)
  * Phase 4: Quality Estimation Gate

Step 2: Implement Analysis Agent
- Create @kendo-translation/packages/web/lib/agents/analysis-agent.ts:
  * Parse Japanese source text
  * Detect formality level (keigo analysis)
  * Identify omitted subjects (track くれる/もらう patterns)
  * Extract Kendo-specific entities (技, 構え, 礼法 terms)
  * Estimate translation complexity
- Update translation API to use Analysis Agent:
  * Modify /api/translate/suggest/route.ts
  * Add analysis results to prompt context
- Test with Kendo article containing:
  * Omitted subjects
  * Honorific language
  * Technical terminology (竹刀, 面, 小手, etc.)

Step 3: Implement Reflection-Improvement Loop
- Create @kendo-translation/packages/web/lib/agents/reflection-agent.ts:
  * Review translation against source
  * Check accuracy, fluency, terminology, style
  * JA-specific checks (subject consistency, keigo handling)
  * Output structured issue list with severity
- Create @kendo-translation/packages/web/lib/agents/improvement-agent.ts:
  * Apply reflection feedback
  * Refine translation iteratively
  * Track changes applied
- Update translation pipeline:
  * Initial translation → Reflection → Improvement (max 2 iterations)
  * Stop early if quality threshold met
- Add iteration visualization to UI:
  * Show each iteration in Agent Logs tab
  * Display improvement diff between versions

Step 4: Enhance RAG Integration
- Enhance Translation Memory search:
  * Modify @kendo-translation/packages/web/app/api/translation-memory/route.ts
  * Add semantic similarity scoring
  * Return fuzzy matches (70-99%) with match percentage
- Integrate terminology enforcement:
  * Query @kendo-translation/packages/web/app/api/terminology
  * Add required terms to prompt as constraints
  * Mark Kendo terms as "DO NOT TRANSLATE" (e.g., 剣道 → kendo)
- Add domain corpus examples:
  * Use YouTube transcripts from @kendo-translation/data/youtube_transcripts
  * Retrieve relevant JA-EN pairs as few-shot examples

Step 5: Implement Japanese-Specific Agent
- Create @kendo-translation/packages/web/lib/agents/ja-en-agent.ts:
  * Subject Resolution Engine:
    - Track entity mentions across sentences
    - Infer subjects from verb forms
    - Output: inferred_subject with confidence
  * Honorific Transformation:
    - Map keigo levels to English register
    - Strategy: contextual (Kendo = formal/respectful)
  * Onomatopoeia Handling:
    - Database for common Kendo sounds (ドン, バシッ, etc.)
    - Render as descriptive phrases
  * Sentence Structure Transformation:
    - SOV → SVO restructuring
    - Break long nested clauses
- Display JA-EN analysis in UI:
  * Update TranslationEditor.tsx
  * Show formality level, inferred subjects, special handling

Step 6: Add Quality Estimation UI
- Create quality score display:
  * Show confidence per segment
  * Highlight low-confidence areas
  * Suggest human review for <0.70 confidence
- Add quality breakdown panel:
  * Accuracy score
  * Fluency score
  * Terminology compliance
- Implement routing indicators:
  * ✅ High (≥0.85): Ready for light PE
  * ⚠️ Medium (0.70-0.85): Standard PE recommended
  * ❌ Low (<0.70): Full revision required

Step 7: Verification & Documentation
- Test complete pipeline with 3 Kendo articles:
  * Article 1: Beginner etiquette (礼法 content)
  * Article 2: Technical strikes (技術 content)
  * Article 3: Philosophy text (心構え content)
- Verify each agent produces expected output:
  * Analysis: Correct formality, entities detected
  * Translation: Uses terminology from DB
  * Reflection: Identifies real issues
  * Improvement: Quality increases iteration over iteration
- Update documentation:
  * @kendo-translation/docs/translation_architecture.md (new)
  * @kendo-translation/docs/debug_progress.md (mark complete)
- Commit with message: "Enhanced translation: MAC-RAG multi-agent architecture"
```

## Implementation Phases Summary

| Phase | Component | Priority | Complexity |
|-------|-----------|----------|------------|
| 1 | Analysis Agent | High | Medium |
| 2 | Reflection-Improvement Loop | High | High |
| 3 | RAG Enhancement (TM + Terms) | Medium | Medium |
| 4 | JA-EN Specific Agent | High | High |
| 5 | Quality Estimation UI | Low | Low |

## Key Files to Create/Modify

| Action | File Path |
|--------|-----------|
| CREATE | `packages/web/lib/agents/analysis-agent.ts` |
| CREATE | `packages/web/lib/agents/reflection-agent.ts` |
| CREATE | `packages/web/lib/agents/improvement-agent.ts` |
| CREATE | `packages/web/lib/agents/ja-en-agent.ts` |
| MODIFY | `packages/web/app/api/translate/suggest/route.ts` |
| MODIFY | `packages/web/components/TranslationEditor.tsx` |
| MODIFY | `packages/web/app/api/translation-memory/route.ts` |
| CREATE | `docs/translation_architecture.md` |
| CREATE | `docs/translation_enhancement_plan.md` |

## Reference Architecture (from MAC-RAG)

```
Source Text
    ↓
┌─────────────────┐
│ Analysis Agent  │ ← Formality, entities, complexity
└────────┬────────┘
         ↓
┌─────────────────┐
│ Retrieval Agent │ ← TM matches, terminology, corpus examples
└────────┬────────┘
         ↓
┌─────────────────────────────────────────┐
│         Translation Loop (max 2x)       │
│  ┌─────────────┐  ┌───────────────────┐ │
│  │ Translation │→ │ Reflection Agent  │ │
│  │    Agent    │  │ (review issues)   │ │
│  └─────────────┘  └─────────┬─────────┘ │
│         ↑                   ↓           │
│  ┌──────┴───────────────────────────┐   │
│  │      Improvement Agent           │   │
│  │  (apply feedback, refine)        │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↓
┌─────────────────┐
│ JA-EN Agent     │ ← Subject resolution, honorifics, onomatopoeia
└────────┬────────┘
         ↓
┌─────────────────┐
│ Quality Gate    │ ← Confidence scoring, routing recommendation
└────────┬────────┘
         ↓
    Final Output + Quality Report
```

## Success Criteria

- [ ] Analysis Agent correctly identifies keigo in test articles
- [ ] Reflection Agent finds real translation issues (not false positives)
- [ ] Improvement Agent increases quality score across iterations
- [ ] JA-EN Agent infers subjects with >80% accuracy in test set
- [ ] Translation Memory returns relevant fuzzy matches
- [ ] Terminology from DB appears in translations consistently
- [ ] UI displays all agent outputs in readable format
- [ ] Complete pipeline runs in <30 seconds per paragraph

