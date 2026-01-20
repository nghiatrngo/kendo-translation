# Deployment Testing Guidelines for AI Coders

**Purpose**: Guidelines for AI agents to perform comprehensive deployment testing and verification  
**Key Principle**: Test like an expert DevOps engineer, validating both infrastructure and application layers  
**Last Updated**: January 19, 2026

---

## 🎯 Core Philosophy

**The goal is to validate the entire deployment pipeline**, from code push to production verification.

```
❌ Wrong: Push code → Assume it works → Move on
✅ Right: Push code → Monitor build → Verify deployment → Test endpoints → Browser validation → Document
```

---

## § Pre-Deployment Checklist

### 1. Local Validation (MANDATORY)
**Never deploy without local verification first.**

```markdown
Before pushing to production:
- [x] Code runs locally without errors
- [x] All new routes/APIs tested via localhost
- [x] Browser testing completed on localhost
- [x] Environment variables documented
- [x] Dependencies updated in package.json
```

### 2. Code Quality Gates

```markdown
Check before commit:
- [x] No hardcoded secrets or API keys
- [x] Environment variables used correctly
- [x] Error handling implemented
- [x] Console.log debugging removed (or made conditional)
- [x] TypeScript errors resolved
```

### 3. Deployment Artifacts

```markdown
Required documentation before deploy:
- [ ] Environment variables needed
- [ ] Database migrations (if any)
- [ ] New secrets to configure
- [ ] Breaking changes noted
- [ ] Rollback plan documented
```

---

## § Deployment Process

### Phase 1: Code Push & Build Monitoring

#### 1.1 Git Commit Strategy
```bash
# Use semantic commit messages
git commit -m "fix(auth): handle non-JSON responses in login form"
git commit -m "feat(admin): add user role management API"
git commit -m "chore(deps): update supabase-js to v2.39"
```

#### 1.2 Monitor Build Logs
```markdown
After pushing:
1. Wait 30-60 seconds for build to start
2. Access deployment platform (Render/Vercel/etc.) dashboard
3. Watch build logs in real-time
4. Verify:
   - Dependencies install successfully
   - TypeScript compilation passes
   - No runtime errors during build
   - Build artifacts generated
```

#### 1.3 Build Failure Recovery
```markdown
If build fails:
1. Capture full error logs
2. Identify root cause (deps, syntax, env vars)
3. Fix locally and verify
4. Push fix with descriptive commit message
5. Monitor new build
```

### Phase 2: Deployment Verification (30-90 seconds post-build)

#### 2.1 Deployment Detection
**Use `curl` to verify deployment is live:**

```bash
# Check if new deployment propagated
curl -I https://your-app.com

# Look for:
# - HTTP 200/307 (healthy response)
# - Recent Date header (matches current time)
# - Correct server headers
```

**🚨 Stale Deployment Detection:**
```markdown
Warning signs of stale deployment:
- Date header is old (>1 hour)
- HTTP 404 on newly added routes
- Missing features that work locally
- Environment shows old commit hash

Action: Force redeploy via platform dashboard or empty commit
```

#### 2.2 Environment Variable Validation
```bash
# Test endpoints that rely on env vars
curl https://your-app.com/api/health

# If API returns errors, check platform for:
# - MISSING environment variables
# - MISCONFIGURED secrets
# - Wrong service role keys
```

### Phase 3: API Endpoint Testing

#### 3.1 Critical Endpoints Test
**Use `curl` for quick API validation:**

```bash
# Test authentication endpoints
curl -X POST https://your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Expected: JSON response (200 or 400), NOT HTML

# Test protected routes
curl -I https://your-app.com/api/admin/users

# Expected: 401 Unauthorized (if not authenticated)

# Test public endpoints
curl https://your-app.com/api/health

# Expected: 200 OK with JSON
```

#### 3.2 Response Format Validation
```markdown
For each endpoint tested:
- ✅ Returns correct Content-Type (application/json for APIs)
- ✅ Status codes match expectations (200, 400, 401, etc.)
- ✅ Error messages are meaningful (not HTML error pages)
- ✅ Response structure matches API contract
```

**Common Issues:**
| Symptom | Root Cause | Fix |
|---------|------------|-----|
| 404 HTML on new route | Stale deployment | Force redeploy |
| 500 on all endpoints | Missing env var | Configure in dashboard |
| Timeout | Cold start or crash | Check logs, restart service |
| CORS errors | Missing middleware | Review middleware config |

### Phase 4: Browser-Based Validation

#### 4.1 Smoke Test Sequence
```markdown
Minimum browser validation after deployment:
1. Navigate to root URL → Verify redirect or landing page
2. Login with test account → Verify authentication works
3. Access one protected route → Verify authorization works
4. Test one critical feature → Verify core functionality
5. Logout → Verify session cleared
```

#### 4.2 Role-Based Access Testing
```markdown
For applications with roles (Admin, User, etc.):

Test Admin Role:
- [ ] Can access /admin
- [ ] Can perform admin actions
- [ ] Admin-only navbar items visible

Test User Role:
- [ ] Cannot access /admin (redirects with error)
- [ ] Can access allowed routes
- [ ] User-level navbar items visible

Test Unauthenticated:
- [ ] Redirected to /login from protected routes
- [ ] Can access public pages
- [ ] Cannot access APIs without auth
```

#### 4.3 Error Handling Verification
```markdown
Test error scenarios on production:
- [ ] Invalid login credentials → Shows error message
- [ ] Expired session → Redirects to login
- [ ] Network timeout → Shows retry option
- [ ] 404 pages → Show custom error page (not default)
```

### Phase 5: Performance & Health Checks

#### 5.1 Response Time Validation
```bash
# Measure endpoint response time
time curl https://your-app.com/api/auth/me

# Expected: < 2 seconds for simple queries
# Warning: > 5 seconds indicates performance issue
```

#### 5.2 Database Connection Test
```markdown
Verify database connectivity:
- [ ] Query endpoints return data
- [ ] Mutations successfully update DB
- [ ] Connection pool not exhausted
- [ ] No timeout errors in logs
```

#### 5.3 External Service Integration
```markdown
Test third-party integrations:
- [ ] AI/LLM API calls succeed
- [ ] Payment gateway reachable
- [ ] Email service configured
- [ ] Object storage accessible
```

---

## § Common Deployment Issues & Solutions

### Issue 1: Stale Deployment
**Symptom:** New code doesn't appear, old features present
```markdown
Diagnosis:
1. curl -I https://app.com → Check Date header
2. curl https://app.com/api/new-endpoint → Returns 404
3. Local works, production doesn't

Solution:
1. Check deployment platform logs for errors
2. Verify build succeeded (not just started)
3. Force redeploy: git commit --allow-empty -m "chore: trigger redeploy"
4. Wait 2-5 minutes, re-verify with curl
```

### Issue 2: Environment Variable Missing
**Symptom:** 500 errors on all endpoints, "undefined" errors in logs
```markdown
Diagnosis:
1. Check error logs: "process.env.SOME_KEY is undefined"
2. Verify local .env.local has the variable
3. Check deployment platform dashboard

Solution:
1. Add missing environment variables to platform
2. Restart service (may not auto-restart)
3. Verify with curl test
```

### Issue 3: Authentication Broken
**Symptom:** Login returns 404 or UI hangs indefinitely
```markdown
Diagnosis:
1. curl -X POST https://app.com/api/auth/login -d '...' → Returns HTML 404
2. Check Content-Type header → text/html (should be application/json)
3. Verify route exists locally

Solution:
1. Confirm /api/auth/login route deployed
2. Check middleware isn't blocking auth routes
3. Verify Supabase keys configured
4. Test with fresh credentials
```

### Issue 4: CORS Errors
**Symptom:** Browser console shows CORS errors, API calls fail from frontend
```markdown
Diagnosis:
1. Check browser console: "CORS policy: No 'Access-Control-Allow-Origin'"
2. curl works but browser doesn't

Solution:
1. Add CORS middleware to API routes
2. Configure allowed origins in deployment
3. Verify preflight OPTIONS requests succeed
```

### Issue 5: Database Connection Issues
**Symptom:** Timeouts, "too many connections," query failures
```markdown
Diagnosis:
1. Check logs for Postgres/Supabase errors
2. Verify connection string format
3. Test connection pooling limits

Solution:
1. Verify DATABASE_URL / Supabase keys correct
2. Check RLS policies (not blocking queries)
3. Use connection pooling (5-10 max connections)
4. For admin operations, use service role key
```

---

## § Testing Timelines

### Build & Deploy
| Phase | Expected Time | Action if Exceeded |
|-------|---------------|-------------------|
| Build start | 30-60s | Check platform status |
| Build complete | 2-5 min | Review logs for errors |
| Deployment live | 1-3 min | Force redeploy if >10 min |
| DNS propagation | 0-60s | Usually immediate for platforms |

### Verification Windows
| Test Type | Duration | Retry Wait |
|-----------|----------|------------|
| curl health check | 5s | Retry after 30s |
| API endpoint tests | 1-2 min | Retry after 1 min |
| Browser smoke test | 3-5 min | Retry after 2 min |
| Full browser test | 10-20 min | After deployment confirmed |

---

## § Documentation Requirements

### Post-Deployment Report Template

```markdown
# Deployment Report: [Feature Name]

**Date**: YYYY-MM-DD HH:MM
**Commit**: [short-hash] [commit message]
**Deployed To**: [production URL]

## Pre-Deployment
- [x] Local verification passed
- [x] Environment variables documented
- [x] Test credentials prepared

## Build Status
- Build Duration: X minutes
- Build Status: ✅ Success / ❌ Failed
- Build Logs: [link or key excerpts]

## Deployment Verification
### Curl Tests
- Health endpoint: ✅ 200 OK
- Auth endpoint: ✅ Returns JSON
- Protected route: ✅ 401 Unauthorized (expected)

### Browser Tests
- Login: ✅ Works
- Admin access: ✅ Admin can access /admin
- User access: ✅ User blocked from /admin
- Core feature: ✅ [Feature name] functional

## Issues Encountered
1. **[Issue]**: [Description]
   - Root Cause: [Diagnosis]
   - Resolution: [Solution]
   - Time to Resolve: [duration]

## Production Status
- ✅ Deployment successful
- ✅ All tests passing
- ⚠️ Minor issues (documented above)
- ❌ Rollback required (if critical failure)

## Next Steps
- [ ] Monitor error logs for 24 hours
- [ ] User acceptance testing
- [ ] Update documentation
```

---

## § Rollback Procedures

### When to Rollback
```markdown
Immediate rollback if:
- Authentication completely broken (users can't login)
- Data corruption detected
- Critical security vulnerability introduced
- Database migrations failed

Consider rollback if:
- Major features broken (>50% functionality lost)
- Performance degraded significantly (>5x slower)
- Errors affecting majority of users
```

### Rollback Steps
```bash
# Identify last working commit
git log --oneline -10

# Revert to previous version
git revert [bad-commit-hash]
# OR
git reset --hard [good-commit-hash]

# Force push (use with caution)
git push origin master --force

# Notify users
# Monitor new deployment
# Investigate root cause offline
```

### Post-Rollback Actions
```markdown
1. Document what failed and why
2. Create hotfix branch for issue
3. Test hotfix thoroughly locally
4. Deploy hotfix following full procedure
5. Update deployment checklist to prevent recurrence
```

---

## § Platform-Specific Notes

### Render.com
```markdown
- Auto-deploys on push to master
- Free tier: cold starts (~30s delay on first request)
- Check Events tab for deployment status
- Environment variables: Dashboard → Environment
- Logs: Dashboard → Logs (live tail available)
- Manual deploy: Dashboard → Manual Deploy → Deploy latest commit
```

### Vercel
```markdown
- Instant deployments (1-2 min)
- Preview deployments for PRs
- Edge functions have different limits
- Environment variables per environment (Production/Preview/Development)
- Logs: Dashboard → Deployments → [deployment] → Logs
```

### Railway.app
```markdown
- Auto-deploys on push
- Health checks configurable
- Database included (Postgres)
- Zero-downtime deploys (if configured)
- CLI available for quick checks: railway logs
```

---

## § Continuous Monitoring

### Post-Deployment Monitoring (First 1 Hour)
```markdown
Monitor every 10-15 minutes:
- [ ] Error logs (check for new errors)
- [ ] Response times (check for slowdowns)
- [ ] User reports (check support channels)
- [ ] Health endpoint (automated ping)
```

### Week 1 Monitoring
```markdown
Daily checks:
- [ ] Error rate (should be <1% of requests)
- [ ] Performance metrics (response time trends)
- [ ] User feedback (bug reports, feature requests)
- [ ] Database metrics (query performance, connection pool)
```

---

## § Integration with Browser Testing

**Deployment testing complements browser testing:**

```markdown
Deployment Testing (This Document):
- Focuses on: Infrastructure, API endpoints, deployment success
- Tools: curl, platform dashboards, server logs
- Timing: Immediately after code push (within 5-10 min)

Browser Testing (browser_testing_guideline.md):
- Focuses on: User experience, UI functionality, user flows
- Tools: Browser automation, manual testing
- Timing: After deployment verified (10-30 min later)

Integration Flow:
1. Push code → Deployment Testing (this guide)
2. Deployment verified → Browser Testing (UI validation)
3. Both passed → Mark deployment complete
4. Either failed → Debug, fix, redeploy
```

---

## § Lessons Learned (Real Examples)

### Case Study 1: Login UI Hang (Jan 19, 2026)
**Issue:** Production login page hung indefinitely, local worked fine.

**Root Cause:** `/api/auth/login` route returned 404 HTML due to stale deployment. Frontend tried to parse HTML as JSON, causing hang.

**Detection:**
```bash
curl -X POST https://prod.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
# Returned: <!DOCTYPE html>... (404 page)
```

**Resolution:**
1. Added error handling to check Content-Type before parsing
2. Forced redeploy with empty commit
3. Verified with curl: now returns JSON with 400 Bad Request (correct)

**Prevention:**
- Always test new API routes with curl post-deployment
- Add Content-Type validation in frontend fetch calls
- Monitor deployment logs for route registration

### Case Study 2: Admin Access Denied (Jan 18, 2026)
**Issue:** Admin users saw "Checking permissions..." forever, then blocked from /admin.

**Root Cause:** RLS (Row Level Security) policies blocked profile queries. Standard Supabase client couldn't read user roles.

**Detection:**
- Browser console: 403 Forbidden on profile query
- Admin panel showed zero users

**Resolution:**
1. Created `createAdminClient()` using `SUPABASE_SERVICE_ROLE_KEY`
2. Migrated admin-specific queries to service role client
3. Regular queries still use anon key (for security)

**Prevention:**
- Document which queries need service role vs anon key
- Add SUPABASE_SERVICE_ROLE_KEY to deployment env vars
- Test admin features with fresh accounts (not database admin)

### Case Study 3: Missing Environment Variable (Common)
**Issue:** All API calls return 500, logs show "undefined" for API key.

**Root Cause:** Forgot to add `OPENROUTER_API_KEY` to production environment.

**Detection:**
```bash
curl https://prod.com/api/translate
# Returns: {"error": "API key not configured"}
```

**Resolution:**
1. Added env var to Render dashboard
2. Restarted service (some platforms don't auto-restart)
3. Verified with test request

**Prevention:**
- Create `.env.example` with all required vars
- Document env vars in README
- Add environment var validation at app startup
- Check deployment platform for missing vars before deploying

---

## § Quick Reference Checklist

### Pre-Push
- [ ] Works locally
- [ ] API routes tested with curl
- [ ] Browser tested on localhost
- [ ] No hardcoded secrets
- [ ] Environment vars documented

### Post-Push (First 5 Minutes)
- [ ] Build started
- [ ] Build completed successfully
- [ ] Deployment shows as "Live"
- [ ] curl health check returns 200

### Post-Deployment (5-15 Minutes)
- [ ] curl tests on new endpoints (return JSON, not HTML)
- [ ] curl tests on auth (returns expected codes)
- [ ] Browser smoke test (login, main feature)
- [ ] Check error logs (no new critical errors)

### Day 1 Monitoring
- [ ] Error rate normal (<1%)
- [ ] Response times normal (<2s avg)
- [ ] No user bug reports
- [ ] All features accessible

---

## § Summary Philosophy

> Deploy deliberately | Verify thoroughly | Monitor actively | Document everything | Rollback decisively

---

**Remember:** A deployment isn't complete when code is pushed—it's complete when production is verified working.

---

*Guidelines created: January 19, 2026*  
*Based on: Real deployment debugging sessions, Kendo Translation deployment experiences*
