-- =====================================================
-- MINDESK - SEED DATA
-- =====================================================
-- Sample data for local development and testing
-- =====================================================

-- Note: In production with Supabase Auth, users are created via auth.users
-- This seed assumes you have test users already created in auth.users
-- Replace these UUIDs with your actual test user IDs from auth.users

-- =====================================================
-- SAMPLE USER IDs (Replace with your actual auth.users IDs)
-- =====================================================

-- For this seed, we'll use deterministic UUIDs for testing
-- In real usage, these would be actual user IDs from auth.users

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  user3_id UUID := '33333333-3333-3333-3333-333333333333';

  workspace1_id UUID;
  workspace2_id UUID;

  client1_id UUID;
  client2_id UUID;
  client3_id UUID;
  client4_id UUID;

  package1_id UUID;
  package2_id UUID;

  package_purchase1_id UUID;
  package_purchase2_id UUID;

  appointment1_id UUID;
  appointment2_id UUID;
  appointment3_id UUID;
  appointment4_id UUID;

  invoice1_id UUID;
  invoice2_id UUID;

BEGIN

-- =====================================================
-- 1. PROFILES
-- =====================================================

-- These would normally be auto-created via trigger when users sign up
-- For testing, we insert them manually

INSERT INTO profiles (id, email, full_name, phone, timezone)
VALUES
  (user1_id, 'dra.martinez@example.com', 'Dra. Ana Martínez', '+57 310 555 0101', 'America/Bogota'),
  (user2_id, 'dr.rodriguez@example.com', 'Dr. Carlos Rodríguez', '+57 311 555 0202', 'America/Bogota'),
  (user3_id, 'dra.lopez@example.com', 'Dra. María López', '+57 312 555 0303', 'America/Bogota')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;

-- =====================================================
-- 2. WORKSPACES
-- =====================================================

INSERT INTO workspaces (id, name, slug, description, phone, email, city, created_by)
VALUES
  (
    gen_random_uuid(),
    'Centro de Psicología Integral',
    'centro-psicologia-integral',
    'Centro especializado en terapia cognitivo-conductual y psicoterapia',
    '+57 601 555 1000',
    'info@centropsicologia.com',
    'Bogotá',
    user1_id
  ),
  (
    gen_random_uuid(),
    'Consultorio Dra. López',
    'consultorio-dra-lopez',
    'Práctica privada - Psicología clínica',
    '+57 312 555 0303',
    'dra.lopez@example.com',
    'Medellín',
    user3_id
  )
RETURNING id INTO workspace1_id, workspace2_id;

-- Store workspace IDs for later use
workspace1_id := (SELECT id FROM workspaces WHERE slug = 'centro-psicologia-integral');
workspace2_id := (SELECT id FROM workspaces WHERE slug = 'consultorio-dra-lopez');

-- =====================================================
-- 3. WORKSPACE MEMBERS
-- =====================================================

INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES
  (workspace1_id, user1_id, 'owner'),
  (workspace1_id, user2_id, 'provider'),
  (workspace2_id, user3_id, 'owner');

-- =====================================================
-- 4. CLIENTS
-- =====================================================

INSERT INTO clients (
  workspace_id, first_name, last_name, email, phone, date_of_birth,
  gender, city, created_by
)
VALUES
  (
    workspace1_id,
    'Laura',
    'Gómez',
    'laura.gomez@example.com',
    '+57 300 111 2233',
    '1995-03-15',
    'Femenino',
    'Bogotá',
    user1_id
  ),
  (
    workspace1_id,
    'Pedro',
    'Ramírez',
    'pedro.ramirez@example.com',
    '+57 301 222 3344',
    '1988-07-22',
    'Masculino',
    'Bogotá',
    user1_id
  ),
  (
    workspace1_id,
    'Carolina',
    'Torres',
    'carolina.torres@example.com',
    '+57 302 333 4455',
    '1992-11-08',
    'Femenino',
    'Bogotá',
    user2_id
  ),
  (
    workspace2_id,
    'Miguel',
    'Hernández',
    'miguel.hernandez@example.com',
    '+57 303 444 5566',
    '1985-05-30',
    'Masculino',
    'Medellín',
    user3_id
  )
RETURNING id INTO client1_id, client2_id, client3_id, client4_id;

-- Get client IDs
SELECT id INTO client1_id FROM clients WHERE email = 'laura.gomez@example.com';
SELECT id INTO client2_id FROM clients WHERE email = 'pedro.ramirez@example.com';
SELECT id INTO client3_id FROM clients WHERE email = 'carolina.torres@example.com';
SELECT id INTO client4_id FROM clients WHERE email = 'miguel.hernandez@example.com';

-- =====================================================
-- 5. PACKAGES
-- =====================================================

INSERT INTO packages (
  workspace_id, name, description, number_of_sessions, price,
  validity_days, created_by
)
VALUES
  (
    workspace1_id,
    'Paquete Mensual (4 sesiones)',
    'Paquete de 4 sesiones con validez de 30 días',
    4,
    400000,
    30,
    user1_id
  ),
  (
    workspace1_id,
    'Paquete Trimestral (12 sesiones)',
    'Paquete de 12 sesiones con validez de 90 días y descuento',
    12,
    1080000,
    90,
    user1_id
  ),
  (
    workspace2_id,
    'Paquete Básico (4 sesiones)',
    'Paquete de 4 sesiones sin expiración',
    4,
    360000,
    NULL,
    user3_id
  )
RETURNING id INTO package1_id, package2_id;

-- Get package IDs
SELECT id INTO package1_id FROM packages WHERE name = 'Paquete Mensual (4 sesiones)' AND workspace_id = workspace1_id;
SELECT id INTO package2_id FROM packages WHERE name = 'Paquete Trimestral (12 sesiones)' AND workspace_id = workspace1_id;

-- =====================================================
-- 6. PACKAGE PURCHASES
-- =====================================================

INSERT INTO package_purchases (
  workspace_id, client_id, package_id, sessions_total, sessions_used,
  price_paid, purchased_at, expires_at, created_by
)
VALUES
  (
    workspace1_id,
    client1_id,
    package1_id,
    4,
    2, -- Already used 2 sessions
    400000,
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '20 days',
    user1_id
  ),
  (
    workspace1_id,
    client2_id,
    package2_id,
    12,
    5, -- Used 5 sessions
    1080000,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days',
    user1_id
  )
RETURNING id INTO package_purchase1_id, package_purchase2_id;

-- Get package purchase IDs
SELECT id INTO package_purchase1_id FROM package_purchases WHERE client_id = client1_id;
SELECT id INTO package_purchase2_id FROM package_purchases WHERE client_id = client2_id;

-- =====================================================
-- 7. APPOINTMENTS
-- =====================================================

-- Past completed appointments
INSERT INTO appointments (
  workspace_id, client_id, provider_id, start_time, end_time,
  status, title, location, package_purchase_id, created_by
)
VALUES
  -- Laura's past sessions (from package)
  (
    workspace1_id,
    client1_id,
    user1_id,
    NOW() - INTERVAL '8 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '8 days' + INTERVAL '11 hours',
    'completed',
    'Sesión de terapia',
    'Consultorio 1',
    package_purchase1_id,
    user1_id
  ),
  (
    workspace1_id,
    client1_id,
    user1_id,
    NOW() - INTERVAL '1 day' + INTERVAL '10 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '11 hours',
    'completed',
    'Sesión de terapia',
    'Consultorio 1',
    package_purchase1_id,
    user1_id
  ),

  -- Pedro's past sessions (from package)
  (
    workspace1_id,
    client2_id,
    user2_id,
    NOW() - INTERVAL '25 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '25 days' + INTERVAL '15 hours',
    'completed',
    'Sesión de evaluación',
    'Consultorio 2',
    package_purchase2_id,
    user2_id
  ),
  (
    workspace1_id,
    client2_id,
    user2_id,
    NOW() - INTERVAL '18 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '18 days' + INTERVAL '15 hours',
    'completed',
    'Sesión de terapia',
    'Consultorio 2',
    package_purchase2_id,
    user2_id
  ),

  -- Upcoming appointments
  (
    workspace1_id,
    client1_id,
    user1_id,
    NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '11 hours',
    'scheduled',
    'Sesión de terapia',
    'Consultorio 1',
    package_purchase1_id,
    user1_id
  ),
  (
    workspace1_id,
    client2_id,
    user2_id,
    NOW() + INTERVAL '3 days' + INTERVAL '15 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '16 hours',
    'scheduled',
    'Sesión de seguimiento',
    'Consultorio 2',
    package_purchase2_id,
    user2_id
  ),
  (
    workspace1_id,
    client3_id,
    user1_id,
    NOW() + INTERVAL '1 day' + INTERVAL '16 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '17 hours',
    'scheduled',
    'Primera sesión - Evaluación',
    'Consultorio 1',
    NULL,
    user1_id
  ),

  -- Workspace 2 appointment
  (
    workspace2_id,
    client4_id,
    user3_id,
    NOW() + INTERVAL '2 days' + INTERVAL '9 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
    'scheduled',
    'Sesión de terapia',
    'Consultorio Principal',
    NULL,
    user3_id
  )
RETURNING id INTO appointment1_id, appointment2_id, appointment3_id, appointment4_id;

-- Get specific appointment IDs for session notes
SELECT id INTO appointment1_id FROM appointments
WHERE client_id = client1_id AND status = 'completed'
ORDER BY start_time DESC LIMIT 1;

SELECT id INTO appointment2_id FROM appointments
WHERE client_id = client2_id AND status = 'completed'
ORDER BY start_time DESC LIMIT 1;

-- =====================================================
-- 8. SESSION NOTES
-- =====================================================

INSERT INTO session_notes (
  appointment_id, workspace_id, client_id, provider_id,
  subjective, objective, assessment, plan,
  session_number, duration_minutes, mood_rating, progress_rating,
  tags, interventions
)
VALUES
  (
    appointment1_id,
    workspace1_id,
    client1_id,
    user1_id,
    'Cliente reporta mejoría en manejo de ansiedad. Indica que ha practicado las técnicas de respiración diariamente. Refiere mejor calidad de sueño.',
    'Paciente se observa más relajada, buen contacto visual, lenguaje corporal abierto. Tono de voz calmado.',
    'Progreso significativo en el manejo de síntomas de ansiedad generalizada. Cliente muestra mayor capacidad de autorregulación emocional.',
    'Continuar con técnicas de respiración diafragmática. Introducir registro de pensamientos automáticos. Próxima sesión: trabajar reestructuración cognitiva.',
    2,
    60,
    7,
    8,
    ARRAY['ansiedad', 'tcc', 'respiración', 'seguimiento'],
    ARRAY['Técnicas de respiración', 'Psicoeducación', 'Monitoreo de síntomas']
  ),
  (
    appointment2_id,
    workspace1_id,
    client2_id,
    user2_id,
    'Cliente expresa sentirse abrumado por situaciones laborales. Reporta dificultad para concentrarse y pensamientos rumiativos.',
    'Se observa tensión muscular, postura cerrada al inicio de la sesión. Mejoría progresiva durante la conversación.',
    'Síntomas compatibles con estrés laboral agudo. Cliente muestra disposición al cambio y buena alianza terapéutica.',
    'Trabajar técnicas de manejo de estrés. Establecer límites laborales saludables. Tarea: Implementar pausas activas durante jornada laboral.',
    2,
    60,
    5,
    6,
    ARRAY['estrés', 'laboral', 'mindfulness'],
    ARRAY['Técnicas de relajación progresiva', 'Establecimiento de límites', 'Mindfulness']
  );

-- =====================================================
-- 9. INVOICES
-- =====================================================

INSERT INTO invoices (
  workspace_id, client_id, invoice_number, status,
  issue_date, due_date, subtotal, tax_rate, tax_amount, total,
  created_by
)
VALUES
  (
    workspace1_id,
    client1_id,
    'INV-000001',
    'paid',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '10 days' + INTERVAL '30 days',
    400000,
    0.0000,
    0,
    400000,
    user1_id
  ),
  (
    workspace1_id,
    client2_id,
    'INV-000002',
    'pending',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    0, -- Will be calculated by trigger
    0.0000,
    0,
    0,
    user2_id
  ),
  (
    workspace1_id,
    client3_id,
    'INV-000003',
    'draft',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0,
    0.0000,
    0,
    0,
    user1_id
  )
RETURNING id INTO invoice1_id, invoice2_id;

-- Get invoice IDs
SELECT id INTO invoice1_id FROM invoices WHERE invoice_number = 'INV-000001';
SELECT id INTO invoice2_id FROM invoices WHERE invoice_number = 'INV-000002';

-- =====================================================
-- 10. INVOICE ITEMS
-- =====================================================

-- Invoice 1 - Package purchase (paid)
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price)
VALUES
  (invoice1_id, 'Paquete Mensual (4 sesiones)', 1, 400000);

-- Invoice 2 - Individual sessions (pending)
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price)
VALUES
  (invoice2_id, 'Sesión de terapia - ' || TO_CHAR(NOW() - INTERVAL '25 days', 'DD/MM/YYYY'), 1, 120000),
  (invoice2_id, 'Sesión de terapia - ' || TO_CHAR(NOW() - INTERVAL '18 days', 'DD/MM/YYYY'), 1, 120000);

-- =====================================================
-- 11. PAYMENTS
-- =====================================================

INSERT INTO payments (
  workspace_id, invoice_id, client_id, amount,
  payment_method, payment_date, reference_number, created_by
)
VALUES
  (
    workspace1_id,
    invoice1_id,
    client1_id,
    400000,
    'transfer',
    CURRENT_DATE - INTERVAL '9 days',
    'TRX-2026-001',
    user1_id
  ),
  (
    workspace1_id,
    invoice2_id,
    client2_id,
    120000, -- Partial payment
    'cash',
    CURRENT_DATE - INTERVAL '2 days',
    NULL,
    user2_id
  );

-- =====================================================
-- 12. REMINDERS
-- =====================================================

-- Create reminders for upcoming appointments
INSERT INTO reminders (
  workspace_id, appointment_id, client_id, channel,
  scheduled_for, recipient_phone, message
)
SELECT
  a.workspace_id,
  a.id,
  a.client_id,
  'whatsapp'::reminder_channel,
  a.start_time - INTERVAL '24 hours',
  c.phone,
  'Hola ' || c.first_name || '! Recordatorio: Tienes una cita mañana ' ||
  TO_CHAR(a.start_time AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') || ' a las ' ||
  TO_CHAR(a.start_time AT TIME ZONE 'America/Bogota', 'HH24:MI') || '. ' ||
  'Ubicación: ' || COALESCE(a.location, 'Por confirmar') || '.'
FROM appointments a
JOIN clients c ON a.client_id = c.id
WHERE a.status = 'scheduled'
  AND a.start_time > NOW();

RAISE NOTICE 'Seed data inserted successfully!';
RAISE NOTICE 'Workspace 1: %', workspace1_id;
RAISE NOTICE 'Workspace 2: %', workspace2_id;

END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check what was created
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profiles: %', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Workspaces: %', (SELECT COUNT(*) FROM workspaces);
  RAISE NOTICE 'Workspace Members: %', (SELECT COUNT(*) FROM workspace_members);
  RAISE NOTICE 'Clients: %', (SELECT COUNT(*) FROM clients);
  RAISE NOTICE 'Packages: %', (SELECT COUNT(*) FROM packages);
  RAISE NOTICE 'Package Purchases: %', (SELECT COUNT(*) FROM package_purchases);
  RAISE NOTICE 'Appointments: %', (SELECT COUNT(*) FROM appointments);
  RAISE NOTICE '  - Completed: %', (SELECT COUNT(*) FROM appointments WHERE status = 'completed');
  RAISE NOTICE '  - Scheduled: %', (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled');
  RAISE NOTICE 'Session Notes: %', (SELECT COUNT(*) FROM session_notes);
  RAISE NOTICE 'Invoices: %', (SELECT COUNT(*) FROM invoices);
  RAISE NOTICE 'Invoice Items: %', (SELECT COUNT(*) FROM invoice_items);
  RAISE NOTICE 'Payments: %', (SELECT COUNT(*) FROM payments);
  RAISE NOTICE 'Reminders: %', (SELECT COUNT(*) FROM reminders);
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- HELPFUL QUERIES TO VIEW SEED DATA
-- =====================================================

-- View all workspaces with member counts
SELECT
  w.name,
  w.slug,
  w.city,
  COUNT(wm.id) AS member_count
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE w.deleted_at IS NULL
GROUP BY w.id
ORDER BY w.created_at;

-- View all clients with appointment counts
SELECT
  w.name AS workspace,
  c.first_name || ' ' || c.last_name AS client_name,
  c.email,
  COUNT(a.id) AS total_appointments
FROM clients c
JOIN workspaces w ON c.workspace_id = w.id
LEFT JOIN appointments a ON c.id = a.client_id
WHERE c.deleted_at IS NULL
GROUP BY w.id, c.id
ORDER BY w.name, client_name;

-- View upcoming appointments
SELECT
  w.name AS workspace,
  p.full_name AS provider,
  c.first_name || ' ' || c.last_name AS client,
  a.start_time AT TIME ZONE 'America/Bogota' AS appointment_time,
  a.location,
  a.status
FROM appointments a
JOIN workspaces w ON a.workspace_id = w.id
JOIN profiles p ON a.provider_id = p.id
JOIN clients c ON a.client_id = c.id
WHERE a.status = 'scheduled'
  AND a.start_time >= NOW()
ORDER BY a.start_time;

-- =====================================================
-- END OF SEED DATA
-- =====================================================
