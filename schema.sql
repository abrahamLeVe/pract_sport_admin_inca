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
    
    -- Relaciones (Integridad referencial: ON DELETE RESTRICT evita borrar categorías/marcas con productos)
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

-- 1. Tabla de Variantes de Producto
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(50),      -- Ej. '40', '42', 'M', 'L', 'Única'
    color VARCHAR(50),     -- Ej. 'Rojo', 'Negro', 'Azul Marino'
    sku VARCHAR(100),      -- Código único de barra/inventario (Opcional)
    stock INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índice para acelerar las búsquedas en la tienda
CREATE INDEX idx_variants_product ON product_variants(product_id);