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