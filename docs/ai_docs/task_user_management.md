# User Management & Permissions Task

- [x] **Disable Public Signup**

  - [x] Identify signup UI elements in `login/page.tsx` or `AuthHeader.tsx`
  - [x] Disable/Hide signup option
  - [x] Verify `allow_signup` is disabled in Supabase (if possible via code) or just hide UI (Hidden UI)

- [x] **List Active Accounts**

  - [x] Create/Run script to list all users from `profiles` table (Created script, simpler to use Admin Panel)

- [x] **Test New Reader Creation**

  - [x] Create user `wenqian@test.com` with role `reader` ( simulating Admin action)
  - [x] Verify user creation

- [x] **Verify Reader Permissions**
  - [x] Test Login as `wenqian`
  - [x] Verify Access:
    - [x] `/articles` (Allowed)
    - [x] `/articles/[id]` (Allowed - Read Only)
    - [x] `/videos` (Allowed)
    - [x] `/translate` (Denied)
    - [x] `/admin` (Denied)
