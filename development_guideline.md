# Kendo Translation - AI Coder Development Guidelines

**Purpose**: Operational guidelines for AI coders working on the kendo-translation project  
**Adapted from**: MAC-RAG ai_docs  
**Last Updated**: January 12, 2025

---

## 🎯 Quick Start

**Before starting any task:**

1. Read this entire file
2. Update `AI_MEMORY_short_term.md` with key takeaways
3. Log your understanding to `AI_LOG_user_understanding_YYYYMMDD.md`
4. Follow the breadth-first development approach (see `implementation_plan.md`)

---

## 📋 Table of Contents

### 1. [§ Core Principles](#-core-principles)

### 2. [§ Project Context](#-project-context)

### 3. [§ Workflow Reference](#-workflow-reference)

### 4. [§ Coding Standards](#-coding-standards)

### 5. [§ Testing Philosophy](#-testing-philosophy)

### 6. [§ Documentation Standards](#-documentation-standards)

### 7. [§ User Communication](#-user-communication)

### 8. [§ File Organization](#-file-organization)

---

## § Core Principles

### 0.1 Context-First Approach

**Always gather complete context before taking action:**

- Read `project_description.md` and `implementation_plan.md` for project context
- Review `reference_docs.md` for inherited patterns from annotation_platform, MAC-RAG, youtube_note
- Check existing code patterns before implementing new features
- Search for similar implementations first (`grep_search`, `file_search`)

### 0.2 Breadth-First Development

**THIS PROJECT FOLLOWS BREADTH-FIRST DEVELOPMENT:**

- Build skeleton across all layers first (frontend + backend + database)
- Get working prototypes early, then add depth
- Each iteration should touch multiple layers
- Never go deep on one feature before the full stack works

```
❌ Wrong: Complete all database tables → Complete all API routes → Complete all UI
✅ Right: Basic table + Basic route + Basic UI → Add depth → Add more depth
```

### 0.3 Incremental Changes

**Make small, focused changes that can be verified:**

- One feature per commit
- Test after each change
- Maintain a working state at all times
- Break large tasks into 1-3 hour milestones

### 0.4 Configuration Centralization

**Never hardcode values:**

- All environment variables in `.env` (see `.env.example`)
- All runtime config in centralized config files
- Reference paths in documentation

### 0.5 Test-Driven Validation

**Validate all changes:**

- Run existing tests before and after changes
- Add tests for new functionality
- Zero tolerance for failing tests

### 0.6 Documentation Alignment

**Keep docs synchronized:**

- Update `README.md` when features change
- Update `implementation_plan.md` as work progresses
- Document all API endpoints

---

## § Project Context

### Tech Stack

| Component     | Technology                | Reference           |
| ------------- | ------------------------- | ------------------- |
| Frontend      | Next.js 14 + Tailwind CSS | annotation_platform |
| Backend       | Next.js API Routes        | annotation_platform |
| Database      | Supabase PostgreSQL       | youtube_note        |
| Auth          | Supabase Auth             | youtube_note        |
| Translation   | OpenRouter LLM            | MAC-RAG             |
| Vector Search | Supabase pg_vector        | MAC-RAG             |

### Key Reference Projects

1. **annotation_platform**: UI patterns, LLM provider, agent orchestration
2. **MAC-RAG**: Translation agents, JA-EN specialist, terminology data
3. **youtube_note**: Supabase patterns, Express API, JWT auth, deployment

### File Locations

```
kendo-translation/
├── packages/
│   └── web/                    # Next.js application
├── docs/
│   ├── project_description.md  # Project vision
│   ├── implementation_plan.md  # Breadth-first plan
│   ├── reference_docs.md       # Inheritance map
│   └── ai_docs/                # AI coder artifacts
├── supabase/
│   └── migrations/             # Database migrations
├── scripts/                    # Automation scripts
└── README.md                   # Quick start
```

---

## § Workflow Reference

### Quick Selection

| User Intent                | Workflow           |
| -------------------------- | ------------------ |
| "Plan a feature..."        | **PLAN**           |
| "Create a new..."          | **NEW**            |
| "Add / update / remove..." | **REVISE**         |
| "Fix the bug..."           | **DEBUG**          |
| "Refactor / optimize..."   | **REFACTOR**       |
| "Run the tests..."         | **RUN_TESTBED**    |
| "Create tests for..."      | **CREATE_TESTBED** |
| "Understand the code..."   | **CODE_REVIEW**    |
| "Review the docs..."       | **DOC_REVIEW**     |

### Workflow Process Template (4 Steps)

Every workflow follows this pattern:

**Step 0: Understand & Log**

```markdown
Log to: docs/ai_docs/AI_LOG_user_understanding_YYYYMMDD.md

Entry:

- User's original request
- AI's interpretation of intent
- Brief action plan
- Workflow being executed
```

**Step 1: Gather Context**

- Read relevant files
- Check existing patterns
- Understand dependencies
- Review configuration

**Step 2: Execute Action**

- Make changes incrementally
- Follow existing code style
- Handle errors properly
- Use configuration (no hardcoding)

**Step 3: Validate & Report**

- Run tests
- Verify functionality
- Update documentation
- Report results (brief for success, comprehensive for failure)

---

## § Coding Standards

### Next.js / TypeScript

**File Structure:**

```typescript
// 1. Imports (external → internal → relative)
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ArticleCard } from "@/components/ArticleCard";

// 2. Type definitions
interface Article {
  id: string;
  title: string;
  content_ja: string;
  content_en?: string;
}

// 3. Component or API route
export async function GET(req: NextRequest) {
  // Implementation
}
```

**Naming Conventions:**

- Components: `PascalCase` (e.g., `ArticleCard.tsx`)
- Utilities: `camelCase` (e.g., `formatDate.ts`)
- API routes: `route.ts` in appropriate directory
- Constants: `UPPER_SNAKE_CASE`

**Component Pattern:**

```tsx
// Use React Server Components by default
export default async function ArticlesPage() {
  const articles = await fetchArticles();

  return (
    <div className="container mx-auto p-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

### Supabase Patterns (from youtube_note)

**Client Initialization:**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

**Query Patterns:**

```typescript
// Read with filter
const { data, error } = await supabase
  .from("articles")
  .select("*")
  .eq("status", "published")
  .order("created_at", { ascending: false });

// Insert
const { data, error } = await supabase
  .from("articles")
  .insert([{ title, content_ja }])
  .select()
  .single();

// Update with ownership check
const { data, error } = await supabase
  .from("articles")
  .update({ content_en })
  .eq("id", id)
  .eq("translator_id", userId)
  .select();
```

### LLM Integration (from annotation_platform)

**Provider Pattern:**

```typescript
import { agentChat } from "@/lib/llm/provider";

// Basic call
const response = await agentChat(
  "translation",
  [
    { role: "system", content: "You are a Kendo translation specialist..." },
    { role: "user", content: sourceText },
  ],
  {
    temperature: 0.3,
    responseFormat: "json",
    // Optional: Metadata for logging (propagates to agent_logs table)
    articleId: "uuid-of-article", // Links log to specific article
    videoId: "uuid-of-video", // Links log to specific video
  }
);
```

**Agent Types:** `'translation'`, `'analysis'`, `'reflection'`, `'ja_en_specialist'`

---

## § Testing Philosophy

### Testbed Structure

```
tests/
├── unit/                       # Unit tests
│   └── components/
├── integration/                # API integration tests
│   └── api/
└── e2e/                        # End-to-end tests (optional)
```

### Test Patterns

```typescript
// tests/unit/components/ArticleCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ArticleCard } from "@/components/ArticleCard";

describe("ArticleCard", () => {
  it("renders article title", () => {
    const article = { id: "1", title: "Test Article" };
    render(<ArticleCard article={article} />);
    expect(screen.getByText("Test Article")).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- ArticleCard.test.tsx

# Run with coverage
npm test -- --coverage
```

### Progressive Testing (from MAC-RAG)

1. **Sample scale (8-10)**: Quick validation
2. **Medium scale (100)**: Broader coverage
3. **Large scale (1000+)**: Full validation

---

## § Documentation Standards

### AI-Generated Files Naming

```
AI_[TYPE]_[description]_YYYYMMDD.md

Types:
- LOG: User understanding logs
- PLAN: Implementation plans
- DOC: Generated documentation
- ANALYSIS: Code analysis results
```

### Documentation Updates Required

When changing code, update:

1. `README.md` - If features change
2. Inline comments - For complex logic
3. `implementation_plan.md` - Mark tasks complete

### API Documentation Format

````markdown
### POST /api/articles

**Description**: Create a new article

**Authentication**: Required

**Request Body**:

```json
{
  "title": "string",
  "content_ja": "string"
}
```
````

**Response**:

```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "timestamp"
}
```

````

---

## § User Communication

### Feedback Response
| User Feedback | AI Action |
|---------------|-----------|
| "Good" / "Continue" | Proceed to next step, maintain approach |
| "Bad" / "Don't do it" | STOP, log misunderstanding, ask for clarification |
| "proceed" | Continue from last checkpoint |
| "proceed until done" | Work autonomously through all phases |

### Reporting Standards

**Success (Brief):**
```markdown
## ✅ Success Summary
**Task**: Implement article list
**Status**: Completed successfully
- All tests passing (12/12)
- API endpoint functional
- Documentation updated
````

**Failure (Comprehensive):**

```markdown
## ❌ Failure Report

**Task**: User authentication
**Error**: Supabase connection failed

### Stack Trace

[Complete error message]

### Root Cause

Missing SUPABASE_URL in .env

### Fix

Add SUPABASE_URL=https://xxx.supabase.co to .env file
```

---

## § File Organization

### Size Limits

- **Target**: 200-300 lines per file
- **Maximum**: 500 lines
- **Action when exceeded**: Split by logical concerns

### Directory Structure (Progressive)

**Iteration 1-2:**

```
packages/web/src/
├── app/
│   ├── page.tsx
│   ├── articles/page.tsx
│   └── videos/page.tsx
└── lib/
    └── supabase.ts
```

**Iteration 4+:**

```
packages/web/src/
├── app/
│   ├── page.tsx
│   ├── articles/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── videos/
│   ├── translate/
│   └── api/
│       ├── articles/route.ts
│       └── translate/route.ts
├── components/
│   ├── ui/
│   └── translation/
├── lib/
│   ├── supabase.ts
│   └── llm/provider.ts
└── types/
    └── index.ts
```

---

## § Memory Management

### AI_MEMORY_short_term.md

Location: `docs/ai_docs/AI_MEMORY_short_term.md`

**Update when:**

- After reading guidelines
- Received "Good" feedback
- Discovered project patterns
- Completed significant milestones

**Structure:**

```markdown
# AI-Coder Short-Term Memory

**Last Updated**: YYYY-MM-DD
**Line Count**: XXX/1000

## 🎯 Critical Success Patterns

[Patterns with "Good" feedback]

## ⚙️ User Preferences

[Validated preferences]

## 📁 Frequent Operations

[Common commands and paths]
```

---

## § Quick Reference

### Common Commands

```bash
# Development
cd packages/web && npm run dev

# Testing
npm test

# Linting
npm run lint

# Build
npm run build
```

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# LLM
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-...

# Optional
NODE_ENV=development
```

### Workflow Chaining Patterns

| Pattern     | Use Case            | Workflows                                                          |
| ----------- | ------------------- | ------------------------------------------------------------------ |
| New Feature | Build new component | PLAN → CODE_REVIEW → NEW → CREATE_TESTBED → RUN_TESTBED → WRITE    |
| Bug Fix     | Fix reported issue  | TEST_REVIEWING → CODE_REVIEW → DEBUG → RUN_TESTBED → REVISE        |
| Refactor    | Improve structure   | CODE_REVIEW → PLAN → RUN_TESTBED → REFACTOR → RUN_TESTBED → REVISE |

---

## § Anti-Patterns to Avoid

❌ Asking permission before using tools  
❌ Overly verbose during execution  
❌ Massive files (>500 lines)  
❌ Copy-pasting code  
❌ Hard-coding config  
❌ Updating code without docs  
❌ Ignoring test failures  
❌ Depth-first development  
❌ Continuing when user says "kill"

---

**Summary Philosophy:**

> Breadth-first | Incremental | Test-driven | Config-centralized | Well-documented

---

_Guidelines created: December 30, 2024_
