# Testing Guide

## Overview

Kendo Translation uses manual testing for now. Automated tests can be added following the patterns below.

---

## Manual Testing Checklist

### Core Routes

- [ ] `/` - Landing page loads
- [ ] `/articles` - Article list displays
- [ ] `/articles/[id]` - Article detail shows JP/EN content
- [ ] `/videos` - Video list displays
- [ ] `/videos/[id]` - Video player works
- [ ] `/terminology` - Term search works
- [ ] `/translate` - Translation list shows
- [ ] `/translate/[id]` - Editor loads with AI button
- [ ] `/dashboard` - Stats display
- [ ] `/login` - Auth works

### API Endpoints

```bash
# Test articles
curl http://localhost:3000/api/articles

# Test TM search
curl -X POST http://localhost:3000/api/tm/search \
  -H "Content-Type: application/json" \
  -d '{"source_text": "剣道"}'
```

---

## Future: Automated Testing

### Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Component Test Example

```typescript
// __tests__/components/ArticleCard.test.tsx
import { render, screen } from '@testing-library/react'
import ArticleCard from '@/components/ArticleCard'

describe('ArticleCard', () => {
  it('renders title', () => {
    render(<ArticleCard article={{ id: '1', title: 'Test' }} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Run Tests

```bash
npm test
```

---

*Last Updated: December 30, 2024*
