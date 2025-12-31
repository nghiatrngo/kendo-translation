# Deployment Guide

## Overview

Kendo Translation is deployed using:
- **Frontend/API**: Render.com (Next.js)
- **Database**: Supabase (PostgreSQL)

---

## Production URLs

| Service | URL |
|---------|-----|
| **App** | https://kendo-translation.onrender.com |
| **GitHub** | https://github.com/nghiatrngo/kendo-translation |
| **Supabase** | https://supabase.com/dashboard/project/mbgmyvmsvenvtecvrjia |

---

## Environment Variables

### Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# LLM (for AI translation)
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
```

### Optional

```bash
NODE_ENV=production
```

---

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy update"
git push origin master
```

### 2. Render Auto-Deploy

Render is configured to auto-deploy on push to master via `render.yaml`.

### 3. Verify Deployment

1. Check https://kendo-translation.onrender.com
2. Verify all routes load
3. Test API endpoints

---

## Database Migrations

### Apply New Migration

1. Create SQL file in `supabase/migrations/`
2. Run via Supabase Dashboard SQL Editor
3. Verify tables exist

### Rollback

Manually revert via Supabase SQL Editor.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API returns 500 | Check Supabase credentials in Render env vars |
| Build fails | Run `npm run build` locally first |
| Auth not working | Verify Supabase Auth settings |

---

*Last Updated: December 30, 2024*
