-- ==============================================================================
-- 🛒 SISTEMA E-COMMERCE Y EVENTOS: SCRIPT DE INICIALIZACIÓN (UNIFICADO)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MÓDULO 1: SISTEMA DE AUTENTICACIÓN Y USUARIOS (NEXTAUTH.JS)
-- ------------------------------------------------------------------------------

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
    deleted_at TIMESTAMPTZ DEFAULT NULL, -- Integrado
    CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

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

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    "sessionToken" VARCHAR(255) NOT NULL,
    CONSTRAINT fk_sessions_users FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE verification_token (
    identifier TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL,
    PRIMARY KEY (identifier, token)
);

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,

    -- Datos E-commerce
    document_type VARCHAR(20) DEFAULT 'DNI',
    document_number VARCHAR(50),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Perú',

    -- Datos Deportivos
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
-- MÓDULO 2: SISTEMA MULTIMEDIA (GALERÍAS POLIMÓRFICAS)
-- ------------------------------------------------------------------------------

CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    media_type VARCHAR(20) NOT NULL,
    media_url TEXT NOT NULL,         
    media_key TEXT,                  
    file_name VARCHAR(255),          
    file_format VARCHAR(50),         
    size_bytes BIGINT,               
    width INTEGER,                   
    height INTEGER,                  
    alt_text VARCHAR(255),           
    folder_name VARCHAR(100) DEFAULT 'general', 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Sintaxis corregida
);

CREATE INDEX idx_media_folder ON media(folder_name);
CREATE INDEX idx_media_type ON media(media_type);

CREATE TABLE media_links (
    id SERIAL PRIMARY KEY,
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, 
    model_id INTEGER NOT NULL,       
    collection_name VARCHAR(50) DEFAULT 'gallery', 
    display_order INTEGER DEFAULT 0,               
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_links_model ON media_links(model_type, model_id);
CREATE INDEX idx_media_links_media_id ON media_links(media_id);
CREATE UNIQUE INDEX idx_media_links_unique ON media_links(media_id, model_type, model_id, collection_name);

-- ------------------------------------------------------------------------------
-- MÓDULO 3: CATÁLOGO E-COMMERCE E INVENTARIO
-- ------------------------------------------------------------------------------

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,                
    slug VARCHAR(100) UNIQUE NOT NULL,        
    description TEXT,                                  
    image_url TEXT,                                    
    image_key TEXT,                                    
    status VARCHAR(20) DEFAULT 'activo',       
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Integrado
);

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,                
    slug VARCHAR(100) UNIQUE NOT NULL,        
    description TEXT,                                  
    image_url TEXT,                                    
    image_key TEXT,                                    
    status VARCHAR(20) DEFAULT 'activo',       
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Integrado
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT, -- Aquí se almacena el HTML de tu RichTextEditor
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    track_stock BOOLEAN DEFAULT TRUE,
    
    -- Relaciones básicas
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    brand_id INTEGER REFERENCES brands(id) ON DELETE RESTRICT,
    gender_id INTEGER REFERENCES master_genders(id) ON DELETE RESTRICT,
    
    -- 🔥 PORTADA PRINCIPAL (Igual que en la tabla de eventos)
    image_url TEXT, -- URL pública de la imagen principal en S3
    image_key TEXT, -- Identificador en S3 para poder reemplazarla o borrarla
    
    status VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_gender ON products(gender_id);

CREATE TABLE master_colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,       
    hex_code VARCHAR(7),                    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE master_sizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,       
    category VARCHAR(50),                   
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_id INTEGER REFERENCES master_sizes(id) ON DELETE RESTRICT,
    color_id INTEGER REFERENCES master_colors(id) ON DELETE RESTRICT,
    sku VARCHAR(100) UNIQUE,               
    stock INTEGER NOT NULL DEFAULT 0,
    track_stock BOOLEAN DEFAULT TRUE,      
    status VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL, -- Integrado
    UNIQUE(product_id, size_id, color_id) 
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_color ON product_variants(color_id);
CREATE INDEX idx_variants_size ON product_variants(size_id);

-- ------------------------------------------------------------------------------
-- MÓDULO 4: EVENTOS DEPORTIVOS Y REGISTROS
-- ------------------------------------------------------------------------------

CREATE TABLE master_distances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE 
);

CREATE TABLE master_genders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE 
);

CREATE TABLE master_age_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    default_min_age INTEGER NOT NULL,
    default_max_age INTEGER NOT NULL
);

CREATE TABLE master_event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE 
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    route_geojson JSONB,
    event_type_id INTEGER REFERENCES master_event_types(id) ON DELETE RESTRICT,
    image_url TEXT,
    image_key TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE event_categories (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    distance_id INTEGER REFERENCES master_distances(id) ON DELETE RESTRICT,
    gender_id INTEGER REFERENCES master_genders(id) ON DELETE RESTRICT,
    age_category_id INTEGER REFERENCES master_age_categories(id) ON DELETE RESTRICT,
    applied_min_age INTEGER NOT NULL, 
    applied_max_age INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cupos INTEGER NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ DEFAULT NULL, -- Integrado
    UNIQUE(event_id, distance_id, gender_id, age_category_id)
);

CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES event_categories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    participant_details JSONB NOT NULL, 
    bib_number INTEGER, 
    registration_status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    payment_receipt_url TEXT,
    operation_number VARCHAR(100),
    payment_amount DECIMAL(10, 2),
    voucher_date TIMESTAMPTZ,
    payment_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL, -- Integrado
    UNIQUE(event_id, user_id),             
    UNIQUE(event_id, operation_number)     
);

CREATE INDEX idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_registrations_participant ON event_registrations USING GIN (participant_details);

CREATE TABLE event_results (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES event_registrations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    total_time INTERVAL NOT NULL,
    overall_position INTEGER,
    category_position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- MÓDULO 5: PEDIDOS Y VENTAS (ORDERS)
-- ------------------------------------------------------------------------------

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, 
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_dni VARCHAR(20), 
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), 
    payment_status VARCHAR(50) DEFAULT 'pendiente', 
    order_status VARCHAR(50) DEFAULT 'nuevo', 
    operation_number VARCHAR(100), -- Sintaxis corregida (era ;)
    payment_receipt_url TEXT,      -- Sintaxis corregida (era ;)
    notes TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Integrado
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL, 
    product_name VARCHAR(255) NOT NULL, 
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL, 
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- MÓDULO 6: CMS Y CONFIGURACIÓN GLOBALES
-- ------------------------------------------------------------------------------

CREATE TABLE club_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#000000', 
    secondary_color VARCHAR(7) DEFAULT '#000000',
    description TEXT,
    social_links JSONB DEFAULT '{}', 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,               
    subtitle VARCHAR(255),                     
    image_url TEXT NOT NULL,                   
    image_key TEXT NOT NULL,                   
    link_url TEXT,                             
    type VARCHAR(50) DEFAULT 'general',        
    sort_order INT DEFAULT 0,                  
    event_id INT REFERENCES events(id) ON DELETE SET NULL, -- FK definida directamente aquí
    status VARCHAR(20) DEFAULT 'activo',       
    start_date TIMESTAMPTZ,                       
    end_date TIMESTAMPTZ,                         
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Integrado
);

CREATE INDEX idx_banners_order_status ON banners(sort_order, status);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, 
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_id VARCHAR(50), 
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    action VARCHAR(50) NOT NULL,                             
    table_name VARCHAR(100) NOT NULL,                        
    record_id VARCHAR(50),                                   
    old_data JSONB,                                          
    new_data JSONB,                                          
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ------------------------------------------------------------------------------
-- MÓDULO 7: TRIGGERS Y FUNCIONES
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_product_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = (
        SELECT COALESCE(SUM(stock), 0) 
        FROM product_variants
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
          AND track_stock = TRUE 
          AND status = 'activo'
          AND deleted_at IS NULL 
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN NULL; 
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_stock ON product_variants;
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT OR UPDATE OF stock, status, track_stock, deleted_at OR DELETE
ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_total_stock();