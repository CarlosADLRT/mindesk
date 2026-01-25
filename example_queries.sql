-- =====================================================
-- MINDESK - EXAMPLE QUERIES
-- =====================================================
-- Common application flows and how to interact with the schema
-- =====================================================

-- =====================================================
-- 1. USER ONBOARDING
-- =====================================================

-- -----------------------------------------------------
-- 1.1 Create First Workspace (after user signs up)
-- -----------------------------------------------------

-- When a user signs up, profile is auto-created via trigger.
-- Next, create their first workspace:

WITH new_workspace AS (
  INSERT INTO workspaces (name, created_by, slug)
  VALUES (
    'Mi Consultorio',
    auth.uid(),
    'mi-consultorio-' || substr(md5(random()::text), 1, 8)
  )
  RETURNING id, name
)
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT id, auth.uid(), 'owner'::workspace_role
FROM new_workspace
RETURNING *;

-- -----------------------------------------------------
-- 1.2 Get User's Workspaces
-- -----------------------------------------------------

SELECT
  w.id,
  w.name,
  w.slug,
  wm.role,
  w.created_at
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = auth.uid()
  AND wm.is_active = true
  AND w.deleted_at IS NULL
ORDER BY w.created_at DESC;

-- =====================================================
-- 2. CLIENT MANAGEMENT
-- =====================================================

-- -----------------------------------------------------
-- 2.1 Create New Client
-- -----------------------------------------------------

INSERT INTO clients (
  workspace_id,
  first_name,
  last_name,
  email,
  phone,
  date_of_birth,
  gender,
  created_by
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::uuid, -- workspace_id
  'María',
  'González',
  'maria.gonzalez@example.com',
  '+57 300 123 4567',
  '1990-05-15',
  'Femenino',
  auth.uid()
)
RETURNING *;

-- -----------------------------------------------------
-- 2.2 Search Clients by Name or Phone
-- -----------------------------------------------------

SELECT
  id,
  first_name || ' ' || last_name AS full_name,
  email,
  phone,
  date_of_birth,
  is_active
FROM clients
WHERE workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND deleted_at IS NULL
  AND (
    first_name ILIKE '%mar%'
    OR last_name ILIKE '%mar%'
    OR phone ILIKE '%300%'
  )
ORDER BY last_name, first_name
LIMIT 20;

-- -----------------------------------------------------
-- 2.3 Get Client Details with Stats
-- -----------------------------------------------------

SELECT
  c.id,
  c.first_name || ' ' || c.last_name AS full_name,
  c.email,
  c.phone,
  c.date_of_birth,
  c.is_active,

  -- Appointment stats
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS total_sessions,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'scheduled' AND a.start_time >= NOW()) AS upcoming_appointments,
  MAX(a.start_time) FILTER (WHERE a.status = 'completed') AS last_session_date,

  -- Package stats
  SUM(pp.sessions_remaining) AS total_sessions_remaining,

  -- Billing stats
  COALESCE(SUM(i.total), 0) AS total_billed,
  COALESCE(SUM(i.amount_due), 0) AS outstanding_balance

FROM clients c
LEFT JOIN appointments a ON c.id = a.client_id AND a.deleted_at IS NULL
LEFT JOIN package_purchases pp ON c.id = pp.client_id AND pp.is_active = true
LEFT JOIN invoices i ON c.id = i.client_id AND i.deleted_at IS NULL AND i.status != 'paid'
WHERE c.id = '123e4567-e89b-12d3-a456-426614174001'::uuid
GROUP BY c.id;

-- =====================================================
-- 3. APPOINTMENT SCHEDULING
-- =====================================================

-- -----------------------------------------------------
-- 3.1 Check Provider Availability
-- -----------------------------------------------------

SELECT is_time_slot_available(
  '123e4567-e89b-12d3-a456-426614174002'::uuid, -- provider_id
  '2026-01-25 10:00:00-05'::timestamptz,        -- start_time
  '2026-01-25 11:00:00-05'::timestamptz         -- end_time
) AS is_available;

-- -----------------------------------------------------
-- 3.2 Schedule New Appointment
-- -----------------------------------------------------

INSERT INTO appointments (
  workspace_id,
  client_id,
  provider_id,
  start_time,
  end_time,
  title,
  location,
  status,
  created_by
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::uuid,  -- workspace_id
  '123e4567-e89b-12d3-a456-426614174001'::uuid,  -- client_id
  auth.uid(),                                     -- provider_id
  '2026-01-25 10:00:00-05'::timestamptz,
  '2026-01-25 11:00:00-05'::timestamptz,
  'Sesión de terapia',
  'Consultorio Principal',
  'scheduled',
  auth.uid()
)
RETURNING *;

-- -----------------------------------------------------
-- 3.3 Get Provider's Schedule for a Date Range
-- -----------------------------------------------------

SELECT
  a.id,
  a.start_time,
  a.end_time,
  a.status,
  a.title,
  a.location,
  c.first_name || ' ' || c.last_name AS client_name,
  c.phone AS client_phone,
  EXISTS(SELECT 1 FROM session_notes WHERE appointment_id = a.id) AS has_notes
FROM appointments a
JOIN clients c ON a.client_id = c.id
WHERE a.provider_id = auth.uid()
  AND a.deleted_at IS NULL
  AND a.start_time >= '2026-01-25 00:00:00-05'::timestamptz
  AND a.start_time < '2026-02-01 00:00:00-05'::timestamptz
ORDER BY a.start_time;

-- -----------------------------------------------------
-- 3.4 Get Upcoming Appointments (Next 7 Days)
-- -----------------------------------------------------

SELECT
  id,
  start_time,
  end_time,
  client_name,
  client_phone,
  provider_name,
  status,
  title,
  location,
  hours_until_appointment
FROM upcoming_appointments
WHERE workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND provider_id = auth.uid()
ORDER BY start_time
LIMIT 20;

-- -----------------------------------------------------
-- 3.5 Reschedule Appointment
-- -----------------------------------------------------

UPDATE appointments
SET
  start_time = '2026-01-26 14:00:00-05'::timestamptz,
  end_time = '2026-01-26 15:00:00-05'::timestamptz
WHERE id = '123e4567-e89b-12d3-a456-426614174003'::uuid
  AND provider_id = auth.uid()
RETURNING *;

-- -----------------------------------------------------
-- 3.6 Cancel Appointment
-- -----------------------------------------------------

UPDATE appointments
SET
  status = 'canceled',
  canceled_at = NOW(),
  canceled_by = auth.uid(),
  cancellation_reason = 'Cliente canceló con 24h de anticipación'
WHERE id = '123e4567-e89b-12d3-a456-426614174003'::uuid
  AND provider_id = auth.uid()
RETURNING *;

-- =====================================================
-- 4. SESSION NOTES (THERAPY RECORDS)
-- =====================================================

-- -----------------------------------------------------
-- 4.1 Complete Appointment and Create Session Note
-- -----------------------------------------------------

-- Step 1: Mark appointment as completed
UPDATE appointments
SET status = 'completed'
WHERE id = '123e4567-e89b-12d3-a456-426614174003'::uuid
  AND provider_id = auth.uid()
RETURNING *;

-- Step 2: Create session note
INSERT INTO session_notes (
  appointment_id,
  workspace_id,
  client_id,
  provider_id,
  subjective,
  objective,
  assessment,
  plan,
  session_number,
  duration_minutes,
  mood_rating,
  progress_rating,
  tags,
  interventions
) VALUES (
  '123e4567-e89b-12d3-a456-426614174003'::uuid,  -- appointment_id
  '123e4567-e89b-12d3-a456-426614174000'::uuid,  -- workspace_id
  '123e4567-e89b-12d3-a456-426614174001'::uuid,  -- client_id
  auth.uid(),                                     -- provider_id
  'Cliente reporta mejoría en síntomas de ansiedad. Durmió mejor esta semana.',
  'Paciente se observa más relajado, buen contacto visual, lenguaje corporal abierto.',
  'Avance positivo en manejo de técnicas de respiración. Continuar con exposición gradual.',
  'Tarea: Practicar respiración diafragmática 2x/día. Registro de pensamientos automáticos.',
  5, -- session_number
  60, -- duration_minutes
  7, -- mood_rating (1-10)
  8, -- progress_rating (1-10)
  ARRAY['ansiedad', 'tcc', 'respiración'],
  ARRAY['Reestructuración cognitiva', 'Técnicas de respiración', 'Exposición gradual']
)
RETURNING *;

-- -----------------------------------------------------
-- 4.2 Get Client's Session History
-- -----------------------------------------------------

SELECT
  sn.id,
  a.start_time AS session_date,
  sn.session_number,
  sn.duration_minutes,
  sn.mood_rating,
  sn.progress_rating,
  sn.assessment,
  sn.tags,
  sn.created_at
FROM session_notes sn
JOIN appointments a ON sn.appointment_id = a.id
WHERE sn.client_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
  AND sn.provider_id = auth.uid()
  AND sn.deleted_at IS NULL
ORDER BY a.start_time DESC
LIMIT 10;

-- -----------------------------------------------------
-- 4.3 Get Session Note Details
-- -----------------------------------------------------

SELECT
  sn.*,
  a.start_time AS session_date,
  c.first_name || ' ' || c.last_name AS client_name
FROM session_notes sn
JOIN appointments a ON sn.appointment_id = a.id
JOIN clients c ON sn.client_id = c.id
WHERE sn.id = '123e4567-e89b-12d3-a456-426614174004'::uuid
  AND sn.provider_id = auth.uid()
  AND sn.deleted_at IS NULL;

-- =====================================================
-- 5. PACKAGES & SESSION CONSUMPTION
-- =====================================================

-- -----------------------------------------------------
-- 5.1 Create Package Definition
-- -----------------------------------------------------

INSERT INTO packages (
  workspace_id,
  name,
  description,
  number_of_sessions,
  price,
  currency_code,
  validity_days,
  created_by
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  'Paquete Mensual (4 sesiones)',
  'Paquete de 4 sesiones con validez de 30 días',
  4,
  400000, -- 400,000 COP
  'COP',
  30,
  auth.uid()
)
RETURNING *;

-- -----------------------------------------------------
-- 5.2 Get Active Packages
-- -----------------------------------------------------

SELECT
  id,
  name,
  description,
  number_of_sessions,
  price,
  currency_code,
  validity_days
FROM packages
WHERE workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND is_active = true
  AND deleted_at IS NULL
ORDER BY price;

-- -----------------------------------------------------
-- 5.3 Sell Package to Client
-- -----------------------------------------------------

INSERT INTO package_purchases (
  workspace_id,
  client_id,
  package_id,
  sessions_total,
  price_paid,
  currency_code,
  purchased_at,
  expires_at,
  created_by
)
SELECT
  p.workspace_id,
  '123e4567-e89b-12d3-a456-426614174001'::uuid,  -- client_id
  p.id,
  p.number_of_sessions,
  p.price,
  p.currency_code,
  NOW(),
  CASE WHEN p.validity_days IS NOT NULL
    THEN NOW() + (p.validity_days || ' days')::interval
    ELSE NULL
  END,
  auth.uid()
FROM packages p
WHERE p.id = '123e4567-e89b-12d3-a456-426614174005'::uuid
RETURNING *;

-- -----------------------------------------------------
-- 5.4 Get Client's Active Packages
-- -----------------------------------------------------

SELECT
  pp.id,
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
JOIN packages p ON pp.package_id = p.id
WHERE pp.client_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
  AND pp.is_active = true
ORDER BY pp.purchased_at DESC;

-- -----------------------------------------------------
-- 5.5 Schedule Appointment Using Package
-- -----------------------------------------------------

-- Find available package first
WITH available_package AS (
  SELECT id
  FROM package_purchases
  WHERE client_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
    AND is_active = true
    AND sessions_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY purchased_at
  LIMIT 1
)
INSERT INTO appointments (
  workspace_id,
  client_id,
  provider_id,
  start_time,
  end_time,
  title,
  package_purchase_id, -- Link to package
  created_by
)
SELECT
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '123e4567-e89b-12d3-a456-426614174001'::uuid,
  auth.uid(),
  '2026-01-26 15:00:00-05'::timestamptz,
  '2026-01-26 16:00:00-05'::timestamptz,
  'Sesión de terapia (Paquete)',
  ap.id,
  auth.uid()
FROM available_package ap
RETURNING *;

-- Note: When appointment is marked as 'completed',
-- the trigger will automatically decrement sessions_remaining

-- -----------------------------------------------------
-- 5.6 Manually Consume Package Session (if needed)
-- -----------------------------------------------------

UPDATE package_purchases
SET sessions_used = sessions_used + 1
WHERE id = '123e4567-e89b-12d3-a456-426614174006'::uuid
  AND workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  AND sessions_used < sessions_total
RETURNING *;

-- =====================================================
-- 6. BILLING & INVOICING
-- =====================================================

-- -----------------------------------------------------
-- 6.1 Create Invoice for Client
-- -----------------------------------------------------

-- Generate invoice number (simple sequential example)
WITH next_invoice_number AS (
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+') AS INTEGER)) + 1,
    1
  ) AS number
  FROM invoices
  WHERE workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
)
INSERT INTO invoices (
  workspace_id,
  client_id,
  invoice_number,
  status,
  issue_date,
  due_date,
  tax_rate,
  created_by
)
SELECT
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '123e4567-e89b-12d3-a456-426614174001'::uuid,
  'INV-' || LPAD(number::text, 6, '0'),
  'draft',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  0.0000, -- No IVA for health services in Colombia
  auth.uid()
FROM next_invoice_number
RETURNING *;

-- -----------------------------------------------------
-- 6.2 Add Line Items to Invoice
-- -----------------------------------------------------

-- Add individual session
INSERT INTO invoice_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  appointment_id
) VALUES (
  '123e4567-e89b-12d3-a456-426614174007'::uuid,  -- invoice_id
  'Sesión de terapia individual - Enero 20',
  1,
  120000, -- 120,000 COP
  '123e4567-e89b-12d3-a456-426614174003'::uuid   -- appointment_id
);

-- Add package purchase
INSERT INTO invoice_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  package_purchase_id
) VALUES (
  '123e4567-e89b-12d3-a456-426614174007'::uuid,
  'Paquete Mensual (4 sesiones)',
  1,
  400000,
  '123e4567-e89b-12d3-a456-426614174006'::uuid
);

-- Note: Invoice totals will be auto-calculated by trigger

-- -----------------------------------------------------
-- 6.3 Finalize Invoice (Mark as Pending)
-- -----------------------------------------------------

UPDATE invoices
SET status = 'pending'
WHERE id = '123e4567-e89b-12d3-a456-426614174007'::uuid
  AND workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
RETURNING *;

-- -----------------------------------------------------
-- 6.4 Record Payment
-- -----------------------------------------------------

INSERT INTO payments (
  workspace_id,
  invoice_id,
  client_id,
  amount,
  currency_code,
  payment_method,
  payment_date,
  reference_number,
  notes,
  created_by
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '123e4567-e89b-12d3-a456-426614174007'::uuid,
  '123e4567-e89b-12d3-a456-426614174001'::uuid,
  400000,
  'COP',
  'transfer',
  NOW(),
  'TRX-2026-001',
  'Transferencia Bancolombia',
  auth.uid()
)
RETURNING *;

-- Note: Invoice status and amount_paid will be auto-updated by trigger

-- -----------------------------------------------------
-- 6.5 Get Client's Invoice Summary
-- -----------------------------------------------------

SELECT *
FROM client_invoice_summary
WHERE workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND client_id = '123e4567-e89b-12d3-a456-426614174001'::uuid;

-- -----------------------------------------------------
-- 6.6 Get Unpaid Invoices
-- -----------------------------------------------------

SELECT
  i.id,
  i.invoice_number,
  c.first_name || ' ' || c.last_name AS client_name,
  i.issue_date,
  i.due_date,
  i.total,
  i.amount_paid,
  i.amount_due,
  i.status,
  CASE
    WHEN i.due_date < CURRENT_DATE AND i.status = 'pending' THEN true
    ELSE false
  END AS is_overdue
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND i.status IN ('pending', 'overdue')
  AND i.deleted_at IS NULL
ORDER BY i.due_date;

-- -----------------------------------------------------
-- 6.7 Get Invoice Details with Items and Payments
-- -----------------------------------------------------

SELECT
  i.id AS invoice_id,
  i.invoice_number,
  i.status,
  i.issue_date,
  i.due_date,
  c.first_name || ' ' || c.last_name AS client_name,
  c.email AS client_email,

  -- Items
  json_agg(
    json_build_object(
      'id', ii.id,
      'description', ii.description,
      'quantity', ii.quantity,
      'unit_price', ii.unit_price,
      'amount', ii.amount
    ) ORDER BY ii.sort_order
  ) FILTER (WHERE ii.id IS NOT NULL) AS items,

  -- Payments
  json_agg(
    DISTINCT json_build_object(
      'id', p.id,
      'amount', p.amount,
      'payment_method', p.payment_method,
      'payment_date', p.payment_date,
      'reference_number', p.reference_number
    ) ORDER BY p.payment_date
  ) FILTER (WHERE p.id IS NOT NULL) AS payments,

  i.subtotal,
  i.tax_amount,
  i.discount_amount,
  i.total,
  i.amount_paid,
  i.amount_due

FROM invoices i
JOIN clients c ON i.client_id = c.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.id = '123e4567-e89b-12d3-a456-426614174007'::uuid
  AND i.workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
GROUP BY i.id, c.id;

-- =====================================================
-- 7. REMINDERS & NOTIFICATIONS
-- =====================================================

-- -----------------------------------------------------
-- 7.1 Create Reminder for Appointment
-- -----------------------------------------------------

INSERT INTO reminders (
  workspace_id,
  appointment_id,
  client_id,
  channel,
  scheduled_for,
  recipient_phone,
  message
)
SELECT
  a.workspace_id,
  a.id,
  a.client_id,
  'whatsapp'::reminder_channel,
  a.start_time - INTERVAL '24 hours', -- 24h before
  c.phone,
  'Recordatorio: Tienes una cita mañana a las ' ||
  TO_CHAR(a.start_time, 'HH24:MI') || '. ' ||
  'Ubicación: ' || COALESCE(a.location, 'Por confirmar')
FROM appointments a
JOIN clients c ON a.client_id = c.id
WHERE a.id = '123e4567-e89b-12d3-a456-426614174003'::uuid
RETURNING *;

-- -----------------------------------------------------
-- 7.2 Get Pending Reminders (for cron job)
-- -----------------------------------------------------

SELECT
  r.id,
  r.channel,
  r.scheduled_for,
  r.recipient_email,
  r.recipient_phone,
  r.message,
  a.start_time AS appointment_time,
  c.first_name || ' ' || c.last_name AS client_name
FROM reminders r
JOIN appointments a ON r.appointment_id = a.id
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'pending'
  AND r.scheduled_for <= NOW()
ORDER BY r.scheduled_for
LIMIT 100;

-- -----------------------------------------------------
-- 7.3 Mark Reminder as Sent
-- -----------------------------------------------------

UPDATE reminders
SET
  status = 'sent',
  sent_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174008'::uuid
RETURNING *;

-- =====================================================
-- 8. ANALYTICS & REPORTS
-- =====================================================

-- -----------------------------------------------------
-- 8.1 Revenue Report by Date Range
-- -----------------------------------------------------

SELECT
  DATE_TRUNC('day', p.payment_date) AS payment_day,
  COUNT(DISTINCT p.invoice_id) AS invoices_paid,
  COUNT(p.id) AS total_payments,
  SUM(p.amount) AS total_revenue,
  json_agg(
    json_build_object(
      'method', p.payment_method,
      'count', 1,
      'amount', p.amount
    )
  ) AS payment_breakdown
FROM payments p
WHERE p.workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND p.payment_date >= '2026-01-01'::date
  AND p.payment_date < '2026-02-01'::date
GROUP BY DATE_TRUNC('day', p.payment_date)
ORDER BY payment_day DESC;

-- -----------------------------------------------------
-- 8.2 Provider Performance (Sessions & Revenue)
-- -----------------------------------------------------

SELECT
  p.id AS provider_id,
  p.full_name AS provider_name,

  -- Session stats
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS completed_sessions,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'scheduled') AS scheduled_sessions,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'canceled') AS canceled_sessions,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'no_show') AS no_show_sessions,

  -- Client stats
  COUNT(DISTINCT a.client_id) AS unique_clients,

  -- Revenue (approximate via completed appointments)
  SUM(
    CASE WHEN a.status = 'completed' THEN 120000 ELSE 0 END
  ) AS estimated_revenue

FROM profiles p
JOIN workspace_members wm ON p.id = wm.user_id
LEFT JOIN appointments a ON p.id = a.provider_id
  AND a.deleted_at IS NULL
  AND a.start_time >= '2026-01-01'::date
  AND a.start_time < '2026-02-01'::date
WHERE wm.workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND wm.is_active = true
GROUP BY p.id, p.full_name
ORDER BY completed_sessions DESC;

-- -----------------------------------------------------
-- 8.3 Client Engagement Report
-- -----------------------------------------------------

SELECT
  c.id,
  c.first_name || ' ' || c.last_name AS client_name,
  c.created_at AS client_since,

  -- Appointment stats
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS total_sessions,
  MAX(a.start_time) FILTER (WHERE a.status = 'completed') AS last_session_date,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'scheduled' AND a.start_time >= NOW()) AS upcoming_sessions,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'no_show') AS no_show_count,

  -- Package stats
  SUM(pp.sessions_remaining) AS sessions_remaining,

  -- Billing stats
  COALESCE(SUM(i.total), 0) AS lifetime_value,
  COALESCE(SUM(i.amount_due), 0) AS outstanding_balance,

  -- Engagement score (simple)
  CASE
    WHEN MAX(a.start_time) FILTER (WHERE a.status = 'completed') > NOW() - INTERVAL '30 days' THEN 'active'
    WHEN MAX(a.start_time) FILTER (WHERE a.status = 'completed') > NOW() - INTERVAL '90 days' THEN 'at_risk'
    ELSE 'inactive'
  END AS engagement_status

FROM clients c
LEFT JOIN appointments a ON c.id = a.client_id AND a.deleted_at IS NULL
LEFT JOIN package_purchases pp ON c.id = pp.client_id AND pp.is_active = true
LEFT JOIN invoices i ON c.id = i.client_id AND i.deleted_at IS NULL
WHERE c.workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND c.deleted_at IS NULL
GROUP BY c.id
ORDER BY total_sessions DESC, last_session_date DESC;

-- -----------------------------------------------------
-- 8.4 Monthly Summary Dashboard
-- -----------------------------------------------------

WITH date_range AS (
  SELECT
    DATE_TRUNC('month', CURRENT_DATE) AS month_start,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' AS month_end
),
monthly_stats AS (
  SELECT
    -- Appointments
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS completed_appointments,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'scheduled' AND a.start_time >= NOW()) AS upcoming_appointments,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'canceled') AS canceled_appointments,

    -- Clients
    COUNT(DISTINCT a.client_id) AS active_clients,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= dr.month_start) AS new_clients,

    -- Revenue
    COALESCE(SUM(pay.amount), 0) AS revenue_collected,

    -- Invoices
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'paid') AS invoices_paid,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending') AS invoices_pending,
    COALESCE(SUM(i.amount_due) FILTER (WHERE i.status != 'paid'), 0) AS outstanding_receivables

  FROM date_range dr
  CROSS JOIN appointments a
  LEFT JOIN clients c ON a.client_id = c.id
  LEFT JOIN invoices i ON c.id = i.client_id AND i.deleted_at IS NULL
  LEFT JOIN payments pay ON i.id = pay.invoice_id AND pay.payment_date >= dr.month_start
  WHERE a.workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
    AND a.deleted_at IS NULL
    AND a.start_time >= dr.month_start
    AND a.start_time < dr.month_end
)
SELECT * FROM monthly_stats;

-- =====================================================
-- 9. ADMIN & WORKSPACE MANAGEMENT
-- =====================================================

-- -----------------------------------------------------
-- 9.1 Add Member to Workspace
-- -----------------------------------------------------

INSERT INTO workspace_members (
  workspace_id,
  user_id,
  role
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '123e4567-e89b-12d3-a456-426614174009'::uuid, -- new user's ID
  'provider'::workspace_role
)
RETURNING *;

-- -----------------------------------------------------
-- 9.2 Get Workspace Members
-- -----------------------------------------------------

SELECT
  wm.id,
  p.id AS user_id,
  p.full_name,
  p.email,
  wm.role,
  wm.is_active,
  wm.joined_at
FROM workspace_members wm
JOIN profiles p ON wm.user_id = p.id
WHERE wm.workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
ORDER BY wm.joined_at;

-- -----------------------------------------------------
-- 9.3 Deactivate Workspace Member
-- -----------------------------------------------------

UPDATE workspace_members
SET is_active = false
WHERE workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
  AND user_id = '123e4567-e89b-12d3-a456-426614174009'::uuid
  AND workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
RETURNING *;

-- =====================================================
-- 10. AUDIT & HISTORY
-- =====================================================

-- -----------------------------------------------------
-- 10.1 Get Audit Log for Specific Record
-- -----------------------------------------------------

SELECT
  al.id,
  al.action,
  al.changed_fields,
  al.old_data,
  al.new_data,
  p.full_name AS actor_name,
  al.created_at
FROM audit_log al
LEFT JOIN profiles p ON al.actor_user_id = p.id
WHERE al.table_name = 'clients'
  AND al.record_id = '123e4567-e89b-12d3-a456-426614174001'::uuid
ORDER BY al.created_at DESC
LIMIT 20;

-- -----------------------------------------------------
-- 10.2 Get Recent Activity in Workspace
-- -----------------------------------------------------

SELECT
  al.table_name,
  al.action,
  p.full_name AS actor_name,
  al.created_at
FROM audit_log al
LEFT JOIN profiles p ON al.actor_user_id = p.id
WHERE al.workspace_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
ORDER BY al.created_at DESC
LIMIT 50;

-- =====================================================
-- END OF EXAMPLE QUERIES
-- =====================================================
