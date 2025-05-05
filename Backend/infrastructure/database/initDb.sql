BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS Users (
    uid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'non-user')),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS Categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    parent INT REFERENCES Categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    logoUrl TEXT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS Products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    thumbUrl TEXT NOT NULL,
    brandId INT REFERENCES Brands(id) ON DELETE SET NULL,
    cateId INT REFERENCES Categories(id) ON DELETE SET NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS ProductImages (
    id SERIAL PRIMARY KEY,
    productId INT NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    imageUrl TEXT NOT NULL
);

-- PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS ProductVariants (
    id SERIAL PRIMARY KEY,
    productId INT NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL CHECK (stock >= 0),
    imageId INT REFERENCES ProductImages(id) ON DELETE SET NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS ProductReviews (
    id SERIAL PRIMARY KEY,
    productId INT NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    userId UUID NOT NULL REFERENCES Users(uid) ON DELETE SET NULL,
    rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
    review TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS CartItems (
    id SERIAL PRIMARY KEY,
    cartId UUID NOT NULL REFERENCES Users(uid) ON DELETE CASCADE,
    productId INT NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS Promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discountType VARCHAR(20) NOT NULL CHECK (discountType IN ('percentage', 'fixed_amount')),
    discountValue DECIMAL(10, 2) NOT NULL,
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCT PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS ProductPromotions (
    id SERIAL PRIMARY KEY,
    productId INT NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    promotionId INT NOT NULL REFERENCES Promotions(id) ON DELETE CASCADE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- COUPONS TABLE
CREATE TABLE IF NOT EXISTS Coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    discountType VARCHAR(20) NOT NULL CHECK (discountType IN ('percentage', 'fixed_amount')),
    discountValue DECIMAL(10, 2) NOT NULL,
    minPurchase DECIMAL(10, 2) DEFAULT 0,
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    maxUses INT,
    usesCount INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ORDER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS OrderAddresses (
    id SERIAL PRIMARY KEY,
    userId UUID NOT NULL REFERENCES Users(uid) ON DELETE CASCADE,
    fullName VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district TEXT NOT NULL,
    ward TEXT NOT NULL,
    address TEXT NOT NULL,
    note TEXT,
    state VARCHAR(100),
    phoneNumber VARCHAR(20) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS Orders (
    id SERIAL PRIMARY KEY,
    userId UUID REFERENCES Users(uid) ON DELETE SET NULL,
    totalPrice DECIMAL(10, 2) NOT NULL,
    addressId INT REFERENCES OrderAddresses(id) ON DELETE SET NULL,
    couponId INT REFERENCES Coupons(id) ON DELETE SET NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payingMethod VARCHAR(20) NOT NULL CHECK (payingMethod IN ('Cash', 'Credit Card', 'PayPal')),
    shippingMethod VARCHAR(20) NOT NULL CHECK (shippingMethod IN ('Standard', 'Express')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Delivering', 'Completed', 'Cancelled'))
);

-- ORDER DETAILS TABLE
CREATE TABLE IF NOT EXISTS OrderDetails (
    id SERIAL PRIMARY KEY,
    orderId INT NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    productId INT REFERENCES Products(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_cart_items_cart_id ON CartItems(cartId);
CREATE INDEX idx_order_details_order_id ON OrderDetails(orderId);
CREATE INDEX idx_product_reviews_product_id ON ProductReviews(productId);
CREATE INDEX idx_product_variants_product_id ON ProductVariants(productId);
CREATE INDEX idx_product_variants_image_id ON ProductVariants(imageId);
CREATE INDEX idx_product_reviews_user_id ON ProductReviews(userId);
CREATE INDEX idx_product_images_product_id ON ProductImages(productId);
CREATE INDEX idx_cart_items_product_id ON CartItems(productId);

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for categories table
CREATE TRIGGER set_updated_at_categories
BEFORE UPDATE ON Categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for products table
CREATE TRIGGER set_updated_at_products
BEFORE UPDATE ON Products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for users table
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for ProductReviews table
CREATE TRIGGER set_updated_at_product_reviews
BEFORE UPDATE ON ProductReviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for CartItems table
CREATE TRIGGER set_updated_at_cart_items
BEFORE UPDATE ON CartItems
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for ProductVariants table
CREATE TRIGGER set_updated_at_product_variants
BEFORE UPDATE ON ProductVariants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for Promotions table
CREATE TRIGGER set_updated_at_promotions
BEFORE UPDATE ON Promotions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for Coupons table
CREATE TRIGGER set_updated_at_coupons
BEFORE UPDATE ON Coupons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the trigger for OrderAddresses table
CREATE TRIGGER set_updated_at_user_addresses
BEFORE UPDATE ON OrderAddresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;