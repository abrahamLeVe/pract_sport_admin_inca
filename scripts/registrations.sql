-- ============================================================================
-- 🏃‍♂️ INSERCIÓN DE DATOS DE PRUEBA: EVENTOS Y ATLETAS
-- ============================================================================

-- 1. Insertamos datos maestros básicos si no existen
INSERT INTO master_distances (name) VALUES ('10K') ON CONFLICT (name) DO NOTHING;
INSERT INTO master_genders (name) VALUES ('Mixto') ON CONFLICT (name) DO NOTHING;
INSERT INTO master_age_categories (name, default_min_age, default_max_age) VALUES ('Libre', 18, 99) ON CONFLICT (name) DO NOTHING;
INSERT INTO master_event_types (name) VALUES ('Running') ON CONFLICT (name) DO NOTHING;

-- 2. Creamos un Evento de Prueba
INSERT INTO events (title, description, event_date, location_name, status)
VALUES (
    'Desafío Arwaturo 2026', 
    'Carrera de montaña y trail running.', 
    '2026-11-15 07:00:00', 
    'Huancayo', 
    'published'
);

-- 3. Creamos una Categoría para el evento
INSERT INTO event_categories (event_id, distance_id, gender_id, age_category_id, applied_min_age, applied_max_age, price, cupos)
VALUES (
    (SELECT id FROM events ORDER BY id DESC LIMIT 1),
    (SELECT id FROM master_distances WHERE name = '10K' LIMIT 1),
    (SELECT id FROM master_genders WHERE name = 'Mixto' LIMIT 1),
    (SELECT id FROM master_age_categories WHERE name = 'Libre' LIMIT 1),
    18, 99, 
    50.00, 
    200
);

-- 4. INSCRIBIMOS ATLETAS DE PRUEBA (Usando el JSONB para sus datos)

-- 🟢 Atleta 1: Pago Aprobado y con Número de Dorsal (BIB) asignado
INSERT INTO event_registrations (event_id, category_id, participant_details, bib_number, registration_status, payment_status, payment_method, payment_amount, payment_verified_at)
VALUES (
    (SELECT id FROM events ORDER BY id DESC LIMIT 1),
    (SELECT id FROM event_categories ORDER BY id DESC LIMIT 1),
    '{"firstName": "Carlos", "lastName": "Mendoza", "documentType": "DNI", "documentNumber": "71234567", "email": "carlos@example.com", "phone": "987654321", "bloodType": "O+", "tshirtSize": "M", "emergencyContact": "Ana Mendoza", "emergencyPhone": "912345678"}',
    101, 
    'approved', 
    'paid', 
    'tarjeta', 
    50.00, 
    NOW()
);

-- 🟡 Atleta 2: Inscripción Pendiente (Esperando validación de Yape)
INSERT INTO event_registrations (event_id, category_id, participant_details, registration_status, payment_status, payment_method, operation_number, payment_amount)
VALUES (
    (SELECT id FROM events ORDER BY id DESC LIMIT 1),
    (SELECT id FROM event_categories ORDER BY id DESC LIMIT 1),
    '{"firstName": "Lucía", "lastName": "García", "documentType": "DNI", "documentNumber": "76543210", "email": "lucia@example.com", "phone": "999888777", "bloodType": "A+", "tshirtSize": "S", "emergencyContact": "Juan García", "emergencyPhone": "988777666"}',
    'pending', 
    'unpaid', 
    'yape', 
    '000123456', 
    50.00
);

-- 🔴 Atleta 3: Inscripción Cancelada (No pagó a tiempo)
INSERT INTO event_registrations (event_id, category_id, participant_details, registration_status, payment_status)
VALUES (
    (SELECT id FROM events ORDER BY id DESC LIMIT 1),
    (SELECT id FROM event_categories ORDER BY id DESC LIMIT 1),
    '{"firstName": "Roberto", "lastName": "Quispe", "documentType": "DNI", "documentNumber": "45678901", "email": "roberto@example.com", "phone": "911222333", "bloodType": "B-", "tshirtSize": "L"}',
    'cancelled', 
    'failed'
);