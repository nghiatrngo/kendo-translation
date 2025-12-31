# TODO:

[] ROLE SPECIFIC VIEW


- TRANSLATOR VIEW:
- ADMIN VIEW:
    + TRANSLATOR VIEW with and additional ADMIN TABS
- READER VIEW:
    - TRANSLATOR VIEW BUT without on TRANSLATION TAB
    - READ ONLY, NO MODIFICATION

- 



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




---

Follow @kendo-translation/development_guideline.md : Continue Testinng

Step 0: Preparation & Analysis
- Read @kendo-translation/development_guideline.md (full file, all sections)
- Read @kendo-translation/implementation_plan.md (all iterations and current status)
- Read @kendo-translation/project_description.md (vision, architecture, tech stack)
- Read @kendo-translation/reference_docs.md (inheritance patterns from 3 projects)
- Review current documentation state:
  - @kendo-translation/README.md
  - @kendo-translation/docs/API.md
  - @kendo-translation/docs/ARCHITECTURE.md
  - @kendo-translation/docs/DEVELOPER_GUIDE.md
  - @kendo-translation/docs/USER_TUTORIAL.md
- Update docs/ai_docs/AI_LOG_user_understanding_YYYYMMDD.md




Step 1: Tesing user roles
+ Create an admin user (email: admin-1@test.com, password: !12345678!)
    + Review all admin views and actions
+ Create a translator user (email: translator-1@test.com, password: !12345678!)
    + Review all translator views and actions
+ Create a reader user (email: reader-1@test.com, password: !12345678!)
    + Review all reader views and actions
+ Test login/logout for all users
+ Require login before view any page


Step 2: Test using video
+ Load a youtube video `https://www.youtube.com/watch?v=_A38CHmgmM0`
+ Test all features of the video tabs: Playing, noting, bookmark, real time transcript viewing



Step 4: Final Summary
- Update debug_progress
- Update AI_MEMORY 
- Suggest next steps




-----


# Next Steps Query

Update all project documentation based on today's testing session:

1. **Update `docs/debug_progress.md`** with:
   - Fixed RLS infinite recursion in `profiles` table
   - Fixed `/api/video-notes` user_id handling
   - Fixed RLS policies for `video_notes` table
   - All user role tests passing (admin, translator, reader)
   - Video features E2E working (add/list/delete notes)

2. **Update `docs/ai_docs/AI_MEMORY_short_term.md`** with:
   - Current project status
   - Key patterns learned (RLS policy fixes, API route auth patterns)
   - Test user credentials for future reference

3. **Commit all changes** with descriptive commit message summarizing:
   - Bug fixes (RLS, API routes)
   - New test scripts
   - Documentation updates