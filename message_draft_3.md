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

# MAC-RAG Translation System: Full Browser Test

## User Query for TODO: MAC-RAG Full Pipeline Browser Test

```
Follow @kendo-translation/development_guideline.md : MAC-RAG Full Pipeline Test

Step 0: Preparation
- Ensure dev server is running on http://localhost:3001
- Login as translator (translator-1@test.com / !12345678!)

Step 1: Test MAC-RAG API Endpoint
- Open browser DevTools → Network tab
- Navigate to /translate and select an article with Japanese content
- Open a new browser tab and go to: http://localhost:3001/api/translate/mac-rag
  * Verify GET returns pipeline info JSON
  * Note the phases: context, translate, score, full

Step 2: Test Context Building Phase
- Use DevTools console to test the API:
  ```javascript
  fetch('/api/translate/mac-rag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceText: '剣道の基本は構えと足さばきです。竹刀を正しく持ち、中段の構えから始めましょう。',
      phase: 'context'
    })
  }).then(r => r.json()).then(console.log);
  ```
- Verify response contains:
  * context.domain.primary === 'kendo'
  * tmMatches array (may be empty)
  * terminology.requiredTerms with Kendo terms
  * jaAnalysis with subjects and honorifics
  * coverageReport with gaps/strengths

Step 3: Test Full Pipeline
- Run full pipeline:
  ```javascript
  fetch('/api/translate/mac-rag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceText: '剣道の基本は構えと足さばきです。竹刀を正しく持ち、中段の構えから始めましょう。',
      phase: 'full'
    })
  }).then(r => r.json()).then(data => {
    console.log('Context:', data.context);
    console.log('Candidates:', data.candidates);
    console.log('Quality:', data.qualityAssessment);
    console.log('Routing:', data.routing);
  });
  ```
- Verify response contains:
  * candidates array with 3 options (literal, natural, formal)
  * Each candidate has confidence score
  * qualityAssessment with scores (fluency, adequacy, terminology, style)
  * routing.decision (auto_accept/light_pe/standard_pe/full_revision)

Step 4: Verify Kendo Domain Detection
- Test with Kendo-specific text:
  * "残心を忘れずに" → should detect domain: kendo
  * "先生のご指導" → should detect keigo: sonkeigo
  * "バシッと打つ" → should detect onomatopoeia

Step 5: Test Existing Translation Editor
- Go to /translate
- Select an article with Japanese content
- Click "🤖 Get AI Suggestion"
- Verify translation is returned
- Check Agent Logs for conversation history
- Accept and Save translation

Step 6: Document Results
- Note all test outcomes
- Capture any errors in console
- Document timing information from responses
```

## MAC-RAG API Test Cases

| Test | Input | Expected Output |
|------|-------|-----------------|
| Domain Detection | "竹刀の振り方" | domain: "kendo" |
| Term Extraction | "面と小手" | terms: men, kote |
| Keigo Detection | "いらっしゃいます" | keigoLevel: "sonkeigo" |
| Multi-Candidate | Any text | 3 candidates (literal/natural/formal) |
| Quality Scoring | Translation pair | scores: fluency, adequacy, terminology, style |

## Expected Timing (typical)

| Phase | Expected Time |
|-------|---------------|
| Context | 200-500ms |
| Translate | 3-8s (3 LLM calls) |
| Score | 2-5s (1 LLM call) |
| Full Pipeline | 5-15s total |


---

# MAC-RAG Integrated Translation Page

## User Query for TODO: Create Integrated MAC-RAG Translation Page

```
Follow @kendo-translation/development_guideline.md : Create Integrated MAC-RAG Page

OVERVIEW:
The MAC-RAG library files are complete but NOT wired into the UI.
Create a new integrated translation page at /translate/mac-rag/[id] that uses the 
full 3-phase pipeline with all components connected.

Step 0: Review Existing Components
- Review @kendo-translation/docs/mac_rag_implementation_plan.md
- Update docs/ai_docs/AI_LOG_user_understanding_20251231.md
- Create docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md

- lib/context/context-builder.ts, analyzers.ts, context-pairer.ts, gap-detector.ts
- lib/retrieval/tm-search.ts, terminology.ts
- lib/translation/multi-gen.ts
- lib/quality/scorer.ts, routing.ts  
- lib/agents/ja-en-agent.ts
- lib/hooks/useMacRag.ts
- app/api/translate/mac-rag/route.ts
- components/translation/ContextBuilderPanel.tsx
- components/translation/TranslationCandidates.tsx
- components/translation/PostTranslationPanel.tsx
- components/translation/QualityScoreDisplay.tsx

Step 1: Create MAC-RAG Translation Page
- Review @kendo-translation/docs/mac_rag_implementation_plan.md
- Create: app/translate/mac-rag/[id]/page.tsx

The page should have 3 PHASES shown in sequence:

PHASE 1: Pre-Translation (Context Building)
- Show source Japanese text from article
- Use useMacRag hook to call buildContext()
- Display ContextBuilderPanel component with:
  * Domain/style detection results
  * TM matches with checkboxes
  * Terminology constraints
  * Coverage gaps detected
  * JA-EN analysis (subjects, keigo level)
- "Start Translation" button to proceed
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md

PHASE 2: Translation (Multi-Candidate Generation)  
- Call useMacRag translate() method
- Display TranslationCandidates component with:
  * 3 candidates (literal, natural, formal)
  * Confidence scores for each
  * Radio selection for preferred
  * Edit capability
- "Accept & Continue" button to proceed
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md

PHASE 3: Post-Translation (Quality & Save)
- Call useMacRag score() method
- Display PostTranslationPanel component with:
  * Quality scores (fluency, adequacy, terminology, style)
  * Routing recommendation badge
  * Save to TM checkbox
  * New terms detected with save options
  * Context feedback for TM matches used
- "Save & Finish" button to complete
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md

Step 2: Wire All Components Together
- Review @kendo-translation/docs/mac_rag_implementation_plan.md
- Import useMacRag hook
- Import all 4 translation components
- Manage phase state (context → translate → score)
- Pass data between phases via hook state
- Handle loading states for each phase
- Show progress indicator
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md

Step 3: Add Navigation Link

- Add "🔬 MAC-RAG" link in RoleBasedNavigation.tsx for translator/admin
- Update translate page to include link to MAC-RAG version
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md

Step 4: Update Styling
- Use existing solarized theme variables
- Show clear phase progression (stepper or tabs)
- Loading spinners during API calls
- Error handling with retry options
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md

Step 5: Browser Test
- Review @kendo-translation/docs/mac_rag_implementation_plan.md
- Login as translator
- Navigate to /translate/mac-rag/[article-id]
- Test Phase 1: Verify context building shows domain=kendo
- Test Phase 2: Verify 3 candidates generated
- Test Phase 3: Verify quality scores display
- Complete full workflow: Save translation
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md
```

## File Structure

```
app/translate/mac-rag/[id]/
  └── page.tsx              # Main integrated page (NEW)

components/translation/
  ├── ContextBuilderPanel.tsx    # Phase 1 ✅ EXISTS
  ├── TranslationCandidates.tsx  # Phase 2 ✅ EXISTS  
  ├── PostTranslationPanel.tsx   # Phase 3 ✅ EXISTS
  └── QualityScoreDisplay.tsx    # Utility ✅ EXISTS

lib/hooks/
  └── useMacRag.ts          # State management ✅ EXISTS
```

## Expected Workflow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   PHASE 1   │  →  │   PHASE 2    │  →  │    PHASE 3    │
│   Context   │     │  Translation │     │  Quality/Save │
├─────────────┤     ├──────────────┤     ├───────────────┤
│ • Domain    │     │ • Literal    │     │ • Scores      │
│ • TM Match  │     │ • Natural    │     │ • Routing     │
│ • Terms     │     │ • Formal     │     │ • TM Save     │
│ • JA-EN     │     │ • Selection  │     │ • New Terms   │
└─────────────┘     └──────────────┘     └───────────────┘
```

---

# MAC-RAG Human-Like Browser Test

## User Query for TODO: MAC-RAG Complete Browser Test

```
Follow @kendo-translation/browser_testing_guideline.md : MAC-RAG Complete Browser Test

IMPORTANT: Act like a human user. Stay in the same browser tab. Navigate via clicks, not URLs.

Step 0: Session Setup
- Read @kendo-translation/browser_testing_guideline.md first
- Navigate to http://localhost:3000 (root)
- Observe the landing page, read the content
- Screenshot the initial state
- Click "Login" link in the navigation (don't type URL)
- Login as translator: translator-1@test.com / !12345678!
- Wait 3 seconds for redirect
- Screenshot the dashboard after login
- Verify you see "translator-1" and "Logout" in header

Step 1: Navigate to MAC-RAG (via clicks, not URLs)
- Look for "🔬 MAC-RAG" in the navigation bar
- Click on it
- Wait 3 seconds for page load
- Read the queue page content
- Screenshot the MAC-RAG queue page
- Verify you see a list of articles with "Translate →" buttons

Step 2: Phase 1 - Context Building
- Click "Translate →" on the first article with Japanese content
- Wait 5 seconds for page and context to load
- Observe the 3-phase indicator at top (1 Context, 2 Translate, 3 Quality)
- Read the "Source Text (Japanese)" panel - verify it shows Japanese
- Screenshot the source text panel
- Look at the Context Builder panel:
  * What domain was detected?
  * What style was detected?
  * Any entities found?
- Screenshot the full Phase 1 state
- Click "→ Start Translation" button

Step 3: Phase 2 - Translation Candidates
- Wait 8-15 seconds for LLM to generate translations
- Observe the loading state
- When candidates appear, read all 3 options:
  * Literal approach - what does it say?
  * Natural approach - what does it say?
  * Formal approach - what does it say?
- Screenshot the 3 candidates with confidence scores
- Select the "Natural" approach by clicking its radio button
- Screenshot after selection
- Click "Accept & Continue" button

Step 4: Phase 3 - Quality & Save
- Wait 5-10 seconds for quality scoring
- Observe the quality scores:
  * Fluency score
  * Adequacy score
  * Terminology score
  * Style score
- What is the routing recommendation? (auto_accept/light_pe/standard_pe)
- Screenshot the quality assessment
- Toggle "Save to Translation Memory" checkbox if visible
- Click "Save & Finish" button
- Wait for save confirmation

Step 5: Completion & Verification
- Observe the completion message
- Screenshot the "Translation Complete" panel
- Click "View Article" to see the saved translation
- Verify the English translation is displayed
- Screenshot the article with translation
- Click "Back to Queue" or navigate via nav

Step 6: Session Cleanup
- From wherever you are, click on "Logout" in the header
- Wait for redirect to login page
- Screenshot the logged-out state
- Compile final test report

Step 7: Document Results
- Update docs/ai_docs/AI_MEMORY_short_term-MAC_RAG.md with findings
- Create a test summary showing:
  * All phases completed (✅/❌)
  * Screenshots captured
  * Any issues found
```

## Expected Observations

| Phase | Expected Content |
|-------|------------------|
| Queue | Article list with translate buttons |
| Phase 1 | Japanese source text, domain detection, entities |
| Phase 2 | 3 candidates with different styles |
| Phase 3 | Quality scores 0-100%, routing badge |
| Complete | Success message, view/queue links |

## Human Timing Guide

| Action | Wait Time |
|--------|-----------|
| Page navigation | 3 seconds |
| Context building | 5 seconds |
| Translation generation | 10-15 seconds |
| Quality scoring | 5-10 seconds |
| Save operation | 3 seconds |

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Translator | translator-1@test.com | !12345678! |