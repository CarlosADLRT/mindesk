# Mindesk - Database Schema Documentation

## Overview

Production-ready Supabase (PostgreSQL) database schema for a psychologist practice management web application (mobile-first PWA) used in Colombia.

### Architecture: Multi-Tenant Workspace Model

- **Solo practitioners**: Create one workspace, work alone
- **Group practices**: One workspace, multiple providers
- **Multi-practice providers**: One user, multiple workspace memberships
- **Security**: Row Level Security (RLS) enforced on all tables
- **Authentication**: Supabase Auth integration

---

## Quick Start

### 1. Setup Database

```bash
# Run schema creation
psql -h your-supabase-host -U postgres -d postgres -f schema.sql

# Load seed data (optional, for testing)
psql -h your-supabase-host -U postgres -d postgres -f seed_data.sql
```

### 2. Supabase Dashboard

If using Supabase Dashboard:

1. Navigate to **SQL Editor**
2. Copy contents of `schema.sql`
3. Execute
4. (Optional) Copy contents of `seed_data.sql` and execute

### 3. Verify Installation

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View seed data summary (if loaded)
SELECT
  (SELECT COUNT(*) FROM profiles) AS profiles,
  (SELECT COUNT(*) FROM workspaces) AS workspaces,
  (SELECT COUNT(*) FROM clients) AS clients,
  (SELECT COUNT(*) FROM appointments) AS appointments;
```

---

## Entity Relationship Diagram

```
┌─────────────┐
│ auth.users  │ (Supabase Auth)
└──────┬──────┘
       │ 1:1
       ├──────────────────────────────────┐
       │                                   │
┌──────▼──────┐     ┌──────────────────┐  │
│  profiles   │────▶│workspace_members │  │
└─────────────┘  M:N└────────┬─────────┘  │
                             │ N:1         │
                      ┌──────▼──────┐      │
                      │ workspaces  │      │
                      └──────┬──────┘      │
                             │ 1:N         │
        ┌────────────────────┼─────────────┤
        │                    │             │
  ┌─────▼─────┐       ┌──────▼──────┐     │
  │  clients  │       │  packages   │     │
  └─────┬─────┘       └──────┬──────┘     │
        │ 1:N                │ N:1        │
        │              ┌─────▼─────────┐  │
        ├─────────────▶│package_       │  │
        │              │purchases      │  │
        │              └───────┬───────┘  │
        │ 1:N                  │          │
  ┌─────▼──────┐               │ 1:N     │
  │appointments│◀──────────────┘          │
  └─────┬──────┘                          │
        │ provider_id ────────────────────┘
        │ 1:1 (optional)
  ┌─────▼──────┐
  │session_    │
  │notes       │
  └────────────┘

  ┌─────────────┐
  │  invoices   │◀──── clients (1:N)
  └──────┬──────┘
         │ 1:N
  ┌──────▼──────────┐
  │ invoice_items   │
  └─────────────────┘
  ┌──────▼──────┐
  │  payments   │
  └─────────────┘
```

---

## Core Tables

### Identity & Access

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User metadata (1:1 with auth.users) | full_name, email, phone, timezone |
| `workspaces` | Clinic/practice/organization | name, slug, settings, currency_code |
| `workspace_members` | User-workspace membership | user_id, workspace_id, role |

**Roles**: `owner`, `admin`, `provider`, `assistant`

### Clinical Data

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `clients` | Patient/client records | first_name, last_name, email, phone, doc_id |
| `appointments` | Scheduled sessions | start_time, end_time, status, provider_id |
| `session_notes` | **HIGHLY SENSITIVE** therapy notes | subjective, objective, assessment, plan (SOAP) |

**Appointment Statuses**: `scheduled`, `completed`, `canceled`, `no_show`

### Packages & Billing

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `packages` | Session package definitions | name, number_of_sessions, price, validity_days |
| `package_purchases` | Client purchases | sessions_total, sessions_used, sessions_remaining |
| `invoices` | Billing documents | invoice_number, total, amount_paid, status |
| `invoice_items` | Line items | description, quantity, unit_price |
| `payments` | Payment records | amount, payment_method, payment_date |

**Invoice Statuses**: `draft`, `pending`, `paid`, `overdue`, `canceled`

**Payment Methods**: `cash`, `card`, `transfer`, `nequi`, `daviplata`, `other`

### Supporting

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `reminders` | Appointment reminders | channel, scheduled_for, status |
| `audit_log` | Change tracking | table_name, action, old_data, new_data |

---

## Security Model (RLS Policies)

### Principle: Workspace-based Isolation

All data is partitioned by `workspace_id`. Users can only access data from workspaces they're members of.

### Key Policies

#### Profiles
- ✅ All users can view all profiles (for member lookups)
- ✅ Users can update only their own profile

#### Workspaces & Members
- ✅ Members can view their workspaces
- ✅ Only owners/admins can update workspace settings
- ✅ Only owners/admins can manage members

#### Clients, Appointments, Packages, Invoices
- ✅ Workspace members can SELECT, INSERT, UPDATE
- ✅ Blocked from accessing other workspaces' data
- ✅ Soft delete restricted to owners/admins

#### Session Notes (CRITICAL)
- 🔒 **Only the provider** can view/edit their own session notes
- 🔒 Not visible to other workspace members
- 🔒 Strictest security in the system

### Helper Functions

```sql
-- Check if user is member of workspace
SELECT is_workspace_member(workspace_id, auth.uid());

-- Get all workspace IDs for current user
SELECT * FROM get_user_workspace_ids(auth.uid());

-- Check appointment availability
SELECT is_time_slot_available(provider_id, start_time, end_time);
```

---

## Key Features

### 1. Automatic Triggers

| Trigger | Purpose |
|---------|---------|
| `update_updated_at_column()` | Auto-update `updated_at` on every UPDATE |
| `create_profile_for_new_user()` | Auto-create profile when user signs up |
| `check_appointment_conflict()` | Prevent overlapping provider appointments |
| `consume_package_session()` | Auto-decrement package sessions when appointment completed |
| `recalculate_invoice_totals()` | Auto-update invoice totals when items change |
| `update_invoice_amount_paid()` | Auto-update invoice status when payments recorded |

### 2. Computed Columns

```sql
-- Package purchases
sessions_remaining = sessions_total - sessions_used (STORED)

-- Invoices
amount_due = total - amount_paid (STORED)
```

### 3. Appointment Conflict Prevention

When inserting/updating appointments with `status = 'scheduled'`, the database automatically checks for overlapping appointments for the same provider and raises an exception if conflict detected.

### 4. Package Session Consumption

When an appointment is marked as `completed` and has `package_purchase_id` set:
- Automatically increments `sessions_used`
- If changed back from completed, decrements `sessions_used`

### 5. Invoice Auto-calculation

When invoice items are added/updated/deleted:
- `subtotal` = SUM(item amounts)
- `tax_amount` = subtotal × tax_rate
- `total` = subtotal + tax_amount - discount_amount

When payments are recorded:
- `amount_paid` = SUM(payments)
- `status` = automatically updated based on payment
- `paid_at` = set when fully paid

---

## Useful Views

### `upcoming_appointments`
Next 7 days of scheduled appointments with client and provider info.

```sql
SELECT * FROM upcoming_appointments
WHERE workspace_id = 'xxx'
ORDER BY start_time;
```

### `client_invoice_summary`
Invoice totals and payment status per client.

```sql
SELECT * FROM client_invoice_summary
WHERE workspace_id = 'xxx';
```

### `client_package_summary`
Package usage and remaining sessions per client.

```sql
SELECT * FROM client_package_summary
WHERE workspace_id = 'xxx'
  AND status = 'active';
```

### `provider_daily_schedule`
Today's appointments for all providers.

```sql
SELECT * FROM provider_daily_schedule
WHERE workspace_id = 'xxx'
ORDER BY start_time;
```

---

## Indexes

### Why These Indexes?

#### Appointments (Performance Critical)
- **Date range queries**: Lookup appointments by date range
- **Provider schedule**: Check provider availability
- **Upcoming appointments**: Dashboard view (most common)
- **Conflict detection**: Fast overlap checking

#### Clients
- **Name search**: Fuzzy search by last name, first name
- **Phone/email lookup**: Quick contact search
- **Active clients**: Filter active vs inactive

#### Invoices
- **Status filtering**: Pending, overdue, paid invoices
- **Due date sorting**: Payment reminders
- **Client history**: All invoices for a client

#### Package Purchases
- **Active packages**: Find available sessions for booking
- **Client lookup**: View client's packages

---

## Common Workflows

See `example_queries.sql` for detailed SQL examples of:

1. **User Onboarding**: Create workspace, add members
2. **Client Management**: Create, search, view client stats
3. **Appointment Scheduling**: Check availability, schedule, reschedule, cancel
4. **Session Notes**: Complete appointment and record notes
5. **Packages**: Create packages, sell to clients, redeem sessions
6. **Billing**: Create invoices, add items, record payments
7. **Reminders**: Schedule appointment reminders
8. **Analytics**: Revenue reports, provider performance, client engagement

---

## Data Privacy & Compliance

### Sensitive Data

| Field | Table | Sensitivity | Notes |
|-------|-------|-------------|-------|
| **SOAP notes** | session_notes | 🔴 CRITICAL | Only provider access |
| Email, phone | clients | 🟡 MEDIUM | Workspace members only |
| Invoice data | invoices, payments | 🟡 MEDIUM | Workspace members only |
| Doc ID (CC, TI) | clients | 🟡 MEDIUM | Optional, Colombia ID types |

### Best Practices

1. **Session notes**: Never expose via client-side queries without provider filter
2. **API endpoints**: Always filter by `auth.uid()` on provider_id for session notes
3. **Audit log**: Track all changes to sensitive data
4. **Soft delete**: Use `deleted_at` instead of hard deletes (data retention)
5. **Encryption**: Enable Supabase encryption at rest (default)

---

## Colombia-Specific Considerations

### Currency
- Default: `COP` (Colombian Peso)
- Supports multi-currency via `currency_code` field

### Document Types (doc_type)
Common in Colombia:
- `CC` - Cédula de Ciudadanía
- `TI` - Tarjeta de Identidad
- `CE` - Cédula de Extranjería
- `PA` - Pasaporte

### Payment Methods
Colombian payment methods included:
- `nequi` - Nequi digital wallet
- `daviplata` - Daviplata digital wallet
- Standard: `cash`, `card`, `transfer`

### Timezone
- Default: `America/Bogota` (Colombia is UTC-5, no DST)

### Tax (IVA)
- Health services in Colombia are typically **exempt from IVA**
- Default `tax_rate = 0.0000`
- Field available if needed for other services

---

## Deployment Checklist

- [ ] Run `schema.sql` in Supabase SQL editor
- [ ] Verify RLS is enabled on all tables: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- [ ] Test authentication: Create test user via Supabase Auth
- [ ] Test RLS policies: Try accessing data from another workspace (should fail)
- [ ] Create first workspace via onboarding flow
- [ ] Configure storage buckets (if storing files like avatars, documents)
- [ ] Set up Edge Functions for:
  - Sending reminders (WhatsApp, SMS, email)
  - Generating PDF invoices
  - Appointment conflict checks (additional validation)
- [ ] Enable Realtime (optional) for live appointment updates
- [ ] Configure backups (automatic in Supabase Pro/Team)
- [ ] Set up monitoring/logging

---

## Performance Tips

### Query Optimization

```sql
-- ✅ GOOD: Filter by workspace_id first (indexed)
SELECT * FROM clients
WHERE workspace_id = 'xxx'
  AND deleted_at IS NULL
  AND last_name ILIKE 'Gom%';

-- ❌ BAD: Full table scan
SELECT * FROM clients
WHERE last_name ILIKE 'Gom%';
```

### Appointment Queries

```sql
-- ✅ GOOD: Use indexed date range
SELECT * FROM appointments
WHERE workspace_id = 'xxx'
  AND start_time >= '2026-01-20'
  AND start_time < '2026-01-27';

-- ❌ BAD: Extract date function prevents index use
SELECT * FROM appointments
WHERE DATE(start_time) = '2026-01-20';
```

### Use Views

```sql
-- ✅ GOOD: Use pre-built view
SELECT * FROM upcoming_appointments WHERE workspace_id = 'xxx';

-- ❌ BAD: Rebuild complex joins every time
SELECT a.*, c.first_name, c.last_name, p.full_name ...
```

---

## Extending the Schema

### Adding Custom Fields

```sql
-- Add custom field to clients (e.g., preferred language)
ALTER TABLE clients ADD COLUMN preferred_language TEXT DEFAULT 'es';

-- Add custom JSONB for flexible metadata
ALTER TABLE clients ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;

-- Query custom fields
SELECT * FROM clients
WHERE custom_fields->>'insurance_provider' = 'Sura';
```

### Adding New Tables

```sql
-- Example: Add treatment plans table
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  provider_id UUID NOT NULL REFERENCES profiles(id),

  title TEXT NOT NULL,
  goals TEXT[],
  interventions TEXT[],
  start_date DATE NOT NULL,
  end_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

-- Add policy (workspace members can access)
CREATE POLICY treatment_plans_select ON treatment_plans
  FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Add indexes
CREATE INDEX idx_treatment_plans_workspace ON treatment_plans(workspace_id);
CREATE INDEX idx_treatment_plans_client ON treatment_plans(client_id);
```

---

## Troubleshooting

### RLS Policy Issues

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'clients';

-- View policies for a table
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Test policy (run as authenticated user)
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM clients; -- Should only return workspace data
```

### Appointment Conflicts

```sql
-- Disable conflict checking temporarily (if needed)
ALTER TABLE appointments DISABLE TRIGGER check_appointment_conflict_trigger;

-- Re-enable
ALTER TABLE appointments ENABLE TRIGGER check_appointment_conflict_trigger;
```

### Debugging Triggers

```sql
-- Check triggers on a table
SELECT tgname, tgenabled FROM pg_trigger
WHERE tgrelid = 'appointments'::regclass;

-- View trigger definition
\df+ consume_package_session
```

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Colombia Regulations**: Consult local laws regarding health data (Ley 1581 de 2012 - Habeas Data)

---

## License

Proprietary - Mindesk Project

---

## Changelog

### v1.0.0 (2026-01-23)
- Initial schema design
- Multi-tenant workspace model
- RLS policies implemented
- Auto-triggers for business logic
- Seed data for testing
- Example queries documented
