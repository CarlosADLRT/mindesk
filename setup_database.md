# Database Setup Instructions

## Quick Setup via Supabase Dashboard (Recommended)

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard/project/iwruifqzipgkzckrmekk
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute Schema

1. Open the file `schema.sql` from this project
2. Copy **ALL contents** (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

⏱️ This will take about 30 seconds to complete.

✅ Expected result: "Success. No rows returned"

### Step 3: Verify Installation

Run this verification query in the SQL Editor:

```sql
-- Check tables created
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

✅ You should see ~15 tables, all with `rls_enabled = true`

### Step 4: Test Authentication

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `test@mindesk.app`
   - Password: `TestPassword123!`
   - Auto Confirm User: ✅ Yes
4. Click **Create user**

### Step 5: Verify Profile Created

Go back to SQL Editor and run:

```sql
SELECT
  u.id,
  u.email,
  p.full_name,
  p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'test@mindesk.app';
```

✅ You should see the profile auto-created via trigger!

---

## Alternative: Using PostgreSQL Client

If you prefer using `psql`:

### Step 1: Get Connection String

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Copy the connection string (Connection pooling → Transaction mode)
3. Replace `[YOUR-PASSWORD]` with your database password

### Step 2: Execute Schema

```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres.[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# Run schema
psql "$DATABASE_URL" -f schema.sql

# Optional: Load seed data
psql "$DATABASE_URL" -f seed_data.sql
```

---

## Next Steps

After successful installation:

### 1. Add Environment Variables

Create/update `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://iwruifqzipgkzckrmekk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get your keys from: **Settings** → **API** → **Project API keys**

### 2. Install Supabase Client

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
# or
pnpm add @supabase/supabase-js
```

### 3. Initialize Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4. Test Query

```typescript
// Get workspaces for current user
const { data: workspaces, error } = await supabase
  .from('workspaces')
  .select(`
    id,
    name,
    slug,
    workspace_members!inner (
      role
    )
  `)

console.log(workspaces)
```

---

## Troubleshooting

### "relation does not exist"
- Schema not executed yet
- Execute `schema.sql` in SQL Editor

### "RLS policy violation"
- User not authenticated
- User not member of workspace
- Create workspace first (see example_queries.sql)

### "permission denied for schema auth"
- Normal - auth schema managed by Supabase
- Ignore this error

---

## Files Reference

- `schema.sql` - Complete database schema (RUN THIS FIRST)
- `seed_data.sql` - Optional test data
- `example_queries.sql` - Common query examples
- `DATABASE_README.md` - Full documentation

---

## Need Help?

Check the detailed documentation in `DATABASE_README.md` or review example queries in `example_queries.sql`.
