-- MySQL seed data for CIDMS
-- Note: Run this after creating the database and running migrations

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `name`, `role`, `isActive`, `createdAt`, `updatedAt`)
VALUES (
  'admin-user-001',
  'admin@cidms.com',
  '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', -- admin123
  'System Administrator',
  'ADMIN',
  1,
  NOW(),
  NOW()
);

-- Insert sample products
INSERT IGNORE INTO `products` (`id`, `name`, `description`, `sku`, `price`, `onHand`, `reserved`, `reorderPoint`, `isActive`, `createdAt`, `updatedAt`)
VALUES 
  ('prod-001', 'Laptop Computer', 'High-performance laptop for business use', 'LAP-001', 999.99, 50, 0, 10, 1, NOW(), NOW()),
  ('prod-002', 'Wireless Mouse', 'Ergonomic wireless mouse', 'MSE-001', 29.99, 100, 0, 20, 1, NOW(), NOW()),
  ('prod-003', 'USB-C Cable', 'Fast charging USB-C cable', 'CBL-001', 15.99, 200, 0, 50, 1, NOW(), NOW()),
  ('prod-004', 'Desk Phone', 'Professional desk telephone', 'PHN-001', 89.99, 30, 0, 5, 1, NOW(), NOW()),
  ('prod-005', 'Office Chair', 'Ergonomic office chair', 'CHR-001', 199.99, 25, 0, 5, 1, NOW(), NOW());

-- Insert sample customers
INSERT IGNORE INTO `customers` (`id`, `name`, `email`, `phone`, `address`, `city`, `state`, `zipCode`, `isActive`, `createdAt`, `updatedAt`)
VALUES 
  ('cust-001', 'John Smith', 'john.smith@example.com', '+1-555-0101', '123 Main St', 'New York', 'NY', '10001', 1, NOW(), NOW()),
  ('cust-002', 'Sarah Johnson', 'sarah.johnson@example.com', '+1-555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 1, NOW(), NOW()),
  ('cust-003', 'Mike Davis', 'mike.davis@example.com', '+1-555-0103', '789 Pine Rd', 'Chicago', 'IL', '60601', 1, NOW(), NOW());

-- Insert delivery users
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `name`, `phone`, `role`, `isActive`, `createdAt`, `updatedAt`)
VALUES 
  ('deliv-001', 'delivery1@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Tom Wilson', '+1-555-1001', 'DELIVERY', 1, NOW(), NOW()),
  ('deliv-002', 'delivery2@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Lisa Brown', '+1-555-1002', 'DELIVERY', 1, NOW(), NOW());

-- Insert staff users
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `name`, `phone`, `role`, `isActive`, `createdAt`, `updatedAt`)
VALUES 
  ('staff-001', 'staff1@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Alex Rodriguez', '+1-555-2001', 'STAFF', 1, NOW(), NOW()),
  ('staff-002', 'staff2@cidms.com', '$2a$12$LQv3c1yqBwTw55Mh1GE4iepGkUFPMwlIDgXdpvBu7gQgzFYhTzQh2', 'Emma Taylor', '+1-555-2002', 'STAFF', 1, NOW(), NOW());

-- Insert sample orders
INSERT IGNORE INTO `orders` (`id`, `orderNumber`, `customerId`, `status`, `totalAmount`, `notes`, `createdAt`, `updatedAt`)
VALUES 
  ('order-001', 'ORD-2024-001', 'cust-001', 'PENDING', 1059.97, 'Initial test order', NOW(), NOW()),
  ('order-002', 'ORD-2024-002', 'cust-002', 'CONFIRMED', 229.98, 'Office supplies order', NOW(), NOW()),
  ('order-003', 'ORD-2024-003', 'cust-003', 'READY_FOR_DISPATCH', 15.99, 'Cable replacement', NOW(), NOW());

-- Insert sample order items
INSERT IGNORE INTO `order_items` (`id`, `orderId`, `productId`, `quantity`, `price`, `createdAt`)
VALUES 
  ('item-001', 'order-001', 'prod-001', 1, 999.99, NOW()),
  ('item-002', 'order-001', 'prod-002', 2, 29.99, NOW()),
  ('item-003', 'order-002', 'prod-005', 1, 199.99, NOW()),
  ('item-004', 'order-002', 'prod-002', 1, 29.99, NOW()),
  ('item-005', 'order-003', 'prod-003', 1, 15.99, NOW());

-- Insert sample deliveries
INSERT IGNORE INTO `deliveries` (`id`, `orderId`, `assignedToId`, `status`, `pickupAddress`, `deliveryAddress`, `notes`, `createdAt`, `updatedAt`)
VALUES 
  ('deliv-001', 'order-002', 'deliv-001', 'ASSIGNED', '123 Warehouse St, New York, NY 10001', '456 Oak Ave, Los Angeles, CA 90001', 'Handle with care', NOW(), NOW()),
  ('deliv-002', 'order-003', 'deliv-002', 'PICKED_UP', '123 Warehouse St, New York, NY 10001', '789 Pine Rd, Chicago, IL 60601', 'Express delivery', NOW(), NOW());

-- Insert sample tasks
INSERT IGNORE INTO `tasks` (`id`, `title`, `description`, `type`, `status`, `priority`, `assignedToId`, `createdById`, `dueDate`, `createdAt`, `updatedAt`)
VALUES 
  ('task-001', 'Prepare Order ORD-2024-001', 'Prepare laptop and accessories for shipment', 'PREPARE_ORDER', 'PENDING', 2, 'staff-001', 'admin-user-001', DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW()),
  ('task-002', 'Inventory Check - Laptops', 'Check laptop inventory levels', 'INVENTORY_CHECK', 'IN_PROGRESS', 1, 'staff-002', 'admin-user-001', DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW()),
  ('task-003', 'Customer Service - John Smith', 'Follow up on delivery inquiry', 'CUSTOMER_SERVICE', 'PENDING', 3, 'staff-001', 'admin-user-001', DATE_ADD(NOW(), INTERVAL 3 DAY), NOW(), NOW());

-- Insert sample inquiries
INSERT IGNORE INTO `inquiries` (`id`, `customerId`, `subject`, `description`, `status`, `priority`, `assignedToId`, `createdAt`, `updatedAt`)
VALUES 
  ('inq-001', 'cust-001', 'Delivery Status Inquiry', 'When will my laptop order be delivered?', 'OPEN', 2, 'staff-001', NOW(), NOW()),
  ('inq-002', 'cust-002', 'Product Return Request', 'I need to return the office chair, it doesn\'t fit', 'IN_PROGRESS', 1, 'staff-002', NOW(), NOW()),
  ('inq-003', 'cust-003', 'Product Information', 'Do you have any wireless keyboards in stock?', 'OPEN', 3, NULL, NOW(), NOW());
