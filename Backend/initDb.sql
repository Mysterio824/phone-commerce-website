BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS TABLE
CREATE TABLE users (
    uid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'non-user')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
CREATE TABLE categories (
    cate_id SERIAL PRIMARY KEY,
    cate_name VARCHAR(50) NOT NULL UNIQUE,
    cate_parent INT REFERENCES categories(cate_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS TABLE
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL UNIQUE,
    product_image TEXT,
    product_description TEXT,
    product_price DECIMAL(10, 2) NOT NULL,
    product_stock INT NOT NULL CHECK (product_stock >= 0),
    product_cate_id INT REFERENCES categories(cate_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CARTS TABLE
CREATE TABLE carts (
    user_id UUID PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    cart_total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- CART ITEMS TABLE
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES carts(user_id) ON DELETE CASCADE,
    cart_item_product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    cart_item_quantity INT NOT NULL CHECK (cart_item_quantity > 0),
    cart_item_price DECIMAL(10, 2) NOT NULL -- product.price * quantity
);

-- ORDERS TABLE
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
    order_total_price DECIMAL(10, 2) NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Delivering', 'Completed', 'Cancelled'))
);

-- ORDER DETAILS TABLE
CREATE TABLE order_details (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    order_item_product_id INT REFERENCES products(product_id) ON DELETE SET NULL,
    order_item_quantity INT NOT NULL CHECK (order_item_quantity > 0),
    order_item_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_order_details_order_id ON order_details(order_id);

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for categories table
CREATE TRIGGER set_updated_at_categories
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for products table
CREATE TRIGGER set_updated_at_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;