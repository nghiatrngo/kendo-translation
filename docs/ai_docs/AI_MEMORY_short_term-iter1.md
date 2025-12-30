# AI-Coder Short-Term Memory - Iteration 1

**Purpose**: Quick reference for successful patterns, preferences, and frequent operations  
**Last Updated**: 2025-12-30  
**Iteration**: 1 (Project Skeleton)  
**Line Count**: ~50/1000

---

## 🎯 Critical Context

### Project Overview
- **Name**: kendo-translation
- **Vision**: Unified web platform for translating Kendo resources (JP→EN)
- **Approach**: Breadth-First Development (skeleton first, then depth)

### Tech Stack (Iteration 1)
| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 + Tailwind CSS |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (planned Iteration 2) |
| Deploy | GitHub Pages + Render (planned) |

---

## ⚙️ Iteration 1 Tasks

### Goals
- [ ] App runs with `npm run dev`
- [ ] All routes render (even placeholders)
- [ ] Database schema created
- [ ] Ready for deployment skeleton

### File Structure (Target)
```
kendo-translation/
├── packages/web/
│   ├── app/
│   │   ├── page.tsx           # Welcome hero
│   │   ├── articles/page.tsx  # Placeholder
│   │   ├── videos/page.tsx    # Placeholder
│   │   ├── translate/page.tsx # Placeholder
│   │   ├── login/page.tsx     # Placeholder
│   │   └── layout.tsx         # Header + nav
│   └── package.json
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
└── docs/ai_docs/
```

---

## 📁 Frequent Operations

### Commands
```bash
# Development
cd packages/web && npm run dev

# Create Next.js app (already done)
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app

# Git commit
git add . && git commit -m "feat: iteration 1 - project skeleton"
```

### Key Paths
- project root: `/Users/nghiango-mbp/git_repo/kendo-translation/`
- web app: `packages/web/`
- migrations: `supabase/migrations/`
- ai docs: `docs/ai_docs/`

---

## 🔧 Project Conventions

### Breadth-First Rule
> Build skeleton across ALL layers first, then add depth

```
❌ Wrong: Complete all database → Complete all API → Complete all UI
✅ Right: Basic table + Basic route + Basic UI → Add depth → Add more
```

### Naming
- Components: PascalCase (e.g., `ArticleCard.tsx`)
- Routes: lowercase with app router (e.g., `app/articles/page.tsx`)
- SQL files: numbered with description (e.g., `001_initial.sql`)

---

## 📊 Status

### Completed ✅
- [x] Created docs/ai_docs/ directory
- [x] Created AI_LOG_user_understanding_20251230.md
- [x] Created AI_MEMORY_short_term-iter1.md
- [x] Initialized packages/web with Next.js 16.1.1 + Tailwind + TypeScript
- [x] Created layout.tsx with navigation header
- [x] Created app/page.tsx (hero, features, stats)
- [x] Created app/articles/page.tsx (placeholder)
- [x] Created app/videos/page.tsx (placeholder)
- [x] Created app/translate/page.tsx (placeholder with mock editor)
- [x] Created app/login/page.tsx (placeholder with mock form)
- [x] Created app/terminology/page.tsx (placeholder with sample terms)
- [x] Created supabase/migrations/001_initial.sql (users, articles tables)
- [x] Built successfully with `npm run build`

### Routes Verified
```
Route (app)
├ ○ /
├ ○ /articles
├ ○ /login
├ ○ /terminology
├ ○ /translate
└ ○ /videos
```

### Success Patterns
- **create-next-app command**: `npx -y create-next-app@latest web --typescript --tailwind --eslint --app --no-src-dir --use-npm`
- **Build time**: ~5 seconds total
- **All 6 routes** render as static pages

---

## 🎯 Next: Iteration 2 (Core Flows)

**Ready for:**
```
Follow @kendo-translation/development_guideline.md : Start Iteration 2 - Core Flows
```

**Key tasks:**
- Supabase Auth integration
- Articles CRUD
- TranslationEditor component
- Protected routes middleware
