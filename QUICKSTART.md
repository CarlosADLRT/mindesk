# Mindesk - Quick Start Guide

Get Mindesk up and running in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Get your Supabase credentials:
1. Go to https://app.supabase.com/project/iwruifqzipgkzckrmekk/settings/api
2. Copy **Project URL** and **anon key**
3. Update `.env.local`:

```bash
VITE_SUPABASE_URL=https://iwruifqzipgkzckrmekk.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 3: Deploy Database Schema

1. Go to Supabase Dashboard: https://app.supabase.com/project/iwruifqzipgkzckrmekk/sql
2. Click **New Query**
3. Open `schema.sql` in this project
4. Copy ALL contents (Ctrl+A, Ctrl+C)
5. Paste into SQL Editor
6. Click **Run**
7. Wait ~30 seconds

✅ You should see: "Success. No rows returned"

## Step 4: Verify Setup

```bash
npm run db:verify
```

## Step 5: Create Test User

1. Go to: https://app.supabase.com/project/iwruifqzipgkzckrmekk/auth/users
2. Click **Add user** → **Create new user**
3. Email: `test@mindesk.app`
4. Password: `TestPassword123!`
5. Auto Confirm User: ✅ Yes
6. Click **Create user**

## Step 6: Start Development

```bash
npm run dev
```

Open http://localhost:5173

---

## What's Next?

- Read `SETUP.md` for detailed documentation
- Check `DATABASE_README.md` for schema details
- Review `example_queries.sql` for query examples
- Start building your frontend!

---

## Quick Reference

### File Structure

```
lib/
  ├── supabase.ts           # Supabase client + auth helpers
  ├── database.types.ts     # TypeScript types
  └── api/
      ├── workspaces.ts     # Workspace operations
      ├── clients.ts        # Client operations
      └── appointments.ts   # Appointment operations
```

### Import Examples

```typescript
// Client
import { supabase } from './lib/supabase'

// Types
import type { Client, Appointment } from './lib/supabase'

// API Functions
import { createClient, getClients } from './lib/api/clients'
import { createAppointment } from './lib/api/appointments'
import { createWorkspace } from './lib/api/workspaces'
```

### Common Operations

```typescript
// Sign In
import { signIn } from './lib/supabase'
const { user, error } = await signIn('email@example.com', 'password')

// Create Workspace
import { createWorkspace } from './lib/api/workspaces'
const workspace = await createWorkspace({ name: 'Mi Consultorio' })

// Create Client
import { createClient } from './lib/api/clients'
const client = await createClient({
  workspace_id: workspaceId,
  first_name: 'María',
  last_name: 'González',
  phone: '+57 300 123 4567'
})

// Schedule Appointment
import { createAppointment } from './lib/api/appointments'
const appointment = await createAppointment({
  workspace_id: workspaceId,
  client_id: clientId,
  provider_id: providerId,
  start_time: new Date('2026-01-25T10:00:00-05:00').toISOString(),
  end_time: new Date('2026-01-25T11:00:00-05:00').toISOString(),
})
```

---

## Troubleshooting

**Error: "Missing environment variables"**
- Restart dev server: `Ctrl+C` then `npm run dev`
- Check `.env.local` has correct values

**Error: "relation does not exist"**
- Run `schema.sql` in Supabase SQL Editor

**Error: "RLS policy violation"**
- User needs to be member of workspace
- Create workspace first

---

Need more help? See `SETUP.md` for complete documentation.
