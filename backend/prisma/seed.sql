-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert default admin user (password: admin123)
INSERT INTO "users" ("id", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@cidms.com',
  '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', -- admin123
  'System Administrator',
  'ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO "products" ("id", "name", "description", "sku", "price", "onHand", "reserved", "reorderPoint", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Laptop Computer', 'High-performance laptop for business use', 'LAP-001', 999.99, 50, 0, 10, true, NOW(), NOW()),
  (gen_random_uuid(), 'Wireless Mouse', 'Ergonomic wireless mouse', 'MSE-001', 29.99, 100, 0, 20, true, NOW(), NOW()),
  (gen_random_uuid(), 'USB-C Cable', 'Fast charging USB-C cable', 'CBL-001', 15.99, 200, 0, 50, true, NOW(), NOW()),
  (gen_random_uuid(), 'Desk Phone', 'Professional desk telephone', 'PHN-001', 89.99, 30, 0, 5, true, NOW(), NOW()),
  (gen_random_uuid(), 'Office Chair', 'Ergonomic office chair', 'CHR-001', 199.99, 25, 0, 5, true, NOW(), NOW())
ON CONFLICT (sku) DO NOTHING;

-- Insert sample customers
INSERT INTO "customers" ("id", "name", "email", "phone", "address", "city", "state", "zipCode", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'John Smith', 'john.smith@example.com', '+1-555-0101', '123 Main St', 'New York', 'NY', '10001', true, NOW(), NOW()),
  (gen_random_uuid(), 'Sarah Johnson', 'sarah.johnson@example.com', '+1-555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90001', true, NOW(), NOW()),
  (gen_random_uuid(), 'Mike Davis', 'mike.davis@example.com', '+1-555-0103', '789 Pine Rd', 'Chicago', 'IL', '60601', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert delivery users
INSERT INTO "users" ("id", "email", "password", "name", "phone", "role", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'delivery1@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Tom Wilson', '+1-555-1001', 'DELIVERY', true, NOW(), NOW()),
  (gen_random_uuid(), 'delivery2@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Lisa Brown', '+1-555-1002', 'DELIVERY', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert staff users
INSERT INTO "users" ("id", "email", "password", "name", "phone", "role", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'staff1@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Alex Rodriguez', '+1-555-2001', 'STAFF', true, NOW(), NOW()),
  (gen_random_uuid(), 'staff2@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Emma Taylor', '+1-555-2002', 'STAFF', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
