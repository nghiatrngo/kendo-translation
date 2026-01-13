# Testing Guide

## Overview

Kendo Translation uses manual testing and Node.js scripts for API-level E2E testing. Browser automation is available for UI verification.

---

## Manual Testing Checklist

### Core Routes

- [x] `/` - Landing page loads
- [x] `/articles` - Article list displays
- [x] `/articles/[id]` - Article detail shows JP/EN content
- [x] `/videos` - Video list displays
- [x] `/videos/[id]` - Video player works
- [x] `/terminology` - Term search works
- [x] `/translate` - Translation list shows
- [x] `/translate/[id]` - Editor loads with AI button
- [x] `/translate/mac-rag` - MAC-RAG queue loads
- [x] `/translate/mac-rag/[id]` - MAC-RAG translation works
- [x] `/dashboard` - Stats display
- [x] `/bookmarks` - Bookmark list works
- [x] `/admin` - Admin panel (admin only)
- [x] `/login` - Auth works

### API Endpoints

```bash
# Test articles
curl http://localhost:3000/api/articles

# Test TM search
curl -X POST http://localhost:3000/api/tm/search \
  -H "Content-Type: application/json" \
  -d '{"source_text": "剣道"}'

# Test context retrieval
curl -X POST http://localhost:3000/api/context/retrieve \
  -H "Content-Type: application/json" \
  -d '{"sourceText": "剣道の基本", "sourceLang": "ja", "targetLang": "en"}'

# Test agent logs
curl "http://localhost:3000/api/agent/logs?stats=true&limit=10"
```

---

## Test Scripts

Located in `packages/web/scripts/`:

| Script                   | Purpose                          |
| ------------------------ | -------------------------------- |
| `test-logins.js`         | Verify login flows for all roles |
| `test-video-features.js` | E2E video add/note/delete        |
| `setup-test-users.js`    | Create test users                |
| `check-profiles-db.js`   | Verify profiles data             |

### Run Test Scripts

```bash
cd packages/web
node scripts/test-logins.js
node scripts/test-video-features.js
```

---

## Role-Based Access Testing

| Route          | Admin | Translator  | Reader      | Unauthenticated |
| -------------- | ----- | ----------- | ----------- | --------------- |
| `/dashboard`   | ✅    | ✅          | ✅          | ❌ Redirect     |
| `/translate/*` | ✅    | ✅          | ❌ Redirect | ❌ Redirect     |
| `/admin`       | ✅    | ❌ Redirect | ❌ Redirect | ❌ Redirect     |
| `/articles`    | ✅    | ✅          | ✅          | ✅              |

---

## MAC-RAG Testing

### Full Pipeline Test

1. Navigate to `/translate/mac-rag`
2. Select an article
3. Click "Generate Translation"
4. Verify:
   - Translation output appears
   - Agent logs show in "Agent Logs" tab
   - Retrieval results show in "Retrieval Results" tab
   - Stats bar shows correct counts

### Agent Log Verification

1. Generate a translation with a known `articleId`
2. Check `/api/agent/logs?article_id=<id>&stats=true`
3. Verify logs are filtered correctly

---

## Future: Automated Testing

### Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Component Test Example

```typescript
// __tests__/components/ArticleCard.test.tsx
import { render, screen } from "@testing-library/react";
import ArticleCard from "@/components/ArticleCard";

describe("ArticleCard", () => {
  it("renders title", () => {
    render(<ArticleCard article={{ id: "1", title: "Test" }} />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

### Run Tests

```bash
npm test
```

---

_Last Updated: January 12, 2025_
