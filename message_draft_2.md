# TODO:

[] ROLE SPECIFIC VIEW


- TRANSLATOR VIEW:
- ADMIN VIEW:
    + TRANSLATOR VIEW with and additional ADMIN TABS
- READER VIEW:
    - TRANSLATOR VIEW BUT without on TRANSLATION TAB
    - READ ONLY, NO MODIFICATION

- Test each user role, follow this process:
    - login as user
    - navigate to each page
    - perform all actions
    - logout
    - update debug_process for any issue


---

## User Query for TODO: Implement Role-Specific Views

```
Follow @kendo-translation/development_guideline.md : Implement Role-Specific Views

Step 0: Preparation & Analysis
- Read @kendo-translation/development_guideline.md (full file, especially § Core Principles)
- Read @kendo-translation/project_description.md (§ User Roles)
- Read @kendo-translation/docs/debug_progress.md (Phase 4 - Testing Results)
- Read @kendo-translation/docs/NEXT_STEPS.md (Priority 1: Role-Based UI Features)
- Read @kendo-translation/packages/web/components/AuthHeader.tsx (current auth implementation)
- Read @kendo-translation/packages/web/middleware.ts (protected routes pattern)
- Update docs/ai_docs/AI_LOG_user_understanding_20251231.md
- Review test user credentials from AI_MEMORY_short_term-testing.md

Step 1: Design Role-Based Navigation
- Update AuthHeader.tsx with role-specific navigation items
  * ADMIN role:
    - Show "Admin Panel" link
    - Show "Translate Queue" link (inherits translator features)
    - Show all standard links
  * TRANSLATOR role:
    - Show "Translate Queue" link
    - Show all standard links
    - Hide "Admin Panel"
  * READER role:
    - Show only: Dashboard, Articles, Videos, Terminology, Bookmarks
    - Hide: Translate Queue, Admin Panel
- Pattern: Fetch role from /api/auth/me, conditionally render nav items

Step 2: Implement Page-Level Access Control
- Update middleware.ts with role-based route protection:
  * /admin/* → Redirect if role !== 'admin'
  * /translate/* → Redirect if role === 'reader'
  * All other routes → Allow authenticated users
- Add custom error parameter to redirect URL
- Display role-based error messages on login page

Step 3: Component-Level Feature Restrictions
- Articles Detail Page (/articles/[id]):
  * ADMIN/TRANSLATOR: Show "Translate This" button → /translate/[id]
  * READER: Hide translation button, show read-only view
- Video Detail Page (/videos/[id]):
  * ALL ROLES: Can view, add notes, bookmark (current behavior is correct)
- Translation Editor (/translate/[id]):
  * ADMIN/TRANSLATOR: Full edit access
  * READER: Should not reach this page (middleware blocks)
- Admin Panel (/admin):
  * ADMIN: Full access to user management
  * TRANSLATOR/READER: Blocked by middleware

Step 4: Test Each User Role
- Test as ADMIN (admin-1@test.com):
  * Login → Navigate to Dashboard
  * Visit each page: /, /articles, /articles/[id], /videos, /videos/[id], /translate, /admin
  * Verify "Admin Panel" and "Translate Queue" links visible
  * Test all actions: bookmark, translate, manage users
  * Logout
- Test as TRANSLATOR (translator-1@test.com):
  * Login → Navigate to Dashboard
  * Visit each page (except /admin which should redirect)
  * Verify "Translate Queue" visible, "Admin Panel" hidden
  * Test translation features work
  * Verify cannot access /admin
  * Logout
- Test as READER (reader-1@test.com):
  * Login → Navigate to Dashboard
  * Visit allowed pages: /, /articles, /videos, /bookmarks, /terminology
  * Verify translation and admin links hidden
  * Try to access /translate/[id] → verify redirect to login with error
  * Try to access /admin → verify redirect
  * Test read-only features: view articles, bookmark, view videos
  * Logout

Step 5: Create UI Indicators
- Add role badge to AuthHeader (already exists, verify it's visible)
- Add subtle role indicator on pages with restricted features
- Show helpful message for restricted features (e.g., "Upgrade to Translator to translate articles")

Step 6: Verify & Summary
- Run through complete test suite for all 3 roles
- Document any issues in docs/debug_progress.md
- Create test script: packages/web/scripts/test-role-based-ui.js
  * Automated test for navigation items per role
  * Automated test for route redirects
- Update AI_MEMORY_short_term-testing.md with role-based UI patterns
- Suggest: "Ready for next feature: Video Transcripts or Advanced Translation Features"; Write the user queries for each of these steps into message draft.
```

---