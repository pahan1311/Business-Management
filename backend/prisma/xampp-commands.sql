-- XAMPP SQL Migration Commands for CIDMS Database
-- August 22, 2025
-- Run these commands in phpMyAdmin SQL tab

-- Step 1: Create new tables and update lookup tables
-- -----------------------------------------------------

-- Update inquiry status values to be uppercase
TRUNCATE TABLE inquiry_status;
INSERT INTO inquiry_status VALUES ('OPEN'), ('IN_PROGRESS'), ('RESOLVED'), ('CLOSED');

-- Create inquiry types table
CREATE TABLE IF NOT EXISTS inquiry_types (
    type VARCHAR(50) PRIMARY KEY
);

-- Add inquiry types
INSERT INTO inquiry_types VALUES 
    ('GENERAL'), ('ORDER'), ('PRODUCT'), ('DELIVERY'), ('OTHER');

-- Create delivery partners table
CREATE TABLE IF NOT EXISTS delivery_partners (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    contact_person VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    contract_start DATE NULL,
    contract_end DATE NULL,
    areas_covered TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create inquiry replies table
CREATE TABLE IF NOT EXISTS inquiry_replies (
    id VARCHAR(255) PRIMARY KEY,
    inquiry_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NULL,
    message TEXT NOT NULL,
    is_internal TINYINT(1) NOT NULL DEFAULT 0,
    attachments TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 2: Modify existing tables
-- -----------------------------------------------------

-- Drop existing foreign keys on inquiries table
ALTER TABLE inquiries
DROP FOREIGN KEY IF EXISTS fk_inquiry_status,
DROP FOREIGN KEY IF EXISTS fk_inquiry_assigned_to,
DROP FOREIGN KEY IF EXISTS fk_inquiry_customer;

-- Update users table to add partner_id and department
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS partner_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL;

-- Modify inquiries table to add new columns
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NULL AFTER description,
ADD COLUMN IF NOT EXISTS order_number VARCHAR(100) NULL AFTER type,
ADD COLUMN IF NOT EXISTS attachments TEXT NULL AFTER type,
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Rename description to message in inquiries table
ALTER TABLE inquiries CHANGE COLUMN description message TEXT NOT NULL;

-- Update status to uppercase in inquiries table
UPDATE inquiries SET status = UPPER(REPLACE(status, '-', '_'));
UPDATE inquiries SET type = 'GENERAL' WHERE type IS NULL;

-- Step 3: Add foreign key constraints
-- -----------------------------------------------------

-- Add foreign key from users to delivery_partners
ALTER TABLE users
ADD CONSTRAINT fk_user_partner FOREIGN KEY (partner_id) 
REFERENCES delivery_partners(id) ON DELETE SET NULL;

-- Add foreign keys to inquiries table
ALTER TABLE inquiries
ADD CONSTRAINT fk_inquiry_type FOREIGN KEY (type) 
REFERENCES inquiry_types(type),
ADD CONSTRAINT fk_inquiry_status FOREIGN KEY (status) 
REFERENCES inquiry_status(status),
ADD CONSTRAINT fk_inquiry_customer FOREIGN KEY (customer_id) 
REFERENCES customers(id),
ADD CONSTRAINT fk_inquiry_assigned_to FOREIGN KEY (assigned_to_id) 
REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign keys to inquiry_replies
ALTER TABLE inquiry_replies
ADD CONSTRAINT fk_inquiry_reply_inquiry FOREIGN KEY (inquiry_id) 
REFERENCES inquiries(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_inquiry_reply_user FOREIGN KEY (user_id) 
REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Add indexes for performance
-- -----------------------------------------------------

CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_type ON inquiries(type);
CREATE INDEX idx_inquiries_customer_id ON inquiries(customer_id);
CREATE INDEX idx_inquiries_assigned_to ON inquiries(assigned_to_id);
CREATE INDEX idx_inquiry_replies_inquiry_id ON inquiry_replies(inquiry_id);
CREATE INDEX idx_users_partner_id ON users(partner_id);

-- Step 5: Add sample data
-- -----------------------------------------------------

-- Add sample delivery partner
INSERT INTO delivery_partners (id, name, email, phone, address, contact_person, notes)
VALUES (
    'dpt001', 
    'Express Logistics', 
    'contact@expresslogistics.com', 
    '555-111-2222', 
    '789 Delivery Lane, Logisticsville, CA 94321', 
    'Mike Johnson', 
    'Reliable delivery partner with excellent track record'
);

-- Associate existing delivery users with partner
UPDATE users SET partner_id = 'dpt001', department = 'DELIVERY' 
WHERE role = 'DELIVERY' LIMIT 5;

-- Add sample inquiry if none exists
INSERT INTO inquiries (id, customer_id, subject, message, type, status, priority)
SELECT 
    'inq001', 
    (SELECT id FROM customers LIMIT 1), 
    'Question about my recent order', 
    'I ordered a Premium Widget but haven\'t received shipping information yet', 
    'ORDER', 
    'OPEN', 
    2
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM inquiries LIMIT 1);

-- Add sample reply to an inquiry
INSERT INTO inquiry_replies (id, inquiry_id, user_id, message, is_internal)
SELECT 
    'rep001', 
    (SELECT id FROM inquiries LIMIT 1), 
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 
    'Thank you for contacting us. We are checking on your order and will update you soon.', 
    0
FROM dual;

-- Success message
SELECT 'Database migration completed successfully!' as 'Status';
