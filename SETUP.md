# Mindesk - Setup Guide

Complete setup guide for the Mindesk psychologist practice management application.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: TailwindCSS (to be configured)
- **Icons**: Lucide React
- **Charts**: Recharts

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier is fine)

---

## Step 1: Clone & Install

```bash
cd /Users/carlos/code/mindesk
npm install
```

---

## Step 2: Supabase Project Setup

### 2.1 Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: `iwruifqzipgkzckrmekk` (or create new)
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://iwruifqzipgkzckrmekk.supabase.co`)
   - **anon/public** key
   - **service_role** key (keep secret!)

### 2.2 Update Environment Variables

Edit `.env.local`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://iwruifqzipgkzckrmekk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...your-anon-key
SUPABASE_SERVICE_KEY=eyJhbGciOiJI...your-service-key
```

**Important**: Never commit `.env.local` to git!

---

## Step 3: Deploy Database Schema

### Option A: Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Open `schema.sql` in this project
4. Copy **all contents** (2000+ lines)
5. Paste into SQL Editor
6. Click **Run** (bottom right)
7. Wait ~30 seconds for completion

✅ Expected: "Success. No rows returned"

### Option B: Verify via Script

After deploying via Dashboard, verify with:

```bash
npm run db:verify
```

---

## Step 4: Create First User

### Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - Email: `your-email@example.com`
   - Password: `YourSecurePassword123!`
   - Auto Confirm User: ✅ **Yes**
4. Click **Create user**

✅ A `profiles` record is automatically created via database trigger!

### Verify Profile Creation

In SQL Editor:

```sql
SELECT
  u.id,
  u.email,
  p.full_name,
  p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

---

## Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
mindesk/
├── lib/
│   ├── database.types.ts      # Auto-generated TypeScript types
│   ├── supabase.ts            # Supabase client setup
│   └── api/
│       ├── workspaces.ts      # Workspace CRUD
│       ├── clients.ts         # Client CRUD
│       └── appointments.ts    # Appointment CRUD
├── components/                # React components
├── scripts/
│   └── setup-database.ts      # Database setup script
├── schema.sql                 # Database schema (RUN THIS)
├── seed_data.sql              # Optional test data
├── example_queries.sql        # Example SQL queries
├── .env.local                 # Environment variables (DO NOT COMMIT)
└── .env.example               # Example env file
```

---

## TypeScript Integration

### Using Database Types

```typescript
import { supabase, type Client, type Appointment } from './lib/supabase'

// Create a client
const newClient: TablesInsert<'clients'> = {
  workspace_id: 'workspace-uuid',
  first_name: 'María',
  last_name: 'González',
  email: 'maria@example.com',
  phone: '+57 300 123 4567',
}

const { data, error } = await supabase
  .from('clients')
  .insert(newClient)
  .select()
  .single()
```

### Using API Functions

```typescript
import {
  createClient,
  getClients,
  searchClients,
} from './lib/api/clients'

// Create client
const client = await createClient({
  workspace_id: workspaceId,
  first_name: 'Pedro',
  last_name: 'Ramírez',
  phone: '+57 301 234 5678',
})

// Search clients
const results = await searchClients(workspaceId, 'pedro')
```

---

## Authentication

### Sign Up

```typescript
import { signUp } from './lib/supabase'

const { user, error } = await signUp(
  'user@example.com',
  'SecurePassword123!',
  'Full Name'
)
```

### Sign In

```typescript
import { signIn } from './lib/supabase'

const { user, error } = await signIn(
  'user@example.com',
  'SecurePassword123!'
)
```

### Get Current User

```typescript
import { getCurrentUser } from './lib/supabase'

const user = await getCurrentUser()
```

### Sign Out

```typescript
import { signOut } from './lib/supabase'

await signOut()
```

---

## Working with Workspaces

### Create First Workspace

```typescript
import { createWorkspace } from './lib/api/workspaces'

const workspace = await createWorkspace({
  name: 'Mi Consultorio',
  slug: 'mi-consultorio',
  city: 'Bogotá',
})
```

### Get User's Workspaces

```typescript
import { getWorkspaces } from './lib/api/workspaces'

const workspaces = await getWorkspaces()
```

---

## Database Features

### Row Level Security (RLS)

All tables have RLS enabled:
- ✅ Users can only access data from workspaces they belong to
- ✅ Session notes are ONLY visible to the provider who created them
- ✅ Cross-tenant access is blocked by default

### Automatic Triggers

- **Updated At**: Automatically updates `updated_at` on every record change
- **Profile Creation**: Auto-creates profile when user signs up
- **Appointment Conflicts**: Prevents overlapping appointments
- **Package Consumption**: Auto-decrements sessions when appointment completed
- **Invoice Calculations**: Auto-updates totals when items/payments change

### Helper Functions

```typescript
// Check if time slot is available
const isAvailable = await supabase.rpc('is_time_slot_available', {
  provider_uuid: providerId,
  slot_start: startTime.toISOString(),
  slot_end: endTime.toISOString(),
})

// Get user's workspace IDs
const { data: workspaceIds } = await supabase.rpc('get_user_workspace_ids', {
  user_uuid: userId,
})
```

---

## Optional: Load Seed Data

For testing/development only:

1. Go to Supabase SQL Editor
2. Open `seed_data.sql`
3. Copy contents
4. Paste and **Run**

This creates:
- 3 test users
- 2 workspaces
- 4 clients
- Several appointments
- Session notes
- Invoices & payments

---

## Common Tasks

### Create an Appointment

```typescript
import { createAppointment } from './lib/api/appointments'

const appointment = await createAppointment({
  workspace_id: workspaceId,
  client_id: clientId,
  provider_id: providerId,
  start_time: new Date('2026-01-25T10:00:00-05:00').toISOString(),
  end_time: new Date('2026-01-25T11:00:00-05:00').toISOString(),
  title: 'Sesión de terapia',
  location: 'Consultorio 1',
})
```

### Save Session Notes

```typescript
import { saveSessionNote } from './lib/api/appointments'

const note = await saveSessionNote(appointmentId, {
  workspace_id: workspaceId,
  client_id: clientId,
  provider_id: providerId,
  subjective: 'Cliente reporta mejoría...',
  objective: 'Paciente se observa más relajado...',
  assessment: 'Progreso significativo...',
  plan: 'Continuar con técnicas...',
  mood_rating: 7,
  progress_rating: 8,
})
```

---

## Troubleshooting

### "Missing environment variables"

- Check `.env.local` exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after changing env variables

### "relation does not exist"

- Schema not deployed yet
- Go to Supabase Dashboard → SQL Editor
- Run `schema.sql`

### "RLS policy violation"

- User not authenticated
- User not member of workspace
- Create workspace first or add user to existing workspace

### "Appointment conflict detected"

- This is intentional! Prevents double-booking
- Check existing appointments for that provider/time
- Choose a different time slot

---

## Next Steps

1. ✅ Build authentication UI (sign up, login, logout)
2. ✅ Create workspace selection/creation flow
3. ✅ Build client management interface
4. ✅ Implement appointment scheduling
5. ✅ Create session notes editor (SOAP format)
6. ✅ Build invoicing & payment tracking
7. ✅ Set up reminders (requires Edge Functions)
8. ✅ Add analytics dashboard

---

## Documentation

- **Database Schema**: See `DATABASE_README.md`
- **Example Queries**: See `example_queries.sql`
- **Setup Guide**: See `setup_database.md`

---

## Support

For questions or issues:

1. Check `DATABASE_README.md` for detailed database documentation
2. Review `example_queries.sql` for query examples
3. Consult [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: 2026-01-23
