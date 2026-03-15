# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mindesk is a practice management system for psychologists in Colombia. It's a Next.js 16 application with Supabase as the backend, featuring appointment scheduling, client management, session notes, invoicing, and package management.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server

# Build and production
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database scripts (require .env.local with Supabase credentials)
npm run db:setup     # Deploy schema and verify database setup
npm run db:verify    # Verify database setup only
npm run db:deploy    # Deploy schema to Supabase
npm run user:create  # Create a test user
npm run db:test-auth # Test authentication
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons, FullCalendar, Recharts
- **Auth**: Supabase Auth with email/password

### Directory Structure

```
app/                    # Next.js App Router pages
├── (dashboard)/        # Protected routes (calendar, clients, dashboard, finance, settings)
├── login/              # Auth pages
└── layout.tsx          # Root layout with AuthProvider

components/             # React components
├── calendar/           # Calendar-specific components (AgendaView, CalendarShell, SessionSheet)
└── *.tsx               # Shared components (modals, navigation, forms)

contexts/
└── AuthContext.tsx     # Auth state management with useAuth hook

lib/
├── api/                # API functions organized by domain
│   ├── appointments.ts # Appointment CRUD, session notes
│   ├── clients.ts      # Client CRUD, search
│   └── workspaces.ts   # Workspace management
├── supabase.ts         # Supabase client, auth helpers, type exports
├── database.types.ts   # TypeScript types for all database tables/views/functions
└── calendar/           # Calendar configuration

scripts/                # Database and auth setup scripts (run with tsx)
```

### Key Patterns

**Path Aliases**: Use `@/*` for root-relative imports (e.g., `@/lib/supabase`, `@/components/Navigation`)

**Auth Flow**:
- `AuthContext` wraps the app and provides `useAuth()` hook
- Dashboard layout (`app/(dashboard)/layout.tsx`) handles auth protection
- Supabase client is configured in `lib/supabase.ts` with typed exports

**API Layer**:
- API functions in `lib/api/` handle all Supabase operations
- Functions auto-inject `created_by` from current user
- Uses Supabase TypeScript types from `lib/database.types.ts`
- Note: `@ts-ignore` comments exist for Supabase type generation issues

**Database**:
- Schema defined in `schema.sql` (deploy via Supabase SQL Editor)
- Seed data in `seed_data.sql`
- Multi-tenant via `workspace_id` on all tables
- Soft deletes via `deleted_at` column

**Key Types** (from `lib/database.types.ts`):
- Enums: `WorkspaceRole`, `AppointmentStatus`, `InvoiceStatus`, `PaymentMethod`, `ReminderChannel`
- Main tables: `profiles`, `workspaces`, `clients`, `appointments`, `session_notes`, `packages`, `invoices`, `payments`
- Views: `upcoming_appointments`, `client_invoice_summary`, `provider_daily_schedule`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key  # Only for admin scripts
```

The app also supports `VITE_SUPABASE_*` prefixes for backwards compatibility.
