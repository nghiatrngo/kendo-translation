# AI-Coder Short-Term Memory - Iteration 2

**Purpose**: Quick reference for successful patterns from Iteration 2  
**Last Updated**: 2025-12-30  
**Iteration**: 2 (Core Flows)  
**Status**: COMPLETE ✅

---

## 🎯 Completed Tasks

### Supabase Integration
- [x] Installed @supabase/ssr, @supabase/supabase-js
- [x] Created lib/supabase/client.ts (browser client)
- [x] Created lib/supabase/server.ts (server client)
- [x] Created lib/supabase/middleware.ts (session + protected routes)
- [x] Created middleware.ts (applies session to all routes)

### Authentication
- [x] Functional login page with Supabase Auth
- [x] Login/signup toggle
- [x] Protected /translate routes (redirect to login)
- [x] Fixed useSearchParams Suspense issue

### Articles CRUD
- [x] GET /api/articles (list all)
- [x] POST /api/articles (create, auth required)
- [x] GET /api/articles/[id] (single article)
- [x] PUT /api/articles/[id] (update, auth required)
- [x] PUT /api/articles/[id]/translate (save translation, auth required)

### Pages Updated
- [x] /articles - Fetches from Supabase, shows list
- [x] /articles/[id] - Bilingual detail view
- [x] /translate - Translation queue
- [x] /translate/[id] - Uses TranslationEditor component
- [x] /login - Functional auth form

### Components
- [x] TranslationEditor.tsx - Source/target display, save functionality

---

## 📁 Files Created (Iteration 2)

```
packages/web/
├── middleware.ts                           # Session refresh
├── lib/supabase/
│   ├── client.ts                          # Browser client
│   ├── server.ts                          # Server client
│   └── middleware.ts                      # Protected routes
├── components/
│   └── TranslationEditor.tsx              # Core translation UI
├── app/
│   ├── login/page.tsx                     # Auth form
│   ├── articles/
│   │   ├── page.tsx                       # List from DB
│   │   └── [id]/page.tsx                  # Detail view
│   ├── translate/
│   │   ├── page.tsx                       # Queue
│   │   └── [id]/page.tsx                  # Editor
│   └── api/
│       └── articles/
│           ├── route.ts                   # GET/POST
│           └── [id]/
│               ├── route.ts               # GET/PUT
│               └── translate/route.ts     # PUT save
└── .env.example                           # Config template
```

---

## ⚙️ Build Output

```
Route (app)
├ ○ /
├ ○ /_not-found
├ ƒ /api/articles
├ ƒ /api/articles/[id]
├ ƒ /api/articles/[id]/translate
├ ƒ /articles
├ ƒ /articles/[id]
├ ○ /login
├ ○ /terminology
├ ƒ /translate
├ ƒ /translate/[id]
└ ○ /videos

○  (Static)   5 pages
ƒ  (Dynamic)  7 pages
```

---

## 🔧 Key Patterns Learned

### Supabase Server Client Pattern
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data, error } = await supabase.from('table').select('*')
```

### Auth Check Pattern
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Protected Route Redirect
```typescript
// In middleware.ts
if (!user && isProtectedPath) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('redirectTo', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}
```

### useSearchParams Fix
```tsx
// Must wrap in Suspense to avoid build error
<Suspense fallback={<Loading />}>
  <ComponentUsingSearchParams />
</Suspense>
```

---

## 🎯 Next: Iteration 3 (Real Data)

**Ready for:**
```
Follow @kendo-translation/development_guideline.md : Start Iteration 3 - Real Data
```

**Key tasks:**
- Import 315 Kendo Jidai articles from data_crawler
- Import terminology (kendo_terms.json)
- Implement video player page
- Create terminology search
