# Kendo Translation Developer Guide

This guide helps developers set up, understand, and contribute to the Kendo Translation project.

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Environment Setup](#2-environment-setup)
3. [Development Workflow](#3-development-workflow)
4. [Adding Features](#4-adding-features)
5. [Deployment](#5-deployment)

---

## 1. Project Structure

```
kendo-translation/
├── packages/web/           # Next.js frontend
│   ├── app/                # App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── articles/   # Article CRUD
│   │   │   ├── translate/  # AI translation
│   │   │   └── tm/         # Translation Memory
│   │   ├── articles/       # Article pages
│   │   ├── dashboard/      # Stats dashboard
│   │   ├── terminology/    # Term search
│   │   ├── translate/      # Translation editor
│   │   └── videos/         # Video player
│   ├── components/         # React components
│   │   ├── TranslationEditor.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useKeyboardShortcuts.tsx
│   ├── lib/                # Utilities
│   │   ├── llm/            # LLM provider
│   │   ├── agents/         # JA-EN specialist
│   │   ├── supabase/       # DB client
│   │   └── data/           # Static data (onomatopoeia)
│   └── types/              # TypeScript types
├── docs/                   # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── USER_TUTORIAL.md
│   └── DEVELOPER_GUIDE.md
├── scripts/                # Import utilities
├── supabase/               # Database migrations
└── render.yaml             # Deployment config
```

---

## 2. Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter API key (for AI features)

### Local Development

```bash
# Clone repository
git clone https://github.com/nghiatrngo/kendo-translation.git
cd kendo-translation

# Install dependencies
cd packages/web
npm install

# Configure environment
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local`:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for AI translation
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
```

### Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 3. Development Workflow

### Build & Test

```bash
# Type check
npm run build

# Development
npm run dev

# Lint
npm run lint
```

### Database Changes

1. Create migration in `supabase/migrations/`
2. Apply via Supabase Dashboard or CLI
3. Test locally

---

## 4. Adding Features

### New Page

1. Create folder in `app/your-feature/`
2. Add `page.tsx` with component
3. Add link to `layout.tsx` navigation

### New API Route

1. Create folder in `app/api/your-feature/`
2. Add `route.ts` with handlers
3. Document in `docs/API.md`

### Example API Route

```typescript
// app/api/example/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from('your_table')
        .select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
```

### Component Patterns

Follow existing patterns:
- Use ThemeProvider for dark mode
- Use ErrorBoundary for error handling
- Use hooks for keyboard shortcuts

---

## 5. Deployment

### Render.com (Automatic)

1. Push to `master` branch
2. Render auto-deploys via `render.yaml`
3. Environment variables set in Render Dashboard

### Manual Deploy

```bash
# Build
cd packages/web
npm run build

# Start production
npm start
```

### Production URLs

- **App**: https://kendo-translation.onrender.com
- **GitHub**: https://github.com/nghiatrngo/kendo-translation
- **Supabase**: https://supabase.com/dashboard/project/mbgmyvmsvenvtecvrjia

---

## Code Patterns

### Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### LLM Provider

```typescript
import { agentChat } from '@/lib/llm/provider';

const response = await agentChat('translation', [
    { role: 'user', content: 'Translate: 剣道' }
]);
```

### Dark Mode

```typescript
import { useTheme } from '@/components/ThemeProvider';

const { theme, setTheme, resolvedTheme } = useTheme();
```

---

*Questions? Open an issue on [GitHub](https://github.com/nghiatrngo/kendo-translation)*
