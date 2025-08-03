-- Initialize database for price tracker development
-- This script runs automatically when PostgreSQL container starts

-- Create extensions
CREATE
EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE
EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database schema
CREATE SCHEMA IF NOT EXISTS price_tracker;

-- Set default schema
SET
search_path = price_tracker, public;

-- Create users table
CREATE TABLE IF NOT EXISTS users
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    email VARCHAR
(
    255
) UNIQUE NOT NULL,
    password_hash VARCHAR
(
    255
),
    provider VARCHAR
(
    50
) DEFAULT 'local', -- local, google, microsoft, apple
    provider_id VARCHAR
(
    255
),
    first_name VARCHAR
(
    100
),
    last_name VARCHAR
(
    100
),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR
(
    255
),
    reset_password_token VARCHAR
(
    255
),
    reset_password_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create products table
CREATE TABLE IF NOT EXISTS products
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    url VARCHAR
(
    2000
) NOT NULL,
    title VARCHAR
(
    500
),
    description TEXT,
    image_url VARCHAR
(
    1000
),
    brand VARCHAR
(
    100
),
    category VARCHAR
(
    100
),
    domain VARCHAR
(
    255
) NOT NULL,
    selector_config JSONB, -- CSS selectors and extraction rules
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    check_frequency INTEGER DEFAULT 24, -- hours
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE
(
    url
)
    );

-- Create user_products table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_products
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    user_id UUID NOT NULL REFERENCES users
(
    id
) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products
(
    id
)
  ON DELETE CASCADE,
    target_price DECIMAL
(
    12,
    2
), -- alert when price drops below this
    max_price DECIMAL
(
    12,
    2
), -- alert when price goes above this
    is_active BOOLEAN DEFAULT true,
    notify_price_drop BOOLEAN DEFAULT true,
    notify_price_increase BOOLEAN DEFAULT false,
    notify_back_in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE
(
    user_id,
    product_id
)
    );

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    product_id UUID NOT NULL REFERENCES products
(
    id
) ON DELETE CASCADE,
    price DECIMAL
(
    12,
    2
) NOT NULL,
    original_price DECIMAL
(
    12,
    2
), -- original price before discount
    currency VARCHAR
(
    3
) DEFAULT 'VND',
    discount_percentage INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    stock_status VARCHAR
(
    50
), -- in_stock, out_of_stock, limited_stock
    extracted_data JSONB, -- raw extracted data for debugging
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    user_id UUID NOT NULL REFERENCES users
(
    id
) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products
(
    id
)
  ON DELETE CASCADE,
    type VARCHAR
(
    50
) NOT NULL, -- price_drop, price_increase, back_in_stock
    title VARCHAR
(
    255
) NOT NULL,
    message TEXT NOT NULL,
    old_price DECIMAL
(
    12,
    2
),
    new_price DECIMAL
(
    12,
    2
),
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create scraping_logs table for debugging
CREATE TABLE IF NOT EXISTS scraping_logs
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    product_id UUID NOT NULL REFERENCES products
(
    id
) ON DELETE CASCADE,
    status VARCHAR
(
    50
) NOT NULL, -- success, error, timeout
    error_message TEXT,
    response_time INTEGER, -- milliseconds
    extracted_price DECIMAL
(
    12,
    2
),
    raw_html TEXT,
    user_agent VARCHAR
(
    500
),
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_products_domain ON products(domain);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_active ON user_products(is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_product_recorded ON price_history(product_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_product_created ON scraping_logs(product_id, created_at DESC);

-- Create updated_at trigger function
CREATE
OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$
language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE
    ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE
    ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_products_updated_at
    BEFORE UPDATE
    ON user_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO users (email, first_name, last_name, is_verified)
VALUES ('developer@example.com', 'Dev', 'User', true),
       ('test@example.com', 'Test', 'User', true) ON CONFLICT (email) DO NOTHING;

-- Create a sample product for testing
INSERT INTO products (url, title, domain, selector_config)
VALUES ('https://didongviet.vn/may-tinh-bang/ipad-air-m3-11-inch-128gb-wifi.html',
        'iPad Air M3 11 inch 128GB WiFi',
        'didongviet.vn',
        '{"price_selector": ".price-current", "title_selector": "h1.product-title", "image_selector": ".product-image img"}'::jsonb) ON CONFLICT (url) DO NOTHING;

-- Grant permissions (if needed)
GRANT
ALL
PRIVILEGES
ON
ALL
TABLES IN SCHEMA price_tracker TO devuser;
GRANT ALL PRIVILEGES ON ALL
SEQUENCES IN SCHEMA price_tracker TO devuser;
