-- =====================================================
-- MINDESK - Psychologist Practice Management System
-- Supabase PostgreSQL Schema
-- =====================================================
-- Architecture: Multi-tenant workspace model
-- Auth: Supabase Auth (auth.users)
-- Security: Row Level Security (RLS) enabled on all tables
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. ENUMS
-- =====================================================

CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'provider', 'assistant');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'canceled', 'no_show');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'canceled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'nequi', 'daviplata', 'other');
CREATE TYPE reminder_channel AS ENUM ('email', 'sms', 'whatsapp', 'push');
CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed', 'canceled');

-- =====================================================
-- 3. TABLES
-- =====================================================

-- -----------------------------------------------------
-- 3.1 CORE IDENTITY
-- -----------------------------------------------------

-- Profiles: User metadata (1:1 with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Bogota',
  locale TEXT DEFAULT 'es-CO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces: Clinic/practice/solo practice
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'CO',
  timezone TEXT DEFAULT 'America/Bogota',
  currency_code TEXT DEFAULT 'COP',
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Workspace Members: Many-to-many relationship
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'provider',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- -----------------------------------------------------
-- 3.2 CLIENTS & APPOINTMENTS
-- -----------------------------------------------------

-- Clients: Patients/clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Identity
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  doc_type TEXT, -- CC, TI, CE, etc. (Colombia)
  doc_id TEXT,

  -- Contact
  email TEXT,
  phone TEXT,
  secondary_phone TEXT,

  -- Personal
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,

  -- Clinical (non-sensitive metadata)
  referred_by TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Metadata
  notes TEXT, -- Non-clinical admin notes
  tags TEXT[], -- For categorization/filtering
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT unique_client_doc UNIQUE NULLS NOT DISTINCT (workspace_id, doc_type, doc_id)
);

-- Appointments: Scheduled sessions
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id),

  -- Scheduling
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/Bogota',

  -- Status & metadata
  status appointment_status NOT NULL DEFAULT 'scheduled',
  title TEXT,
  description TEXT,
  location TEXT, -- Office, online, etc.

  -- Billing link
  package_purchase_id UUID, -- If using a package session (FK added later)
  is_billable BOOLEAN DEFAULT true,

  -- Cancellation
  canceled_at TIMESTAMPTZ,
  canceled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,

  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Session Notes: Sensitive therapy notes (1:1 with appointment)
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id),

  -- Clinical content (SENSITIVE)
  subjective TEXT, -- Client's report
  objective TEXT, -- Therapist's observations
  assessment TEXT, -- Clinical assessment
  plan TEXT, -- Treatment plan

  -- Structured data
  session_number INTEGER,
  duration_minutes INTEGER,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 10),

  -- Metadata
  tags TEXT[],
  goals TEXT[],
  interventions TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------
-- 3.3 PACKAGES
-- -----------------------------------------------------

-- Package Definitions: Reusable session packages
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  number_of_sessions INTEGER NOT NULL CHECK (number_of_sessions > 0),
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  currency_code TEXT DEFAULT 'COP',

  -- Validity
  validity_days INTEGER, -- NULL = no expiration
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Package Purchases: Client purchases of packages
CREATE TABLE package_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id),

  -- Purchase details
  sessions_total INTEGER NOT NULL CHECK (sessions_total > 0),
  sessions_used INTEGER NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  sessions_remaining INTEGER GENERATED ALWAYS AS (sessions_total - sessions_used) STORED,

  price_paid DECIMAL(12,2) NOT NULL CHECK (price_paid >= 0),
  currency_code TEXT DEFAULT 'COP',

  -- Validity
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_sessions_used CHECK (sessions_used <= sessions_total)
);

-- Add FK from appointments to package_purchases
ALTER TABLE appointments
  ADD CONSTRAINT fk_package_purchase
  FOREIGN KEY (package_purchase_id)
  REFERENCES package_purchases(id);

-- -----------------------------------------------------
-- 3.4 BILLING
-- -----------------------------------------------------

-- Invoices: Billing documents
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number TEXT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,

  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,

  currency_code TEXT DEFAULT 'COP',

  -- Metadata
  notes TEXT,
  terms TEXT,

  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT unique_invoice_number UNIQUE (workspace_id, invoice_number)
);

-- Invoice Items: Line items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  -- Optional links
  appointment_id UUID REFERENCES appointments(id),
  package_purchase_id UUID REFERENCES package_purchases(id),

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments: Payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency_code TEXT DEFAULT 'COP',
  payment_method payment_method NOT NULL,

  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_number TEXT,
  notes TEXT,

  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.5 REMINDERS & NOTIFICATIONS
-- -----------------------------------------------------

-- Reminders: Scheduled notifications
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  channel reminder_channel NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',

  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,

  recipient_email TEXT,
  recipient_phone TEXT,

  message TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.6 AUDIT LOG
-- -----------------------------------------------------

-- Audit Log: Track all changes
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE

  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],

  actor_user_id UUID REFERENCES profiles(id),
  workspace_id UUID REFERENCES workspaces(id),

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);

-- Workspaces
CREATE INDEX idx_workspaces_slug ON workspaces(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_workspaces_created_by ON workspaces(created_by);

-- Workspace Members
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_active ON workspace_members(workspace_id, user_id) WHERE is_active = true;

-- Clients
CREATE INDEX idx_clients_workspace ON clients(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_name ON clients(workspace_id, last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_phone ON clients(workspace_id, phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX idx_clients_email ON clients(workspace_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_clients_active ON clients(workspace_id) WHERE is_active = true AND deleted_at IS NULL;

-- Appointments (CRITICAL for performance)
CREATE INDEX idx_appointments_workspace ON appointments(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_client ON appointments(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_provider ON appointments(provider_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_start_time ON appointments(workspace_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_date_range ON appointments(workspace_id, start_time, end_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_status ON appointments(workspace_id, status) WHERE deleted_at IS NULL;
-- Upcoming appointments (most common query)
CREATE INDEX idx_appointments_upcoming ON appointments(workspace_id, provider_id, start_time)
  WHERE status = 'scheduled' AND deleted_at IS NULL;
-- Provider schedule lookup
CREATE INDEX idx_appointments_provider_schedule ON appointments(provider_id, start_time, end_time)
  WHERE status IN ('scheduled', 'completed') AND deleted_at IS NULL;

-- Session Notes
CREATE INDEX idx_session_notes_workspace ON session_notes(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_session_notes_client ON session_notes(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_session_notes_provider ON session_notes(provider_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_session_notes_appointment ON session_notes(appointment_id);

-- Packages
CREATE INDEX idx_packages_workspace ON packages(workspace_id) WHERE deleted_at IS NULL AND is_active = true;

-- Package Purchases
CREATE INDEX idx_package_purchases_workspace ON package_purchases(workspace_id);
CREATE INDEX idx_package_purchases_client ON package_purchases(client_id);
CREATE INDEX idx_package_purchases_active ON package_purchases(client_id)
  WHERE is_active = true AND sessions_remaining > 0;

-- Invoices
CREATE INDEX idx_invoices_workspace ON invoices(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_client ON invoices(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_number ON invoices(workspace_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON invoices(workspace_id, due_date) WHERE status IN ('pending', 'overdue') AND deleted_at IS NULL;

-- Invoice Items
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Payments
CREATE INDEX idx_payments_workspace ON payments(workspace_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_date ON payments(workspace_id, payment_date);

-- Reminders
CREATE INDEX idx_reminders_workspace ON reminders(workspace_id);
CREATE INDEX idx_reminders_appointment ON reminders(appointment_id);
CREATE INDEX idx_reminders_scheduled ON reminders(status, scheduled_for) WHERE status = 'pending';

-- Audit Log
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_user_id, created_at);
CREATE INDEX idx_audit_log_workspace ON audit_log(workspace_id, created_at);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- -----------------------------------------------------
-- 5.1 Updated At Trigger
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workspace_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON session_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON package_purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 5.2 Appointment Conflict Detection
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Only check for scheduled appointments
  IF NEW.status != 'scheduled' THEN
    RETURN NEW;
  END IF;

  -- Check for overlapping appointments for the same provider
  SELECT COUNT(*) INTO conflict_count
  FROM appointments
  WHERE
    id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND provider_id = NEW.provider_id
    AND status = 'scheduled'
    AND deleted_at IS NULL
    AND (
      -- New appointment starts during existing appointment
      (NEW.start_time >= start_time AND NEW.start_time < end_time)
      OR
      -- New appointment ends during existing appointment
      (NEW.end_time > start_time AND NEW.end_time <= end_time)
      OR
      -- New appointment completely contains existing appointment
      (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Appointment conflict detected for provider at this time';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_appointment_conflict_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_conflict();

-- -----------------------------------------------------
-- 5.3 Package Session Consumption
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION consume_package_session()
RETURNS TRIGGER AS $$
BEGIN
  -- When appointment is marked as completed and has a package purchase
  IF NEW.status = 'completed'
     AND OLD.status != 'completed'
     AND NEW.package_purchase_id IS NOT NULL THEN

    -- Increment sessions_used
    UPDATE package_purchases
    SET sessions_used = sessions_used + 1
    WHERE id = NEW.package_purchase_id
      AND sessions_used < sessions_total; -- Prevent over-consumption

    -- Check if update succeeded
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Package purchase not found or all sessions already used';
    END IF;
  END IF;

  -- If appointment is changed from completed to another status, decrement
  IF OLD.status = 'completed'
     AND NEW.status != 'completed'
     AND NEW.package_purchase_id IS NOT NULL THEN

    UPDATE package_purchases
    SET sessions_used = GREATEST(0, sessions_used - 1)
    WHERE id = NEW.package_purchase_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consume_package_session_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION consume_package_session();

-- -----------------------------------------------------
-- 5.4 Auto-update Invoice Totals
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION recalculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal DECIMAL(12,2);
  invoice_tax DECIMAL(12,2);
  invoice_total DECIMAL(12,2);
BEGIN
  -- Calculate subtotal from all items
  SELECT COALESCE(SUM(amount), 0) INTO invoice_subtotal
  FROM invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update invoice
  UPDATE invoices
  SET
    subtotal = invoice_subtotal,
    tax_amount = ROUND(invoice_subtotal * tax_rate, 2),
    total = invoice_subtotal + ROUND(invoice_subtotal * tax_rate, 2) - discount_amount
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_totals();

-- -----------------------------------------------------
-- 5.5 Update Invoice Amount Paid
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION update_invoice_amount_paid()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(12,2);
BEGIN
  -- Calculate total payments
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update invoice
  UPDATE invoices
  SET
    amount_paid = total_paid,
    status = CASE
      WHEN total_paid >= total THEN 'paid'::invoice_status
      WHEN total_paid > 0 THEN 'pending'::invoice_status
      ELSE status
    END,
    paid_at = CASE
      WHEN total_paid >= total AND paid_at IS NULL THEN NOW()
      ELSE paid_at
    END
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_amount_paid_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_amount_paid();

-- -----------------------------------------------------
-- 5.6 Auto-create Profile on User Signup
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Check if user is workspace member
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
      AND user_id = user_uuid
      AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get user's workspace IDs
CREATE OR REPLACE FUNCTION get_user_workspace_ids(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT workspace_id
  FROM workspace_members
  WHERE user_id = user_uuid
    AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check appointment availability (for API use)
CREATE OR REPLACE FUNCTION is_time_slot_available(
  provider_uuid UUID,
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ,
  exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE provider_id = provider_uuid
      AND status = 'scheduled'
      AND deleted_at IS NULL
      AND id != COALESCE(exclude_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (slot_start >= start_time AND slot_start < end_time)
        OR (slot_end > start_time AND slot_end <= end_time)
        OR (slot_start <= start_time AND slot_end >= end_time)
      )
  );
$$ LANGUAGE sql STABLE;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 7.1 Profiles
-- -----------------------------------------------------

-- Users can view all profiles (for workspace member lookups)
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (via trigger)
CREATE POLICY profiles_insert ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------
-- 7.2 Workspaces
-- -----------------------------------------------------

-- Members can view their workspaces
CREATE POLICY workspaces_select ON workspaces
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Users can create workspaces
CREATE POLICY workspaces_insert ON workspaces
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Owners/admins can update
CREATE POLICY workspaces_update ON workspaces
  FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- Owners can soft delete
CREATE POLICY workspaces_delete ON workspaces
  FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
  );

-- -----------------------------------------------------
-- 7.3 Workspace Members
-- -----------------------------------------------------

-- Members can view members in their workspaces
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Owners/admins can insert members
CREATE POLICY workspace_members_insert ON workspace_members
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- Owners/admins can update members
CREATE POLICY workspace_members_update ON workspace_members
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- Owners/admins can delete members
CREATE POLICY workspace_members_delete ON workspace_members
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- -----------------------------------------------------
-- 7.4 Clients
-- -----------------------------------------------------

-- Workspace members can view clients
CREATE POLICY clients_select ON clients
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can create clients
CREATE POLICY clients_insert ON clients
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    AND auth.uid() = created_by
  );

-- Workspace members can update clients
CREATE POLICY clients_update ON clients
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Owners/admins can soft delete clients
CREATE POLICY clients_delete ON clients
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- -----------------------------------------------------
-- 7.5 Appointments
-- -----------------------------------------------------

-- Workspace members can view appointments
CREATE POLICY appointments_select ON appointments
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can create appointments
CREATE POLICY appointments_insert ON appointments
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    AND auth.uid() = created_by
  );

-- Workspace members can update appointments
CREATE POLICY appointments_update ON appointments
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Providers can soft delete their own appointments
CREATE POLICY appointments_delete ON appointments
  FOR UPDATE
  USING (
    provider_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------
-- 7.6 Session Notes (HIGHLY SENSITIVE)
-- -----------------------------------------------------

-- Only the provider can view their own session notes
CREATE POLICY session_notes_select ON session_notes
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND provider_id = auth.uid()
  );

-- Only the provider can create session notes
CREATE POLICY session_notes_insert ON session_notes
  FOR INSERT
  WITH CHECK (
    provider_id = auth.uid()
    AND workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Only the provider can update their own session notes
CREATE POLICY session_notes_update ON session_notes
  FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- Only the provider can delete their own session notes
CREATE POLICY session_notes_delete ON session_notes
  FOR DELETE
  USING (provider_id = auth.uid());

-- -----------------------------------------------------
-- 7.7 Packages
-- -----------------------------------------------------

-- Workspace members can view packages
CREATE POLICY packages_select ON packages
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can create packages
CREATE POLICY packages_insert ON packages
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    AND auth.uid() = created_by
  );

-- Workspace members can update packages
CREATE POLICY packages_update ON packages
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- -----------------------------------------------------
-- 7.8 Package Purchases
-- -----------------------------------------------------

-- Workspace members can view package purchases
CREATE POLICY package_purchases_select ON package_purchases
  FOR SELECT
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can create package purchases
CREATE POLICY package_purchases_insert ON package_purchases
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    AND auth.uid() = created_by
  );

-- Workspace members can update package purchases
CREATE POLICY package_purchases_update ON package_purchases
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- -----------------------------------------------------
-- 7.9 Invoices
-- -----------------------------------------------------

-- Workspace members can view invoices
CREATE POLICY invoices_select ON invoices
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can create invoices
CREATE POLICY invoices_insert ON invoices
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    AND auth.uid() = created_by
  );

-- Workspace members can update invoices
CREATE POLICY invoices_update ON invoices
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- -----------------------------------------------------
-- 7.10 Invoice Items
-- -----------------------------------------------------

-- Workspace members can view invoice items (via invoice)
CREATE POLICY invoice_items_select ON invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

-- Workspace members can create invoice items
CREATE POLICY invoice_items_insert ON invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

-- Workspace members can update invoice items
CREATE POLICY invoice_items_update ON invoice_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

-- Workspace members can delete invoice items
CREATE POLICY invoice_items_delete ON invoice_items
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

-- -----------------------------------------------------
-- 7.11 Payments
-- -----------------------------------------------------

-- Workspace members can view payments
CREATE POLICY payments_select ON payments
  FOR SELECT
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can create payments
CREATE POLICY payments_insert ON payments
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    AND auth.uid() = created_by
  );

-- Workspace members can update payments
CREATE POLICY payments_update ON payments
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- -----------------------------------------------------
-- 7.12 Reminders
-- -----------------------------------------------------

-- Workspace members can view reminders
CREATE POLICY reminders_select ON reminders
  FOR SELECT
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can create reminders
CREATE POLICY reminders_insert ON reminders
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- Workspace members can update reminders
CREATE POLICY reminders_update ON reminders
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  );

-- -----------------------------------------------------
-- 7.13 Audit Log
-- -----------------------------------------------------

-- Workspace members can view audit logs for their workspace
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT
  USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    OR actor_user_id = auth.uid()
  );

-- System can insert audit logs (via triggers)
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 8. VIEWS
-- =====================================================

-- -----------------------------------------------------
-- 8.1 Upcoming Appointments (Next 7 days)
-- -----------------------------------------------------

CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT
  a.id,
  a.workspace_id,
  a.start_time,
  a.end_time,
  a.status,
  a.title,
  a.location,
  c.first_name || ' ' || c.last_name AS client_name,
  c.phone AS client_phone,
  c.email AS client_email,
  p.full_name AS provider_name,
  p.email AS provider_email,
  EXTRACT(EPOCH FROM (a.start_time - NOW())) / 3600 AS hours_until_appointment
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN profiles p ON a.provider_id = p.id
WHERE a.status = 'scheduled'
  AND a.deleted_at IS NULL
  AND a.start_time >= NOW()
  AND a.start_time <= NOW() + INTERVAL '7 days'
ORDER BY a.start_time;

-- -----------------------------------------------------
-- 8.2 Client Invoice Summary
-- -----------------------------------------------------

CREATE OR REPLACE VIEW client_invoice_summary AS
SELECT
  i.workspace_id,
  i.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  COUNT(i.id) AS total_invoices,
  SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) AS paid_invoices,
  SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) AS pending_invoices,
  SUM(CASE WHEN i.status = 'overdue' THEN 1 ELSE 0 END) AS overdue_invoices,
  SUM(i.total) AS total_billed,
  SUM(i.amount_paid) AS total_paid,
  SUM(i.amount_due) AS total_outstanding
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.deleted_at IS NULL
GROUP BY i.workspace_id, i.client_id, c.first_name, c.last_name;

-- -----------------------------------------------------
-- 8.3 Package Remaining by Client
-- -----------------------------------------------------

CREATE OR REPLACE VIEW client_package_summary AS
SELECT
  pp.workspace_id,
  pp.client_id,
  c.first_name || ' ' || c.last_name AS client_name,
  p.name AS package_name,
  pp.sessions_total,
  pp.sessions_used,
  pp.sessions_remaining,
  pp.purchased_at,
  pp.expires_at,
  CASE
    WHEN pp.expires_at IS NOT NULL AND pp.expires_at < NOW() THEN 'expired'
    WHEN pp.sessions_remaining = 0 THEN 'depleted'
    WHEN pp.sessions_remaining <= 2 THEN 'low'
    ELSE 'active'
  END AS status
FROM package_purchases pp
JOIN clients c ON pp.client_id = c.id
JOIN packages p ON pp.package_id = p.id
WHERE pp.is_active = true
ORDER BY pp.client_id, pp.purchased_at DESC;

-- -----------------------------------------------------
-- 8.4 Provider Schedule (Today's appointments)
-- -----------------------------------------------------

CREATE OR REPLACE VIEW provider_daily_schedule AS
SELECT
  a.provider_id,
  p.full_name AS provider_name,
  a.workspace_id,
  a.id AS appointment_id,
  a.start_time,
  a.end_time,
  a.status,
  c.first_name || ' ' || c.last_name AS client_name,
  c.phone AS client_phone,
  a.title,
  a.location,
  EXISTS(SELECT 1 FROM session_notes WHERE appointment_id = a.id) AS has_notes
FROM appointments a
JOIN profiles p ON a.provider_id = p.id
JOIN clients c ON a.client_id = c.id
WHERE a.deleted_at IS NULL
  AND DATE(a.start_time AT TIME ZONE 'America/Bogota') = CURRENT_DATE
ORDER BY a.start_time;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

COMMENT ON DATABASE postgres IS 'Mindesk - Psychologist Practice Management System';
