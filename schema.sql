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

-- 2.2. Índices de optimización para el front-end (Carga rápida del carrusel)
CREATE INDEX idx_banners_order_status ON banners(sort_order, status);


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

-- Índice para búsquedas rápidas por categoría o marca
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);

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

-- Índices para que los filtros de la web "Vuelen"
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_color ON product_variants(color_id);
CREATE INDEX idx_variants_size ON product_variants(size_id);

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
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    route_geojson JSONB,
    event_type_id INTEGER REFERENCES master_event_types(id) ON DELETE RESTRICT,
    image_url TEXT,
    image_key TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ahora sí agregamos la FK a banners (Evitamos dependencias circulares)
ALTER TABLE banners ADD CONSTRAINT fk_banners_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

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