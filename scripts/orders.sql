-- ============================================================================
-- 🛒 INSERCIÓN DE PEDIDOS DE PRUEBA
-- ============================================================================

-- 📦 1. PEDIDO ENTREGADO (Pagado con Tarjeta)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_postal_code, total_amount, payment_method, payment_status, order_status, notes)
VALUES (
    'ORD-2026-0001', 
    'Abtaham Lendro Vega', 
    'abtaham@example.com', 
    '987654321', 
    '70123456', 
    'Urb. San Antonio Mz B Lt 5', 
    'Huancayo', 
    '12001', 
    499.90, 
    'tarjeta', 
    'pagado', 
    'entregado', 
    'Dejar el paquete en recepción.'
);

-- Insertar el producto para el Pedido 1 (Toma el primer producto de tu BD)
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0001'), 
    (SELECT id FROM products ORDER BY id ASC LIMIT 1), 
    'Zapatillas Nike Air Zoom Pegasus 40', 
    1, 499.90, 499.90
);

-- 📦 2. PEDIDO NUEVO (Pendiente por Yape/Transferencia)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_postal_code, total_amount, payment_method, payment_status, order_status, notes)
VALUES (
    'ORD-2026-0002', 
    'Miguel Torres', 
    'miguel.torres@example.com', 
    '912345678', 
    '45678901', 
    'Av. Mariscal Castilla 402, El Tambo', 
    'Huancayo', 
    '12006', 
    129.00, 
    'transferencia', 
    'pendiente', 
    'nuevo', 
    'Avisar por WhatsApp 10 min antes de llegar.'
);

-- Insertar el producto para el Pedido 2 (Toma el último producto de tu BD)
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0002'), 
    (SELECT id FROM products ORDER BY id DESC LIMIT 1), 
    'Polo de Entrenamiento Under Armour', 
    1, 129.00, 129.00
);

-- 📦 3. PEDIDO EN PROCESO (Pagado con MercadoPago)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_postal_code, total_amount, payment_method, payment_status, order_status, notes)
VALUES (
    'ORD-2026-0003', 
    'Magaly Rojas', 
    'magaly.rojas@example.com', 
    '999888777', 
    '76543210', 
    'Calle Real 1050', 
    'Huancayo', 
    '12001', 
    358.00, 
    'mercadopago', 
    'pagado', 
    'procesando', 
    'Compra de 2 mochilas.'
);

-- Insertar el producto para el Pedido 3 (Toma el segundo producto de tu BD y le pone Cantidad: 2)
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0003'), 
    (SELECT id FROM products ORDER BY id ASC LIMIT 1 OFFSET 1), 
    'Mochila Deportiva Adidas', 
    2, 179.00, 358.00
);

-- ============================================================================
-- 📊 DATOS HISTÓRICOS PARA DARLE VIDA AL GRÁFICO
-- ============================================================================

-- 📦 Hace 7 días
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at, updated_at)
VALUES ('ORD-HIST-001', 'Ana Gomez', 'ana@example.com', '987111222', 'Cusco', 180.00, 'tarjeta', 'pagado', 'entregado', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days');

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-HIST-001'), 
    (SELECT id FROM products ORDER BY id ASC LIMIT 1), 
    'Zapatillas Running', 1, 180.00, 180.00, CURRENT_TIMESTAMP - INTERVAL '7 days'
);

-- 📦 Hace 5 días (Un pico de ventas)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at, updated_at)
VALUES ('ORD-HIST-002', 'Luis Perez', 'luis@example.com', '987333444', 'Lima', 650.00, 'transferencia', 'pagado', 'entregado', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days');

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-HIST-002'), 
    (SELECT id FROM products ORDER BY id ASC LIMIT 1), 
    'Equipamiento Completo', 1, 650.00, 650.00, CURRENT_TIMESTAMP - INTERVAL '5 days'
);

-- 📦 Hace 3 días (Una venta baja)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at, updated_at)
VALUES ('ORD-HIST-003', 'Carla Diaz', 'carla@example.com', '987555666', 'Arequipa', 90.00, 'mercadopago', 'pagado', 'enviado', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days');

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-HIST-003'), 
    (SELECT id FROM products ORDER BY id ASC LIMIT 1), 
    'Polo Deportivo', 1, 90.00, 90.00, CURRENT_TIMESTAMP - INTERVAL '3 days'
);

-- 📦 Ayer
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at, updated_at)
VALUES ('ORD-HIST-004', 'Jorge Vega', 'jorge@example.com', '987777888', 'Tacna', 320.00, 'tarjeta', 'pagado', 'procesando', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-HIST-004'), 
    (SELECT id FROM products ORDER BY id ASC LIMIT 1), 
    'Zapatillas Trail', 1, 320.00, 320.00, CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- ============================================================================
-- 🛒 MÁS PEDIDOS DE PRUEBA: ESCENARIOS DE PAGO Y LOGÍSTICA (CORREGIDO)
-- ============================================================================

-- 📦 5. PAGO FALLIDO (Tarjeta rechazada - Pedido Cancelado)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_postal_code, total_amount, payment_method, payment_status, order_status, notes)
VALUES (
    'ORD-2026-0005', 
    'Carlos Ramos', 
    'carlos.ramos@example.com', 
    '911222333', 
    '12345678', 
    'Av. Los Héroes 500', 
    'Huancayo', 
    '12002', 
    299.00, 
    'tarjeta', 
    'fallido', 
    'cancelado', 
    'Error en la pasarela de pago: Tarjeta rechazada por fondos insuficientes. El cliente intentará más tarde.'
);

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0005'), 
    (SELECT MIN(id) FROM products), -- 🔥 Toma el ID mínimo existente (A prueba de errores)
    'Casaca Cortavientos Running', 
    1, 299.00, 299.00
);

-- 📦 6. PAGO PENDIENTE DE VERIFICACIÓN (Pago por YAPE)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_postal_code, total_amount, payment_method, payment_status, order_status, notes)
VALUES (
    'ORD-2026-0006', 
    'Lucia Fernandez', 
    'lucia.fer@example.com', 
    '955444333', 
    '87654321', 
    'Jr. Parra del Riego 120', 
    'El Tambo', 
    '12006', 
    85.00, 
    'yape', 
    'pendiente', 
    'nuevo', 
    'El cliente indica que ya yapeó. Revisar el celular de la empresa para confirmar la captura.'
);

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0006'), 
    (SELECT MIN(id) FROM products), -- 🔥 A prueba de errores
    'Gorra Deportiva UV', 
    1, 85.00, 85.00
);

-- 📦 7. PAGO REEMBOLSADO (Falta de stock)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_postal_code, total_amount, payment_method, payment_status, order_status, notes)
VALUES (
    'ORD-2026-0007', 
    'Roberto Ruiz', 
    'r.ruiz@example.com', 
    '966777888', 
    '23456789', 
    'Urb. La Merced Mz C', 
    'Huancayo', 
    '12001', 
    450.00, 
    'mercadopago', 
    'reembolsado', 
    'cancelado', 
    'Se hizo la devolución del dinero a su cuenta de MercadoPago porque no había stock físico de la Talla L.'
);

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES (
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0007'), 
    (SELECT MIN(id) FROM products), -- 🔥 A prueba de errores
    'Zapatillas de Entrenamiento Base', 
    1, 450.00, 450.00
);

-- 📦 8. PAGO VERIFICADO Y ENVIADO (Transferencia BCP/Interbank)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_postal_code, total_amount, payment_method, payment_status, order_status, notes)
VALUES (
    'ORD-2026-0008', 
    'Valeria Torres', 
    'vale.torres@example.com', 
    '911000111', 
    '44556677', 
    'Av. Giraldez 800', 
    'Chilca', 
    '12004', 
    620.00, 
    'transferencia', 
    'pagado', 
    'enviado', 
    'Transferencia verificada en la cuenta BCP. El paquete fue enviado por Shalom, guía N° 10293847.'
);

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
VALUES 
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0008'), 
    (SELECT MIN(id) FROM products), -- 🔥 A prueba de errores
    'Zapatillas Nike Air Zoom Pegasus 40', 
    1, 499.90, 499.90
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2026-0008'), 
    (SELECT MIN(id) FROM products), -- 🔥 A prueba de errores
    'Polo de Entrenamiento Under Armour', 
    1, 120.10, 120.10
);

-- ==============================================================================
-- 📊 DATOS FALSOS PARA PROBAR EL DASHBOARD INTERACTIVO
-- ==============================================================================

-- 1. PEDIDOS DE HOY Y AYER (Se verán en TODOS los filtros, desde "7 días")
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at)
VALUES 
('ORD-DASH-001', 'Juan Perez', 'juan@test.com', '999111222', 'El Tambo', 150.00, 'tarjeta', 'pagado', 'entregado', NOW()),
('ORD-DASH-002', 'Maria Lopez', 'maria@test.com', '999333444', 'Chilca', 350.00, 'yape', 'pagado', 'enviado', NOW() - INTERVAL '1 day');

-- 2. PEDIDO DE HACE 5 DÍAS (Se verá desde el filtro "7 días" en adelante)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at)
VALUES 
('ORD-DASH-003', 'Carlos Diaz', 'carlos@test.com', '999555666', 'Huancayo Centro', 220.50, 'transferencia', 'pagado', 'entregado', NOW() - INTERVAL '5 days');

-- 3. PEDIDOS DE HACE 12 Y 14 DÍAS (Aparecerán recién cuando elijas "15 días" o "30 días")
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at)
VALUES 
('ORD-DASH-004', 'Ana Torres', 'ana@test.com', '999777888', 'San Carlos', 480.00, 'tarjeta', 'pagado', 'entregado', NOW() - INTERVAL '12 days'),
('ORD-DASH-005', 'Luis Gomez', 'luis@test.com', '999000111', 'Pilcomayo', 130.00, 'yape', 'pagado', 'entregado', NOW() - INTERVAL '14 days');

-- 4. PEDIDO DE HACE 25 DÍAS (Pico de ventas. Solo se verá si eliges "30 días" o más)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at)
VALUES 
('ORD-DASH-006', 'Sofia Ruiz', 'sofia@test.com', '999222333', 'Sicaya', 850.00, 'tarjeta', 'pagado', 'entregado', NOW() - INTERVAL '25 days');

-- 5. PEDIDO DE HACE 2 MESES (Solo aparecerá si eliges "90 días" o "Último año")
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at)
VALUES 
('ORD-DASH-007', 'Pedro Soto', 'pedro@test.com', '999444555', 'El Tambo', 540.00, 'transferencia', 'pagado', 'entregado', NOW() - INTERVAL '60 days');

-- 6. PEDIDO TRAMPA: Creado ayer, pero "PENDIENTE" de pago (NO DEBE SUMAR a los ingresos)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, payment_status, order_status, created_at)
VALUES 
('ORD-DASH-008', 'Marta Lima', 'marta@test.com', '999666777', 'Chilca', 999.00, 'yape', 'pendiente', 'nuevo', NOW() - INTERVAL '1 day');