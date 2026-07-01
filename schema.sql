-- ==============================================================================
-- 🛒 SISTEMA E-COMMERCE: SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MÓDULO 1: SISTEMA DE AUTENTICACIÓN Y USUARIOS (NEXTAUTH.JS)
-- ------------------------------------------------------------------------------

-- 1.1. Tabla Principal de Usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE, 
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  password VARCHAR(255) NOT NULL, 
  role VARCHAR(50) NOT NULL DEFAULT 'CLIENT', 
  status VARCHAR(50) NOT NULL DEFAULT 'activo', 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
  created_by INTEGER, 

  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 1.2. Tabla de Cuentas (OAuth, Google, etc. - Requerido por NextAuth)
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
 
  CONSTRAINT fk_accounts_users FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 1.3. Tabla de Sesiones (Requerido por NextAuth para sesiones en base de datos)
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
 
  CONSTRAINT fk_sessions_users FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 1.4. Tabla de Tokens de Verificación (Requerido por NextAuth para Magic Links/Email)
CREATE TABLE verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
 
  PRIMARY KEY (identifier, token)
);

-- 1.5. Tabla de Perfiles de Usuario (Autocompletado para E-commerce y Eventos)
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL, -- La clave UNIQUE garantiza la relación 1:1

  -- 🛒 Datos para E-commerce y Contacto
  document_type VARCHAR(20) DEFAULT 'DNI',
  document_number VARCHAR(50),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),       -- Ej: Huancayo, Lima
  country VARCHAR(100) DEFAULT 'Perú',

  -- 🏅 Datos Médicos y Deportivos (Vitales para las carreras)
  birth_date DATE,
  gender VARCHAR(20),
  blood_type VARCHAR(10),
  tshirt_size VARCHAR(10),
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(50),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- MÓDULO 2: SISTEMA DE MARKETING Y CMS
-- ------------------------------------------------------------------------------

-- 2.1. Tabla de Banners (Carrusel Principal)
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,               -- Título interno o visual para el banner
    subtitle VARCHAR(255),                     -- Subtítulo u oferta descriptiva corta
    image_url TEXT NOT NULL,                   -- La URL pública devuelta por AWS S3
    image_key TEXT NOT NULL,                   -- El key único de S3 (para eliminación lógica)
    link_url TEXT,                             -- Ruta de redirección (ej: /eventos/maraton)
    type VARCHAR(50) DEFAULT 'general',        -- Categoría: 'oferta', 'evento', 'novedad', 'general'
    sort_order INT DEFAULT 0,                  -- Orden visual del carrusel
    event_id INT NULL,                         -- (FK agregada después para evitar problemas de dependencia circular)
    status VARCHAR(20) DEFAULT 'activo',       -- Estados: 'activo', 'inactivo'
    start_date TIMESTAMP,                      -- (Opcional) Inicio de vigencia
    end_date TIMESTAMP,                        -- (Opcional) Fin de vigencia automático
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- MÓDULO 3: SISTEMA DE CATÁLOGO E INVENTARIO
-- ------------------------------------------------------------------------------

-- 3.1. Tabla de Categorías (Familias de Productos)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                -- Nombre visible (Ej. Zapatillas)
    slug VARCHAR(100) UNIQUE NOT NULL,         -- URL amigable (Ej. zapatillas-running)
    description TEXT,                          -- Breve detalle de la categoría
    image_url TEXT,                            -- Logo o imagen representativa
    image_key TEXT,                            -- Llave en AWS S3
    status VARCHAR(20) DEFAULT 'activo',       -- Visibilidad en el menú
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3.2. Tabla de Marcas (Fabricantes/Brands)
-- ------------------------------------------------------------------------------
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                -- Nombre de la marca (Ej. Nike, Adidas)
    slug VARCHAR(100) UNIQUE NOT NULL,         -- URL amigable (Ej. nike, under-armour)
    description TEXT,                          -- (Opcional) Historia o descripción de la marca
    image_url TEXT,                            -- Logo de la marca (URL de S3)
    image_key TEXT,                            -- Llave del logo en S3 para eliminarlo
    status VARCHAR(20) DEFAULT 'activo',       -- Visibilidad
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3.3. Tabla de Productos
-- ------------------------------------------------------------------------------
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    track_stock BOOLEAN DEFAULT TRUE,
    
    -- Relaciones (ON DELETE RESTRICT evita borrar categorías/marcas si hay productos vinculados)
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    brand_id INTEGER REFERENCES brands(id) ON DELETE RESTRICT,
    
    images JSONB DEFAULT '[]', -- Array de objetos: [{url, key}, {url, key}]
    status VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- NUEVAS TABLAS MAESTRAS (Para Filtros Globales)
-- ------------------------------------------------------------------------------

-- Tabla Maestra de Colores
CREATE TABLE master_colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,       -- Ej: 'Negro', 'Rojo'
    hex_code VARCHAR(7),                    -- Ej: '#000000' 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Maestra de Tallas
CREATE TABLE master_sizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,       -- Ej: 'S', 'M', 'L', '40', '42'
    category VARCHAR(50),                   -- Ej: 'Ropa', 'Calzado', 'Accesorios' 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- TABLA DE VARIANTES 
-- ------------------------------------------------------------------------------
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    size_id INTEGER REFERENCES master_sizes(id) ON DELETE RESTRICT,
    color_id INTEGER REFERENCES master_colors(id) ON DELETE RESTRICT,
    
    sku VARCHAR(100) UNIQUE,               -- Código de barras/inventario 
    stock INTEGER NOT NULL DEFAULT 0,
    track_stock BOOLEAN DEFAULT TRUE,      -- 🔥 ¡CORRECCIÓN INCLUIDA AQUÍ!
    status VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Evita que el admin cree por error dos veces la variante "Polo Rojo - Talla M"
    UNIQUE(product_id, size_id, color_id) 
);

-- ------------------------------------------------------------------------------
-- TRIGGER PROFESIONAL: ACTUALIZACIÓN AUTOMÁTICA DE STOCK DEL PRODUCTO PADRE
-- ------------------------------------------------------------------------------

-- 1. Creamos la función matemática 
CREATE OR REPLACE FUNCTION update_product_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = (
        SELECT COALESCE(SUM(stock), 0) 
        FROM product_variants
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
          AND track_stock = TRUE 
          AND status = 'activo' -- Solo sumamos si la variante está activa
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Creamos el Trigger (Con el arreglo de campos incluido)
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT OR UPDATE OF stock, status, track_stock OR DELETE
ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_total_stock();


-- ==============================================================================
-- SISTEMA PROFESIONAL DE GESTIÓN DE EVENTOS DEPORTIVOS
-- ==============================================================================

CREATE TABLE club_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#000000', 
    secondary_color VARCHAR(7) DEFAULT '#000000',
    description TEXT,
    social_links JSONB DEFAULT '{}', 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 1. TABLAS MAESTRAS (Plantillas globales. Se llenan una sola vez)
-- ------------------------------------------------------------------------------
CREATE TABLE master_distances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- Ej: "5K", "12K", "21K"
);

CREATE TABLE master_genders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE -- Ej: "Varones", "Mujeres", "Mixto"
);

CREATE TABLE master_age_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Ej: "Niños", "Libre", "Master A"
    default_min_age INTEGER NOT NULL,
    default_max_age INTEGER NOT NULL
);

CREATE TABLE master_event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- Ej: "Running", "Trail", "Ciclismo", "Triatlón"
);

-- ------------------------------------------------------------------------------
-- 2. EVENTOS (El contenedor principal)
-- ------------------------------------------------------------------------------
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL, -- Ej: "Desafío Arwaturo 2026"
    slug VARCHAR(255) UNIQUE NOT NULL, -- 🔥 1. VITAL para SEO y URLs amigables (ej: /eventos/desafio-arwaturo-2026)
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    route_geojson JSONB,
    event_type_id INTEGER REFERENCES master_event_types(id) ON DELETE RESTRICT,
    image_url TEXT, -- Se mantiene: Será la "Portada" o "Thumbnail" del evento
    image_key TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL -- 🔥 2. UNIFORMIDAD: Para que funcione tu sistema de papelera (Soft Delete)
);

-- Ahora sí agregamos la FK a banners (Evitamos dependencias circulares)
ALTER TABLE banners ADD CONSTRAINT fk_banners_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
-- ==========================================
-- Media 
-- ==========================================

CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    
    -- 1. Datos Core
    media_type VARCHAR(20) NOT NULL, -- 'image', 'video', 'document', 'merch'
    media_url TEXT NOT NULL,         
    media_key TEXT,                  
    
    -- 2. Metadata Técnica
    file_name VARCHAR(255),          
    file_format VARCHAR(50),         
    size_bytes BIGINT,               
    width INTEGER,                   
    height INTEGER,                  
    alt_text VARCHAR(255),           -- Alt text global por defecto
    
    -- 3. Organización UI (Galería interna)
    folder_name VARCHAR(100) DEFAULT 'general', 
    
    -- 4. Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    deleted_at TIMESTAMP WITH TIME ZONE;
);

-- Índices para el panel de administración
CREATE INDEX idx_media_folder ON media(folder_name);
CREATE INDEX idx_media_type ON media(media_type);
CREATE TABLE media_links (
    id SERIAL PRIMARY KEY,
    
    -- 1. Referencia al archivo físico (Si se borra el archivo, se borra este link)
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    
    -- 2. Identificadores Polimórficos del "Dueño"
    model_type VARCHAR(50) NOT NULL, -- Ej: 'event', 'product', 'banner'
    model_id INTEGER NOT NULL,       -- Ej: 11 (El ID del evento)
    
    -- 3. Contexto de la relación
    collection_name VARCHAR(50) DEFAULT 'gallery', -- Ej: 'thumbnail', 'gallery', 'sponsor_logo'
    display_order INTEGER DEFAULT 0,               -- El orden en este contexto específico
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ÍNDICES CRÍTICOS PARA EL RENDIMIENTO
-- ==========================================

-- 1. Para cargar la galería de un evento/producto rapidísimo
CREATE INDEX idx_media_links_model ON media_links(model_type, model_id);

-- 2. Para saber en cuántos lugares se está usando una imagen específica
CREATE INDEX idx_media_links_media_id ON media_links(media_id);

-- 3. Para evitar que insertes la misma imagen dos veces en la misma colección del mismo evento
CREATE UNIQUE INDEX idx_media_links_unique 
ON media_links(media_id, model_type, model_id, collection_name);
-- ------------------------------------------------------------------------------
-- 3. CATEGORÍAS DEL EVENTO (Las reglas congeladas para ESTE evento)
-- ------------------------------------------------------------------------------
CREATE TABLE event_categories (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    distance_id INTEGER REFERENCES master_distances(id) ON DELETE RESTRICT,
    gender_id INTEGER REFERENCES master_genders(id) ON DELETE RESTRICT,
    age_category_id INTEGER REFERENCES master_age_categories(id) ON DELETE RESTRICT,
    
    -- SNAPSHOT HISTÓRICO
    applied_min_age INTEGER NOT NULL, 
    applied_max_age INTEGER NOT NULL,
    
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cupos INTEGER NOT NULL DEFAULT 0,
    
    -- Evita duplicados en el mismo evento
    UNIQUE(event_id, distance_id, gender_id, age_category_id)
);

-- ------------------------------------------------------------------------------
-- 4. INSCRIPCIONES (Datos del atleta congelados el día de la compra)
-- ------------------------------------------------------------------------------
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES event_categories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- SNAPSHOT DEL ATLETA
    participant_details JSONB NOT NULL, 
    
    bib_number INTEGER, -- Número de dorsal asignado
    
    -- Control de Pagos y Estado
    registration_status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    payment_receipt_url TEXT,
    operation_number VARCHAR(100),
    payment_amount DECIMAL(10, 2),
    voucher_date TIMESTAMP,
    payment_verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de seguridad
    UNIQUE(event_id, user_id),             -- Un usuario no puede inscribirse 2 veces al mismo evento
    UNIQUE(event_id, operation_number)     -- Un voucher no se puede usar 2 veces
);

-- ------------------------------------------------------------------------------
-- 5. RESULTADOS (Para mostrar en la web)
-- ------------------------------------------------------------------------------
CREATE TABLE event_results (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES event_registrations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    total_time INTERVAL NOT NULL,
    overall_position INTEGER,
    category_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. Pedidos desde la web
-- ------------------------------------------------------------------------------

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'ORD-2026-0001'
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Si el cliente tiene cuenta (opcional)
    
    -- Datos del cliente (por si es una compra como invitado)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_dni VARCHAR(20), -- Muy importante para facturación en Perú
    
    -- Dirección de envío
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    
    -- Totales y Pagos
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- Ej: 'tarjeta', 'transferencia', 'mercadopago'
    payment_status VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'fallido', 'reembolsado'
    
    -- Estado logístico
    order_status VARCHAR(50) DEFAULT 'nuevo', -- 'nuevo', 'procesando', 'enviado', 'entregado', 'cancelado'
    operation_number VARCHAR(100);
    payment_receipt_url TEXT;
    
    -- Auditoría
    notes TEXT, -- Notas adicionales del cliente o del administrador
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    -- 🔥 AQUÍ ESTÁ LA CORRECCIÓN: Apuntamos a product_variants
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL, 
    
    product_name VARCHAR(255) NOT NULL, 
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    unit_price DECIMAL(10, 2) NOT NULL, 
    subtotal DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ==============================================================================
-- 🔔 NOTIFICACIONES
-- ==============================================================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- Ej: 'LOW_STOCK', 'PENDING_ORDER', 'FAILED_PAYMENT'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_id VARCHAR(50), -- Para guardar el ID del pedido o producto
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 🚀 ÍNDICES DE OPTIMIZACIÓN DE BASE DE DATOS (ORDENADOS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SISTEMA DE MARKETING (Carga rápida del carrusel)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_banners_order_status ON banners(sort_order, status);

-- ------------------------------------------------------------------------------
-- 2. SISTEMA DE CATÁLOGO (Búsquedas rápidas en la tienda)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_color ON product_variants(color_id);
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants(size_id);

-- ------------------------------------------------------------------------------
-- 3. GESTIÓN DE PEDIDOS Y DASHBOARD
-- ------------------------------------------------------------------------------
-- Acelera el buscador de la tabla de Pedidos
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Acelera el Dashboard (búsqueda por fechas)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ------------------------------------------------------------------------------
-- 4. INSCRIPCIONES A EVENTOS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations(event_id);

-- Acelera el buscador de Inscripciones buscando dentro del JSON
CREATE INDEX IF NOT EXISTS idx_registrations_participant ON event_registrations USING GIN (participant_details);

-- ==============================================================================
-- 1. CREACIÓN DE LA TABLA DE AUDITORÍA (AUDIT LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quién hizo el cambio
    action VARCHAR(50) NOT NULL,                             -- 'CREATE', 'UPDATE', 'DELETE' (Soft)
    table_name VARCHAR(100) NOT NULL,                        -- Ej: 'products', 'orders'
    record_id VARCHAR(50),                                   -- El ID de la fila afectada
    old_data JSONB,                                          -- Foto de cómo estaban los datos antes
    new_data JSONB,                                          -- Foto de cómo quedaron los datos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para que buscar en el historial sea ultra rápido
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ==============================================================================
-- 2. INYECCIÓN DE SOFT DELETES (Borrado Lógico)
-- ==============================================================================
-- Añadimos la columna "deleted_at" a las tablas más críticas y financieras.
-- Por defecto es NULL (significa que NO están borrados).

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE event_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
