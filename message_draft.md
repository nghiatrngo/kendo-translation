## 📚 Sub-Guideline Navigation

| # | File | Purpose | Key Workflows |
|---|------|---------|---------------|
| **1** | [1_documentation_workflows.md](1_documentation_workflows.md) | Documentation tasks | PLAN, WRITE, REVISE, FUNCTION_VALIDATE, SEMANTIC_VALIDATE |
| **2** | [2_coding_workflows.md](2_coding_workflows.md) | Code implementation | NEW, REVISE, DEBUG, REFACTOR |
| **3** | [3_testing_workflows.md](3_testing_workflows.md) | Testing and validation | CREATE_TESTBED, RUN_TESTBED |
| **4** | [4_review_workflows.md](4_review_workflows.md) | Code/doc review & analysis | CODE_REVIEW, DOC_REVIEW, TEST_REVIEWING |
| **5** | [5_management_workflows.md](5_management_workflows.md) | Project organization & maintenance | ORGANIZING, ARCHIVING, INTROSPECTION, MEMORY_UPDATE |
| **6** | [6_advanced_documentation.md](6_advanced_documentation.md) | Advanced documentation tasks | CODE_PROCESS, PROCESS_DESCRIPTION, CODEBASE_ANALYSIS, AGGREGATION |
| **7** | [7_workflow_chaining_examples.md](7_workflow_chaining_examples.md) | Workflow combination patterns | Pattern 1-5, Explicit/Autonomous/Checkpoint modes |

----

## 📝 User Query Guidelines for AI Coders

### How to Write Effective AI Coder Prompts

This section explains how to structure user messages to get consistent, high-quality results from AI coders.

---

### Query Structure Template

```
Follow @[project]/[guideline_file].md : [Task Title]

Step 0: Preparation
- Read @[project]/[file1].md ([specific section])
- Read @[project]/[file2].md ([specific section])
- Read @[source_project]/[path/to/reference/file] (lines X-Y for patterns)
- Create/Update [ai_docs files]

Step 1: [First Action]
- [Specific sub-task with details]
- [What patterns/references to follow]
- [Expected output]

Step 2: [Second Action]
- [Details...]

Step N: Verify & Summary
- [How to verify success]
- Update AI_MEMORY_short_term-[iteration].md with success patterns
- Suggest: "[Next action or iteration]"
```

---

### Key Principles

#### 1. **Anchor to Guidelines**
Always start with `Follow @[project]/[guideline].md` to give the AI coder:
- Project context
- Coding standards
- Workflow patterns

#### 2. **Step 0: Explicit Reading List**
Tell the AI coder exactly what to read before implementing:

| Element | Format | Example |
|---------|--------|---------|
| Guideline file | `@project/file.md` | `@kendo-translation/development_guideline.md` |
| Specific section | `(§ Section Name)` | `(§ Coding Standards → Supabase Patterns)` |
| Source code reference | `@project/path/file.ext (lines X-Y)` | `@mARTr/MAC-RAG/src/agents/ja_en_specialist.py (lines 1-100)` |
| Data location | `@project/path/*.ext (description)` | `@mARTr/data_crawler/output/*.json (315 article pairs)` |

#### 3. **Sub-steps with Context**
For each step, provide:
- **What to do**: Clear action verb (Create, Implement, Port, Update)
- **Where**: File path or directory
- **How**: Pattern to follow or reference file
- **What**: Expected content or functionality

**Example:**
```
Step 2: Articles CRUD
- Create app/api/articles/route.ts (GET list, POST create)
- Create app/api/articles/[id]/route.ts (GET single)
- Update app/articles/page.tsx to fetch and display list
- Pattern: follow Supabase query patterns from reference_docs.md §3
```

#### 4. **Verify & Summary Step**
Always end with verification:
```
Step N: Verify & Summary
- Test: [specific test scenario with expected result]
- Update AI_MEMORY_short_term-[iter].md with success patterns
- Suggest: "[Next iteration or action]"
```

---

### File Naming Conventions

| File Type | Pattern | Example |
|-----------|---------|---------|
| User understanding log | `AI_LOG_user_understanding_YYYYMMDD.md` | `AI_LOG_user_understanding_20251230.md` |
| Short-term memory | `AI_MEMORY_short_term-[context].md` | `AI_MEMORY_short_term-iter1.md` |
| Implementation plan | `AI_PLAN_[description]_YYYYMMDD.md` | `AI_PLAN_auth_system_20251230.md` |
| Analysis result | `AI_ANALYSIS_[topic]_YYYYMMDD.md` | `AI_ANALYSIS_codebase_20251230.md` |

---

### Reference Syntax

**Cross-project references:**
```
@project_name/path/to/file.ext
```

**Examples:**
- `@kendo-translation/development_guideline.md` - Local project file
- `@mARTr/annotation_platform/src/lib/llm/provider.ts` - Reference project source
- `@youtube_note/server-supabase.js` - Reference project for patterns

**Section references:**
```
@file.md (§ Section Title)
@file.md (§ Parent → Child section)
```

**Line references:**
```
@file.py (lines 1-100 for [description])
@file.ts (full file, 209 lines)
```

---

### Iteration-Based Memory Files

For multi-iteration projects, use iteration-specific memory files to avoid bloat:

```
docs/ai_docs/
├── AI_LOG_user_understanding_20251230.md    # Cumulative log
├── AI_MEMORY_short_term-iter1.md            # Iteration 1 patterns
├── AI_MEMORY_short_term-iter2.md            # Iteration 2 patterns
└── AI_MEMORY_short_term-iter3.md            # Iteration 3 patterns
```

This allows:
- Clean context for each iteration
- Easy rollback if iteration fails
- Clear history of what worked

---

### Common Query Patterns

#### New Feature (Pattern 1)
```
Follow @guideline.md : Implement [feature]
Step 0: Read [plan section], [reference patterns]
Step 1: Create database schema
Step 2: Create API routes  
Step 3: Create UI components
Step 4: Verify & Summary
```

#### Bug Fix (Pattern 2)
```
Follow @guideline.md : Debug [issue]
Step 0: Read [relevant code], create bug report in user log
Step 1: Reproduce & diagnose
Step 2: Locate root cause
Step 3: Implement fix
Step 4: Verify fix, update memory
```

#### Documentation (Pattern 4)
```
Follow @guideline.md : Update docs after [change]
Step 0: Read doc standards, identify affected files
Step 1: Review code changes
Step 2: Update documentation
Step 3: Validate examples, update memory
```

---

### Anti-Patterns to Avoid

❌ **Vague preparation:**
```
Step 0: Read the guidelines
```

✅ **Specific preparation:**
```
Step 0: Preparation
- Read @kendo-translation/development_guideline.md (§ Core Principles)
- Read @kendo-translation/reference_docs.md (§2.4 JA-EN Specialist Features)
```

❌ **Ambiguous task:**
```
Step 1: Implement authentication
```

✅ **Detailed task:**
```
Step 1: Supabase Auth
- Install @supabase/ssr, @supabase/supabase-js
- Create lib/supabase.ts (client initialization pattern from reference_docs.md)
- Implement login page with email/password form
- Implement logout functionality
```

❌ **No verification:**
```
Step 3: Done
```

✅ **Clear verification:**
```
Step 5: Verify & Summary
- Test: login → navigate to article → translate → save → verify saved
- Update AI_MEMORY_short_term-iter2.md
- Suggest: "Ready for Iteration 3: Real Data"
```

---

### Testing Query Templates

Based on the Iteration 2 testing process, use these patterns for comprehensive verification:

#### Browser-Based Testing (Primary)
```
Test the [ITERATION_NAME] core flows:

1. Navigate to [BASE_URL]
2. Verify [PAGE_NAME] loads with [EXPECTED_ELEMENTS]
3. Click on "[LINK_TEXT]" link
4. Verify [EXPECTED_BEHAVIOR]
5. Report findings:
   - Did [component] load correctly?
   - Were you able to [perform action]?
   - Any errors observed?
```

**Example (Iteration 2):**
```
Test the Iteration 2 core flows:

1. Navigate to http://localhost:3000
2. Verify home page loads with navigation header
3. Click on "Articles" link
4. Verify articles list shows 3 sample articles from database
5. Click on "Translate" link
6. Verify redirect to /login (protected route)
7. Report: Did articles load from Supabase? Did middleware protection work?
```

#### Login/Auth Flow Testing
```
Test the login and [FEATURE] flow:

1. Navigate to http://localhost:3000/login
2. Enter email: [TEST_EMAIL] and password: [TEST_PASSWORD]
3. Click "[SIGN_IN/SIGN_UP]" button
4. If success, navigate to [PROTECTED_ROUTE]
5. Verify [AUTHENTICATED_BEHAVIOR]
6. Report: Did auth work? Did protected route become accessible?
```

#### Data Verification Testing
```
Verify [DATA_TYPE] imported correctly:

1. Navigate to http://localhost:3000/[ROUTE]
2. Verify [COUNT] items displayed
3. Search for "[SAMPLE_TERM]"
4. Verify expected result: [EXPECTED_MATCH]
5. Report: Did data load? Did search work?
```

#### Key Testing Insights from Iteration 2
- **Supabase Email Confirmation**: May need to disable in Supabase Dashboard → Authentication → Providers → "Confirm email" toggle for local testing
- **Protected Routes**: Test both unauthenticated (should redirect) and authenticated (should allow) access
- **CRUD Verification**: After saving, navigate away and back to verify data persisted
- **Browser Recording**: All browser tests are automatically recorded as .webp files for review

----

+ Building a tag based database
    + Kendo involve specific terms/tags and expressions
    + Use it to improve retrieval and translation
    + 

+ Build v2
    Step 1: database
    Step 2: Agent
    Step 3: UI

+ 


+ Create termonilogy database based on MAC-RAG/data/terminology/Kendo_Glossary.pdf
MAC-RAG/data/terminology/Kendo Japanese-English Dictionary.pdf

+ Create uv env for the project

+ start phase 1 of the implementation process. Use data from `data_crawler` to create the database (en, jp and en-jp).

---

Follow @0_core_guidelines.md : start Phase 2: Agent Framework (BaseAgent, Coordinator, Analysis, Retrieval, Translation Agents)
Step 0: Do all preparation steps (read all #0_core_guidelines.md, create or update the latest user understanding log, create or update centralized configs, create or update ai short term memory)
Step 1: Phase 1 Summary
Step 2: Start Phase 2
Step 3: Do final summary steps (failure-focused summary, update short term memory, next use command suggestion)


---

Follow @0_core_guidelines.md : Phase 2 Documentation and Notebook Tutorial (alway add ToC at the beginning)
Step 0: Do all preparation steps (read all #0_core_guidelines.md, create or update the latest user understanding log, create or update centralized configs, create or update ai short term memory)
Step 1: Phase 2 Documentation: Create an API documentation for the project
Step 2: Notebook Tutorial: Create a detailed notebook tutorial for the project, demonstrating all of the implementation until now.
Step 3: Do final summary steps (failure-focused summary, update short term memory, next use command suggestion)


--- 

Follow @0_core_guidelines.md : Proceed to Phase 3 Quality Loop
Step 0: Do all preparation steps (read all #0_core_guidelines.md, create or update the latest user understanding log, create or update centralized configs, create or update ai short term memory)
Step 1: Review MAC-RAG/docs/implementation_plan.md
Step 2: Proceed to Phase 3 Quality Loop
Step 3: Update API documentation
Step 4: Update Notebook Tutorial
Step 5: Do final summary steps (failure-focused summary, update short term memory, next use command suggestion)






----

## 🎯 Kendo Translation - AI Coder User Messages

**Project Root**: `/Users/nghiango-mbp/git_repo/kendo-translation/`  
**Guidelines**: `@kendo-translation/development_guideline.md`  
**Plan**: `@kendo-translation/implementation_plan.md`  

---

### Iteration 1: Skeleton (Day 1-2)

```
Follow @kendo-translation/development_guideline.md : Start Iteration 1 - Project Skeleton

Step 0: Preparation
- Read @kendo-translation/development_guideline.md (full file, especially § Core Principles)
- Read @kendo-translation/implementation_plan.md (Iteration 1 section)
- Read @kendo-translation/project_description.md (Tech Stack section)
- Create docs/ai_docs/AI_LOG_user_understanding_20251230.md
- Create docs/ai_docs/AI_MEMORY_short_term-iter1.md

Step 1: Initialize monorepo
- Create packages/web/ using: npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --no-src-dir
- Create supabase/migrations/ directory

Step 2: Database skeleton
- Reference @kendo-translation/implementation_plan.md "Database Schema (Progressive)" section
- Create minimal schema: users (id, email), articles (id, title)

Step 3: Placeholder pages
- Create app/page.tsx ("Welcome to Kendo Translation" hero)
- Create app/articles/page.tsx, app/videos/page.tsx, app/translate/page.tsx, app/login/page.tsx
- All with placeholder content

Step 4: Verify & Summary
- Run npm run dev, verify all routes render
- Update AI_MEMORY_short_term-iter1.md with success patterns
- Suggest: "Ready for Iteration 2: Core Flows"
```

---

### Iteration 2: Core Flows (Day 3-5)

```
Follow @kendo-translation/development_guideline.md : Start Iteration 2 - Core Flows

Step 0: Preparation
- Read @kendo-translation/development_guideline.md (§ Coding Standards → Supabase Patterns)
- Read @kendo-translation/reference_docs.md (§3 youtube_note Deep Dive → JWT Authentication, Supabase Query Patterns)
- Read @youtube_note/server-supabase.js (lines 1-100 for auth patterns)
- Update docs/ai_docs/AI_LOG_user_understanding_20251230.md

Step 1: Supabase Auth
- Install @supabase/ssr, @supabase/supabase-js
- Create lib/supabase.ts (client initialization pattern from reference_docs.md)
- Implement login page with email/password form
- Implement logout functionality

Step 2: Articles CRUD
- Create app/api/articles/route.ts (GET list, POST create)
- Create app/api/articles/[id]/route.ts (GET single)
- Update app/articles/page.tsx to fetch and display list
- Create app/articles/[id]/page.tsx for detail view

Step 3: Translation Editor
- Create components/TranslationEditor.tsx
- Include: source text display, target text textarea, save button
- Create app/api/articles/[id]/translate/route.ts (PUT to save translation)

Step 4: Protected Routes
- Create middleware.ts for route protection
- Protect /translate/* routes

Step 5: Verify & Summary
- Test: login → navigate to article → translate → save → verify saved
- Update AI_MEMORY_short_term.md
- Suggest: "Ready for Iteration 3: Real Data"
```

---

### Iteration 3: Real Data (Day 6-8)

```
Follow @kendo-translation/development_guideline.md : Start Iteration 3 - Real Data Integration

Step 0: Preparation
- Read @kendo-translation/reference_docs.md (§2.5 Data Assets to Copy)
- Read @kendo-translation/reference_docs.md (§3 youtube_note → Video Player pattern)
- Locate data sources:
  - @mARTr/data_crawler/kendo_jidai/output/*.json (315 article pairs)
  - @mARTr/MAC-RAG/data/terminology/kendo_terms.json (1000+ terms)
  - @mARTr/MAC-RAG/data/onomatopoeia.json
- Update user log

Step 1: Import Script
- Create scripts/import-articles.ts
- Parse JSON files from mARTr/data_crawler/kendo_jidai/output/
- Extract: title, content_ja, content_en, source_url, tags

Step 2: Import Articles
- Run import script against Supabase
- Verify 315 articles imported
- Update schema: add content_ja, content_en, source_url, tags columns

Step 3: Import Terminology
- Create terminology table (source_term, target_term, reading, domain)
- Import kendo_terms.json and onomatopoeia.json

Step 4: Video Player
- Reference @youtube_note/index.html for player pattern
- Create app/videos/[id]/page.tsx with YouTube IFrame
- Create video_notes table
- Implement timestamped notes (start_time, end_time, text)

Step 5: Terminology Page
- Create app/terminology/page.tsx
- Implement search/filter functionality

Step 6: Verify & Summary
- Verify: 315 articles visible, video notes save correctly, term search works
- Update memory
- Suggest: "Ready for Iteration 4: AI Translation"
```

---

### Iteration 4: AI Translation (Day 9-12)

```
Follow @kendo-translation/development_guideline.md : Start Iteration 4 - AI Translation

Step 0: Preparation
- Read @kendo-translation/reference_docs.md (§1.3 LLM Provider - INHERIT COMPLETELY)
- Read @mARTr/annotation_platform/src/lib/llm/provider.ts (full file, 209 lines)
- Read @kendo-translation/reference_docs.md (§2.4 JA-EN Specialist Features)
- Read @mARTr/MAC-RAG/src/agents/ja_en_specialist.py (lines 1-100 for patterns)
- Update user log

Step 1: Port LLM Provider
- Create lib/llm/provider.ts
- Implement OpenAIProvider, OpenRouterProvider classes
- Implement agentChat() function
- Add to .env.example: LLM_PROVIDER, OPENROUTER_API_KEY

Step 2: Translation API
- Create app/api/translate/suggest/route.ts
- Accept: source_text, context
- Return: translation, confidence, suggestions

Step 3: AI Suggestion Button
- Update components/TranslationEditor.tsx
- Add "Get AI Suggestion" button
- Show loading state during API call
- Display suggestion with accept/reject options

Step 4: JA-EN Specialist
- Implement subject resolution (identify omitted subjects)
- Implement honorific handling (先生 → -sensei toggle)
- Implement onomatopoeia rendering (use onomatopoeia.json)
- Display JA-EN features in UI

Step 5: Quality Scoring
- Implement basic reflection (score 0-1)
- Display score in TranslationEditor
- Store quality_score in database

Step 6: Verify & Summary
- Test: click AI Suggestion → translation appears → JA-EN features visible → score displayed
- Update memory
- Suggest: "Ready for Iteration 5: Translation Memory"
```

---

### Iteration 5: Translation Memory (Day 13-15)

```
Follow @kendo-translation/development_guideline.md : Start Iteration 5 - RAG and Translation Memory

Step 0: Preparation
- Read @kendo-translation/reference_docs.md (§2 MAC-RAG Deep Dive → Agent Pipeline)
- Read @mARTr/MAC-RAG/src/db/vector.py (ChromaDB patterns)
- Read @mARTr/MAC-RAG/src/agents/retrieval.py (retrieval patterns)
- Locate TM data: @mARTr/MAC-RAG/mac_rag.db (1,264 translation memory entries)
- Update user log

Step 1: Import Translation Memory
- Export TM entries from mac_rag.db
- Create translation_memory table (source_text, target_text, quality, domain, embedding)
- Import 1,264 entries

Step 2: Vector Embeddings
- Enable pg_vector extension in Supabase
- Create embeddings for TM entries using OpenAI embeddings API
- Store in translation_memory.embedding column

Step 3: Similarity Search
- Create app/api/tm/search/route.ts
- Implement cosine similarity search
- Return top 5 matching TM entries

Step 4: TM Panel
- Update components/TranslationEditor.tsx
- Add TM Panel sidebar showing similar past translations
- Display: source, target, quality score, similarity %

Step 5: Terminology Enforcement
- Highlight matching terms in source text
- Flag if required terms missing in target text
- Add quick-insert button for terms

Step 6: Verify & Summary
- Test: TM matches appear → terms highlighted → AI uses correct terminology
- Update memory
- Suggest: "Ready for Iteration 6: User Experience"
```

---

### Iteration 6: User Experience (Day 16-18)

```
Follow @kendo-translation/development_guideline.md : Start Iteration 6 - UX Polish

Step 0: Preparation
- Read @kendo-translation/reference_docs.md (§1.4 UI Components to Inherit)
- Read @mARTr/annotation_platform/src/app/page.tsx (dashboard patterns)
- Review current implementation state
- Update user log

Step 1: Reading Progress
- Create reading_progress table
- Track: user_id, content_type, content_id, progress_percentage, last_position
- Save progress on scroll/exit

Step 2: Bookmarks
- Create bookmarks table
- Add bookmark button to articles and videos
- Create "My Bookmarks" page

Step 3: Translator Dashboard
- Create app/dashboard/page.tsx
- Show: translations per day chart, total translations, quality average
- Use StatCard pattern from annotation_platform

Step 4: Theme Toggle
- Implement dark/light mode
- Store preference in localStorage
- Use Tailwind dark: classes

Step 5: Mobile Responsive
- Test all pages on mobile viewport
- Fix layout issues
- Ensure touch-friendly interactions

Step 6: Keyboard Shortcuts
- Cmd/Ctrl+S to save
- Cmd/Ctrl+Enter to submit AI suggestion
- Arrow keys for next/previous article

Step 7: Verify & Summary
- Test: progress persists, bookmarks work, dark mode works, mobile layout good
- Update memory
- Suggest: "Ready for Iteration 7: Production"
```

---

### Iteration 7: Production (Day 19-21)

```
Follow @kendo-translation/development_guideline.md : Start Iteration 7 - Production

Step 0: Preparation
- Read @kendo-translation/reference_docs.md (§3.7 Render.yaml pattern)
- Read @youtube_note/render.yaml for deployment config
- Review all previous work: run tests, check for issues
- Update user log

Step 1: Performance Optimization
- Configure next.config.js for static export
- Optimize images with next/image
- Implement lazy loading for heavy components
- Add dynamic imports for translation features

Step 2: Lighthouse Audit
- Run: npx lighthouse http://localhost:3000 --output html
- Target: Performance > 90, Accessibility > 90
- Fix any flagged issues

Step 3: Error Tracking
- Set up Sentry (or similar)
- Add error boundary components
- Configure source maps for debugging

Step 4: API Documentation
- Create docs/api_reference.md
- Document all endpoints with request/response examples
- Include authentication requirements

Step 5: Final README
- Update README.md with complete setup instructions
- Add deployment guide section
- Include troubleshooting common issues

Step 6: Production Deploy
- Configure production environment variables
- Deploy frontend to GitHub Pages
- Deploy API to Render.com
- Verify all functionality in production

Step 7: Final Summary
- Verify: all tests pass, Lighthouse > 90, all features work in production
- Create walkthrough.md documenting completed work
- Celebrate! 🎉
```

---

## 🔧 Utility Commands

### Quick Start (New AI Coder)
```
Follow @kendo-translation/development_guideline.md : Project Onboarding

Step 0: Read these files in order:
1. @kendo-translation/project_description.md (vision, architecture)
2. @kendo-translation/implementation_plan.md (7 iterations, current progress)
3. @kendo-translation/reference_docs.md (inheritance from 3 projects)
4. @kendo-translation/development_guideline.md (coding standards)

Step 1: Check current state
- List directory structure
- Check which iteration is complete
- Review any existing docs/ai_docs/ files

Step 2: Summarize and suggest next action
```

### Debug Command
```
Follow @kendo-translation/development_guideline.md : Debug [ISSUE_DESCRIPTION]

Step 0: Preparation
- Read @kendo-translation/development_guideline.md (§ Workflow Reference → DEBUG)
- Read relevant source files related to the issue
- Create bug report entry in AI_LOG_user_understanding_YYYYMMDD.md

Step 1: Reproduce & Diagnose
- Reproduce the issue with exact steps
- Gather complete stack trace
- Check configuration state

Step 2: Locate Root Cause
- Use grep_search to find related code
- Trace data flow
- Identify the exact failure point

Step 3: Implement Fix
- Make minimal, targeted fix
- Follow existing code patterns
- Add error handling if needed

Step 4: Verify
- Run affected tests
- Test the original failure case
- Check for regressions

Step 5: Summary
- If success: brief summary, update memory
- If failure: comprehensive error report with reproduction steps
```

### Documentation Update
```
Follow @kendo-translation/development_guideline.md : Update docs after [CHANGE_DESCRIPTION]

Step 0: Preparation
- Read @kendo-translation/development_guideline.md (§ Documentation Standards)
- Identify all affected documentation files

Step 1: Code Review
- Review the code changes
- Identify user-facing changes
- Note any new configuration options

Step 2: Update Documentation
- Update README.md if features changed
- Update API docs if endpoints changed
- Update inline comments for complex logic
- Update implementation_plan.md to mark progress

Step 3: Validate
- Test any code examples in documentation
- Verify links work
- Check formatting

Step 4: Summary
- List files updated
- Update AI_MEMORY_short_term.md
```