-- MySQL Setup Script for Customer, Inventory, and Delivery Management System (CIDMS)
-- This script creates all required tables for the application

SET FOREIGN_KEY_CHECKS=0;

-- Drop tables if they exist
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS qr_tokens;
DROP TABLE IF EXISTS delivery_issues;
DROP TABLE IF EXISTS delivery_status_events;
DROP TABLE IF EXISTS order_status_events;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS=1;

-- Create user roles enum equivalent
CREATE TABLE user_roles (
    role VARCHAR(50) PRIMARY KEY
);

INSERT INTO user_roles VALUES ('ADMIN'), ('STAFF'), ('DELIVERY'), ('CUSTOMER');

-- Create order status enum equivalent
CREATE TABLE order_status (
    status VARCHAR(50) PRIMARY KEY
);

INSERT INTO order_status VALUES 
    ('PENDING'), ('CONFIRMED'), ('PREPARING'), ('READY_FOR_DISPATCH'), 
    ('OUT_FOR_DELIVERY'), ('DELIVERED'), ('CANCELED'), ('RETURNED');

-- Create delivery status enum equivalent
CREATE TABLE delivery_status (
    status VARCHAR(50) PRIMARY KEY
);

INSERT INTO delivery_status VALUES 
    ('ASSIGNED'), ('PICKED_UP'), ('OUT_FOR_DELIVERY'), ('DELIVERED'), 
    ('FAILED'), ('RETURNED'), ('CANCELED');

-- Create task status enum equivalent
CREATE TABLE task_status (
    status VARCHAR(50) PRIMARY KEY
);

INSERT INTO task_status VALUES ('PENDING'), ('IN_PROGRESS'), ('COMPLETED'), ('CANCELED');

-- Create task type enum equivalent
CREATE TABLE task_type (
    type VARCHAR(50) PRIMARY KEY
);

INSERT INTO task_type VALUES 
    ('PREPARE_ORDER'), ('INVENTORY_CHECK'), ('CUSTOMER_SERVICE'), 
    ('DELIVERY_ISSUE'), ('OTHER');

-- Create inquiry status enum equivalent
CREATE TABLE inquiry_status (
    status VARCHAR(50) PRIMARY KEY
);

INSERT INTO inquiry_status VALUES ('OPEN'), ('IN_PROGRESS'), ('RESOLVED'), ('CLOSED');

-- Create stock movement type enum equivalent
CREATE TABLE stock_movement_type (
    type VARCHAR(50) PRIMARY KEY
);

INSERT INTO stock_movement_type VALUES ('IN'), ('OUT'), ('ADJUSTMENT'), ('RESERVED'), ('RELEASED');

-- Users Table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role) REFERENCES user_roles(role)
);

-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Customers Table
CREATE TABLE customers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    on_hand INT NOT NULL DEFAULT 0,
    reserved INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_order_status FOREIGN KEY (status) REFERENCES order_status(status)
);

-- Order Items Table
CREATE TABLE order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Order Status Events Table
CREATE TABLE order_status_events (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_status_event_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_status_event_status FOREIGN KEY (status) REFERENCES order_status(status)
);

-- Deliveries Table
CREATE TABLE deliveries (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL UNIQUE,
    assigned_to_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    scheduled_at TIMESTAMP NULL,
    picked_up_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_delivery_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    CONSTRAINT fk_delivery_status FOREIGN KEY (status) REFERENCES delivery_status(status)
);

-- Delivery Status Events Table
CREATE TABLE delivery_status_events (
    id VARCHAR(255) PRIMARY KEY,
    delivery_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    location TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_status_event_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_status_event_status FOREIGN KEY (status) REFERENCES delivery_status(status)
);

-- Delivery Issues Table
CREATE TABLE delivery_issues (
    id VARCHAR(255) PRIMARY KEY,
    delivery_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_issue_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
);

-- Tasks Table
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    assigned_to_id VARCHAR(255),
    created_by_id VARCHAR(255) NOT NULL,
    due_date TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    CONSTRAINT fk_task_created_by FOREIGN KEY (created_by_id) REFERENCES users(id),
    CONSTRAINT fk_task_type FOREIGN KEY (type) REFERENCES task_type(type),
    CONSTRAINT fk_task_status FOREIGN KEY (status) REFERENCES task_status(status)
);

-- Inquiries Table
CREATE TABLE inquiries (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    assigned_to_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inquiry_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_inquiry_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    CONSTRAINT fk_inquiry_status FOREIGN KEY (status) REFERENCES inquiry_status(status)
);

-- QR Tokens Table
CREATE TABLE qr_tokens (
    id VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    order_id VARCHAR(255),
    delivery_id VARCHAR(255),
    context VARCHAR(50),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qr_token_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_qr_token_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
);

-- Stock Movements Table
CREATE TABLE stock_movements (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_movement_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_stock_movement_type FOREIGN KEY (type) REFERENCES stock_movement_type(type)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create admin user (password: admin123)
INSERT INTO users (id, email, password, name, role, is_active)
VALUES ('cldadmin1', 'admin@example.com', '$2a$10$JkpJ/k1/g1yMZnXq2Jp4fe/PiWjVyWflHg9TrAhp7HRgnJ3tl7YSe', 'System Admin', 'ADMIN', TRUE);

-- Create sample customers
INSERT INTO customers (id, name, email, phone, address, city, state, zip_code)
VALUES 
('clcust1', 'John Smith', 'john@example.com', '555-123-4567', '123 Main St', 'Anytown', 'CA', '12345'),
('clcust2', 'Jane Doe', 'jane@example.com', '555-987-6543', '456 Oak Ave', 'Somewhere', 'NY', '67890');

-- Create sample products
INSERT INTO products (id, name, description, sku, price, on_hand, reorder_point)
VALUES 
('clprod1', 'Premium Widget', 'Our best-selling widget', 'WDG-001', 29.99, 50, 10),
('clprod2', 'Deluxe Gadget', 'Top of the line gadget', 'GDG-001', 49.99, 30, 5),
('clprod3', 'Basic Thingamajig', 'Entry level thingamajig', 'TMJ-001', 19.99, 100, 20);

-- Sample order
INSERT INTO orders (id, order_number, customer_id, status, total_amount, notes)
VALUES ('clord1', 'ORD-2023-0001', 'clcust1', 'CONFIRMED', 79.97, 'Express shipping requested');

-- Sample order items
INSERT INTO order_items (id, order_id, product_id, quantity, price)
VALUES 
('clitem1', 'clord1', 'clprod1', 2, 29.99),
('clitem2', 'clord1', 'clprod3', 1, 19.99');

-- Sample delivery
INSERT INTO deliveries (id, order_id, status, pickup_address, delivery_address)
VALUES ('cldelv1', 'clord1', 'ASSIGNED', 'Warehouse A, 789 Storage Blvd', '123 Main St, Anytown, CA 12345');

-- Success message
SELECT 'Database setup completed successfully!' as 'Status';
