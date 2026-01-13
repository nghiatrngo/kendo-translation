# AI-Coder Short-Term Memory - Testing Session

**Purpose**: Patterns and learnings from comprehensive testing session  
**Last Updated**: 2025-12-31  
**Session**: User Roles + Video Features Testing  
**Status**: COMPLETE ✅

---

## 🎯 Critical Learnings from Testing

### 1. RLS Policy Recursive Evaluation Bug

**Problem Pattern:**
```sql
-- ❌ WRONG: Causes infinite recursion
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles  -- This triggers the same policy!
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Solution Pattern:**
```sql
-- ✅ CORRECT: Use SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());
```

**Key Insight:** Never query the same table within its own RLS policy. Use SECURITY DEFINER functions to bypass RLS for helper queries.

---

### 2. API Route Authentication Pattern

**Problem**: Client-side Supabase calls in React components can hang or fail unpredictably.

**Solution**: Always use API routes for authenticated operations.

**Pattern:**
```typescript
// ✅ CORRECT: API route with session check
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  
  // Inject user_id from session for RLS
  const { data, error } = await supabase
    .from('table')
    .insert({ ...body, user_id: session.user.id })
    .select()
    .single()
    
  // Return consistent format
  return NextResponse.json({ item: data })
}
```

**Key Insights:**
- Always check session at the start
- Inject `user_id` from session for RLS-protected tables
- Return consistent object format (e.g., `{ item: data }` not just `data`)
- Handle both query params AND body for DELETE operations

---

### 3. RLS Policy Patterns for User-Owned Data

**video_notes Table Pattern:**
```sql
-- Allow users to manage their own notes
CREATE POLICY "Users can insert own notes"
  ON video_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notes"
  ON video_notes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON video_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON video_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

**Key Insight:** For user-owned data, create 4 policies (INSERT, SELECT, UPDATE, DELETE) all checking `auth.uid() = user_id`.

---

### 4. Testing Database Connection Pattern

**Use `pg` library for direct database access:**
```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'db.PROJECT_ID.supabase.co',
  port: 5432,
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();
const result = await client.query('SELECT * FROM profiles');
await client.end();
```

**When to use:**
- Verifying database state during debugging
- Applying RLS fixes when browser tools fail
- Checking RLS policy configurations

---

### 5. Test User Management

**Created Test Users:**
```javascript
// Pattern for creating test users programmatically
async function signupUser(email, password) {
  const res = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  // Handle response...
}
```

**Stored Credentials:**
- `admin-1@test.com` : `!12345678!` (admin role)
- `translator-1@test.com` : `!12345678!` (translator role)
- `reader-1@test.com` : `!12345678!` (reader role)

---

## 📋 Testing Workflow

### E2E Testing Pattern
```javascript
// 1. Login
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const cookies = loginRes.headers.getSetCookie().join('; ');

// 2. Perform authenticated action
const actionRes = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Cookie': cookies },
  body: JSON.stringify(data)
});

// 3. Verify result
const result = await actionRes.json();
console.assert(result.success, 'Action failed');
```

---

## 🔧 Common Debugging Commands

### Check RLS Policies
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'your_table';
```

### Check RLS Status
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'your_table';
```

### Check Profiles
```sql
SELECT p.id, u.email, p.role, p.username
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;
```

---

## 🎯 Next Steps Suggested

1. **Protected Routes Verification**
   - Test middleware redirects for unauthenticated access
   - Verify role-based route access (admin-only routes)

2. **UI Role-Based Views**
   - Implement role-specific navigation items
   - Add role-based feature visibility (e.g., admin panel link)

3. **Video Bookmarking**
   - Test bookmark button on video pages
   - Verify bookmarks list shows videos correctly

4. **Documentation**
   - Update API documentation with new endpoints
   - Document test user credentials
   - Add RLS troubleshooting guide

---

*Session completed: December 31, 2025*
