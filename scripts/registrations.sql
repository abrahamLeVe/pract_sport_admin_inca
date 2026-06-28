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

-- Mas ejemplos con id de evento no 11
-- 🟢 Atleta 4 (Abraham): Pagado y Aprobado (LISTO PARA RECIBIR DORSAL MASIVO)
INSERT INTO event_registrations (event_id, category_id, participant_details, registration_status, payment_status, payment_method, payment_amount, payment_verified_at)
VALUES (
    11,
    (SELECT id FROM event_categories WHERE event_id = 11 LIMIT 1),
    '{"firstName": "Abraham", "lastName": "Vega", "documentType": "DNI", "documentNumber": "70000001", "email": "abraham@example.com", "phone": "900000001", "bloodType": "O+", "tshirtSize": "M", "emergencyContact": "Familiar", "emergencyPhone": "900111222"}',
    'approved', 
    'paid', 
    'transferencia', 
    50.00, 
    NOW()
);

-- 🟢 Atleta 5 (Magali): Pagada y Aprobada (LISTA PARA RECIBIR DORSAL MASIVO)
INSERT INTO event_registrations (event_id, category_id, participant_details, registration_status, payment_status, payment_method, payment_amount, payment_verified_at)
VALUES (
    11,
    (SELECT id FROM event_categories WHERE event_id = 11 LIMIT 1),
    '{"firstName": "Magali", "lastName": "Perez", "documentType": "DNI", "documentNumber": "70000002", "email": "magali@example.com", "phone": "900000002", "bloodType": "A+", "tshirtSize": "S", "emergencyContact": "Familiar", "emergencyPhone": "900111333"}',
    'approved', 
    'paid', 
    'tarjeta', 
    50.00, 
    NOW()
);

-- 🟢 Atleta 6 (Sofia): Pagada y Aprobada (LISTA PARA RECIBIR DORSAL MASIVO)
INSERT INTO event_registrations (event_id, category_id, participant_details, registration_status, payment_status, payment_method, payment_amount, payment_verified_at)
VALUES (
    11,
    (SELECT id FROM event_categories WHERE event_id = 11 LIMIT 1),
    '{"firstName": "Sofia", "lastName": "Rojas", "documentType": "DNI", "documentNumber": "70000003", "email": "sofia@example.com", "phone": "900000003", "bloodType": "O-", "tshirtSize": "XS", "emergencyContact": "Madre", "emergencyPhone": "900111444"}',
    'approved', 
    'paid', 
    'plin', 
    50.00, 
    NOW()
);

-- 🟡 Atleta 7 (Juan): Pagó, pero está Pendiente de Revisión (EL BOTÓN LO IGNORARÁ HASTA QUE LO APRUEBES)
INSERT INTO event_registrations (event_id, category_id, participant_details, registration_status, payment_status, payment_method, operation_number, payment_amount)
VALUES (
    11,
    (SELECT id FROM event_categories WHERE event_id = 11 LIMIT 1),
    '{"firstName": "Juan", "lastName": "Torres", "documentType": "DNI", "documentNumber": "70000004", "email": "juan@example.com", "phone": "900000004", "bloodType": "B+", "tshirtSize": "L", "emergencyContact": "Hermano", "emergencyPhone": "900111555"}',
    'pending', 
    'paid', 
    'yape', 
    '000999888', 
    50.00
);

-- 🔴 Atleta 8 (Luis): Ni ha pagado ni está aprobado (EL BOTÓN LO IGNORARÁ)
INSERT INTO event_registrations (event_id, category_id, participant_details, registration_status, payment_status, payment_method, payment_amount)
VALUES (
    11,
    (SELECT id FROM event_categories WHERE event_id = 11 LIMIT 1),
    '{"firstName": "Luis", "lastName": "Condori", "documentType": "DNI", "documentNumber": "70000005", "email": "luis@example.com", "phone": "900000005", "bloodType": "AB+", "tshirtSize": "XL", "emergencyContact": "Esposa", "emergencyPhone": "900111666"}',
    'pending', 
    'unpaid', 
    'efectivo', 
    50.00
);