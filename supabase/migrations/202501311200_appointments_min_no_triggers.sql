-- =====================================================
-- MIGRATION: appointments_min_no_triggers
-- Fecha: 2025-01-31
-- Objetivo: Asegurar tabla appointments con estados y RLS mínimo
-- SIN triggers, funciones, vistas ni audit_log
-- =====================================================

-- =====================================================
-- 1. ENUM appointment_status
-- =====================================================
-- Crear enum si no existe, agregar valores faltantes si existe
DO $$
BEGIN
  -- Intentar crear el enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'canceled', 'no_show');
    RAISE NOTICE 'ENUM appointment_status creado';
  ELSE
    -- Verificar y agregar valores faltantes
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'appointment_status'::regtype AND enumlabel = 'scheduled') THEN
      ALTER TYPE appointment_status ADD VALUE 'scheduled';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'appointment_status'::regtype AND enumlabel = 'completed') THEN
      ALTER TYPE appointment_status ADD VALUE 'completed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'appointment_status'::regtype AND enumlabel = 'canceled') THEN
      ALTER TYPE appointment_status ADD VALUE 'canceled';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'appointment_status'::regtype AND enumlabel = 'no_show') THEN
      ALTER TYPE appointment_status ADD VALUE 'no_show';
    END IF;
    RAISE NOTICE 'ENUM appointment_status verificado';
  END IF;
END $$;

-- =====================================================
-- 2. TABLA appointments
-- =====================================================
-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/Bogota',
  status appointment_status NOT NULL DEFAULT 'scheduled',
  title TEXT,
  description TEXT,
  location TEXT,
  package_purchase_id UUID,
  is_billable BOOLEAN DEFAULT true,
  canceled_at TIMESTAMPTZ,
  canceled_by UUID,
  cancellation_reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Asegurar columnas que podrían faltar (idempotente)
DO $$
BEGIN
  -- canceled_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'appointments' AND column_name = 'canceled_at') THEN
    ALTER TABLE appointments ADD COLUMN canceled_at TIMESTAMPTZ;
    RAISE NOTICE 'Columna canceled_at agregada';
  END IF;

  -- canceled_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'appointments' AND column_name = 'canceled_by') THEN
    ALTER TABLE appointments ADD COLUMN canceled_by UUID;
    RAISE NOTICE 'Columna canceled_by agregada';
  END IF;

  -- cancellation_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'appointments' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT;
    RAISE NOTICE 'Columna cancellation_reason agregada';
  END IF;

  -- updated_at (con default)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'appointments' AND column_name = 'updated_at') THEN
    ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Columna updated_at agregada';
  END IF;

  -- deleted_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'appointments' AND column_name = 'deleted_at') THEN
    ALTER TABLE appointments ADD COLUMN deleted_at TIMESTAMPTZ;
    RAISE NOTICE 'Columna deleted_at agregada';
  END IF;
END $$;

-- CHECK constraint (end_time > start_time)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'appointments'::regclass
    AND contype = 'c'
    AND conname = 'valid_time_range'
  ) THEN
    ALTER TABLE appointments ADD CONSTRAINT valid_time_range CHECK (end_time > start_time);
    RAISE NOTICE 'CHECK constraint valid_time_range agregado';
  END IF;
END $$;

-- =====================================================
-- 3. FOREIGN KEYS (solo si tablas destino existen)
-- =====================================================
DO $$
BEGIN
  -- FK workspace_id -> workspaces(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_workspace_id_fkey') THEN
      ALTER TABLE appointments ADD CONSTRAINT appointments_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
      RAISE NOTICE 'FK appointments_workspace_id_fkey agregada';
    END IF;
  ELSE
    RAISE NOTICE 'FALTANTE: tabla workspaces no existe, FK omitida';
  END IF;

  -- FK client_id -> clients(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_client_id_fkey') THEN
      ALTER TABLE appointments ADD CONSTRAINT appointments_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
      RAISE NOTICE 'FK appointments_client_id_fkey agregada';
    END IF;
  ELSE
    RAISE NOTICE 'FALTANTE: tabla clients no existe, FK omitida';
  END IF;

  -- FK provider_id -> profiles(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_provider_id_fkey') THEN
      ALTER TABLE appointments ADD CONSTRAINT appointments_provider_id_fkey
        FOREIGN KEY (provider_id) REFERENCES profiles(id);
      RAISE NOTICE 'FK appointments_provider_id_fkey agregada';
    END IF;

    -- FK canceled_by -> profiles(id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_canceled_by_fkey') THEN
      ALTER TABLE appointments ADD CONSTRAINT appointments_canceled_by_fkey
        FOREIGN KEY (canceled_by) REFERENCES profiles(id);
      RAISE NOTICE 'FK appointments_canceled_by_fkey agregada';
    END IF;

    -- FK created_by -> profiles(id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_created_by_fkey') THEN
      ALTER TABLE appointments ADD CONSTRAINT appointments_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES profiles(id);
      RAISE NOTICE 'FK appointments_created_by_fkey agregada';
    END IF;
  ELSE
    RAISE NOTICE 'FALTANTE: tabla profiles no existe, FKs omitidas';
  END IF;
END $$;

-- =====================================================
-- 4. ÍNDICES (solo si no existen)
-- =====================================================
-- Nota: Algunos índices pueden ya existir con nombres diferentes del schema original.
-- Solo creamos si no existe un índice equivalente.

-- Índice workspace (puede existir como idx_appointments_workspace)
CREATE INDEX IF NOT EXISTS idx_appointments_workspace
  ON appointments(workspace_id) WHERE deleted_at IS NULL;

-- Índice workspace+start_time (puede existir como idx_appointments_start_time)
CREATE INDEX IF NOT EXISTS idx_appointments_start_time
  ON appointments(workspace_id, start_time) WHERE deleted_at IS NULL;

-- Índice workspace+status (puede existir como idx_appointments_status)
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(workspace_id, status) WHERE deleted_at IS NULL;

-- Índice provider (puede existir como idx_appointments_provider)
CREATE INDEX IF NOT EXISTS idx_appointments_provider
  ON appointments(provider_id) WHERE deleted_at IS NULL;

-- =====================================================
-- 5. ROW LEVEL SECURITY (con subqueries directos, SIN funciones helper)
-- =====================================================
-- Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrear con subquery directo
-- (las políticas originales usan get_user_workspace_ids() que queremos evitar)
DROP POLICY IF EXISTS appointments_select ON appointments;
DROP POLICY IF EXISTS appointments_insert ON appointments;
DROP POLICY IF EXISTS appointments_update ON appointments;
DROP POLICY IF EXISTS appointments_delete ON appointments;

-- SELECT: miembros activos del workspace pueden ver citas (excluye soft-deleted)
CREATE POLICY appointments_select ON appointments
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- INSERT: miembros activos del workspace pueden crear, created_by = usuario actual
CREATE POLICY appointments_insert ON appointments
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND created_by = auth.uid()
  );

-- UPDATE: miembros activos del workspace pueden actualizar
CREATE POLICY appointments_update ON appointments
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Nota: No se crea política DELETE porque usamos soft-delete (UPDATE deleted_at)
-- La política appointments_update ya permite hacer soft-delete

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN PARA EL BACKEND
-- =====================================================
--
-- Estados soportados en appointment_status:
--   - 'scheduled': cita programada (default al crear)
--   - 'completed': cita completada exitosamente
--   - 'no_show': paciente no se presentó
--   - 'canceled': cita cancelada
--
-- FLUJO: Marcar cita como completada
--   UPDATE appointments
--   SET status = 'completed', updated_at = NOW()
--   WHERE id = :appointment_id;
--
-- FLUJO: Marcar cita como no_show
--   UPDATE appointments
--   SET status = 'no_show', updated_at = NOW()
--   WHERE id = :appointment_id;
--
-- FLUJO: Cancelar cita
--   UPDATE appointments
--   SET status = 'canceled',
--       canceled_at = NOW(),
--       canceled_by = auth.uid(),
--       cancellation_reason = :reason,
--       updated_at = NOW()
--   WHERE id = :appointment_id;
--
-- FLUJO: Reagendar = cancelar + crear nueva
--   1. Cancelar la cita original:
--      UPDATE appointments
--      SET status = 'canceled',
--          canceled_at = NOW(),
--          canceled_by = auth.uid(),
--          cancellation_reason = 'Reagendada',
--          updated_at = NOW()
--      WHERE id = :old_appointment_id;
--
--   2. Crear nueva cita:
--      INSERT INTO appointments (workspace_id, client_id, provider_id, start_time, end_time, ...)
--      VALUES (:workspace_id, :client_id, :provider_id, :new_start, :new_end, ...);
--
-- IMPORTANTE: updated_at NO se actualiza automáticamente (NO hay triggers)
--   El backend DEBE incluir updated_at = NOW() en cada UPDATE
--
-- =====================================================
