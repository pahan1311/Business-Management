-- XAMPP SQL Migration Script for CIDMS Database Updates
-- August 22, 2025

-- Create new table for inquiry types
CREATE TABLE IF NOT EXISTS inquiry_types (
    type VARCHAR(50) PRIMARY KEY
);

INSERT INTO inquiry_types VALUES 
    ('GENERAL'), ('ORDER'), ('PRODUCT'), ('DELIVERY'), ('OTHER');
    
-- Drop foreign key constraints before modifying columns
ALTER TABLE inquiries
DROP FOREIGN KEY IF EXISTS inquiries_ibfk_2,
DROP FOREIGN KEY IF EXISTS fk_inquiry_assigned_to,
DROP FOREIGN KEY IF EXISTS fk_inquiry_status,
DROP FOREIGN KEY IF EXISTS fk_inquiry_customer;
-- August 22, 2025

-- Create new enum types
-- Update inquiry_status values to match our new uppercase format
TRUNCATE TABLE inquiry_status;
INSERT INTO inquiry_status VALUES ('OPEN'), ('IN_PROGRESS'), ('RESOLVED'), ('CLOSED');

-- Add new table for inquiry types
CREATE TABLE IF NOT EXISTS inquiry_types (
    type VARCHAR(50) PRIMARY KEY
);

INSERT INTO inquiry_types VALUES 
    ('GENERAL'), ('ORDER'), ('PRODUCT'), ('DELIVERY'), ('OTHER');

-- Create new table for inquiry replies
CREATE TABLE IF NOT EXISTS inquiry_replies (
    id VARCHAR(255) PRIMARY KEY,
    inquiry_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    message TEXT NOT NULL,
    attachments TEXT NULL,
    is_internal TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inquiry_reply_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
    CONSTRAINT fk_inquiry_reply_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create delivery_partners table
CREATE TABLE IF NOT EXISTS delivery_partners (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    contact_person VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    contract_start TIMESTAMP NULL,
    contract_end TIMESTAMP NULL,
    areas_covered JSON NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Alter users table to add reference to delivery partners
ALTER TABLE users 
ADD COLUMN partner_id VARCHAR(255) NULL,
ADD COLUMN department VARCHAR(100) NULL,
ADD CONSTRAINT fk_user_partner FOREIGN KEY (partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL;

-- Modify inquiries table for our updates
ALTER TABLE inquiries 
ADD COLUMN type VARCHAR(50) AFTER description,
ADD COLUMN order_number VARCHAR(100) NULL AFTER type,
MODIFY status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
CHANGE COLUMN description message TEXT NOT NULL,
ADD CONSTRAINT fk_inquiry_type FOREIGN KEY (type) REFERENCES inquiry_types(type),
ADD CONSTRAINT fk_inquiry_status FOREIGN KEY (status) REFERENCES inquiry_status(status),
ADD CONSTRAINT fk_inquiry_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
ADD CONSTRAINT fk_inquiry_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id);

-- Add these columns if they don't exist already
-- Check if attachments column exists, if not add it
SELECT COUNT(*) INTO @attachments_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'inquiries' 
AND COLUMN_NAME = 'attachments';

SET @add_attachments = IF(@attachments_exists = 0, 
    'ALTER TABLE inquiries ADD COLUMN attachments TEXT NULL AFTER description', 
    'SELECT "Attachments column already exists"');

PREPARE stmt FROM @add_attachments;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if notes column exists, if not add it
SELECT COUNT(*) INTO @notes_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'inquiries' 
AND COLUMN_NAME = 'notes';

SET @add_notes = IF(@notes_exists = 0, 
    'ALTER TABLE inquiries ADD COLUMN notes TEXT NULL AFTER description', 
    'SELECT "Notes column already exists"');

PREPARE stmt FROM @add_notes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update the inquiries table to rename 'description' to 'message' if needed
ALTER TABLE inquiries CHANGE COLUMN description message TEXT NOT NULL;

-- Insert sample delivery partner
INSERT INTO delivery_partners (id, name, email, phone, address, contact_person, contract_start, contract_end, notes)
VALUES ('dpt001', 'Express Logistics', 'contact@expresslogistics.com', '555-111-2222', 
        '789 Delivery Lane, Logisticsville, CA 94321', 'Mike Johnson', 
        DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 9 MONTH),
        'Reliable delivery partner with excellent track record');

-- Update some users to be associated with delivery partner
UPDATE users SET partner_id = 'dpt001', department = 'DELIVERY' WHERE role = 'DELIVERY' LIMIT 5;

-- Insert sample data into inquiry_replies for existing inquiries
INSERT INTO inquiry_replies (id, inquiry_id, user_id, message, is_internal)
SELECT 
    CONCAT('ir-', SUBSTRING(MD5(RAND()), 1, 8)), 
    id, 
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 
    'System generated initial response.', 
    0
FROM inquiries;

-- Update existing inquiries to have types
UPDATE inquiries SET type = 'GENERAL' WHERE type IS NULL OR type NOT IN ('GENERAL', 'ORDER', 'PRODUCT', 'DELIVERY', 'OTHER');

-- Add some sample inquiries with different types if none exist
INSERT INTO inquiries (id, customer_id, subject, message, type, status, priority, created_at)
SELECT 
    CONCAT('inq-', SUBSTRING(MD5(RAND()), 1, 8)),
    (SELECT id FROM customers ORDER BY RAND() LIMIT 1),
    'Inquiry about product availability',
    'I would like to know if the Deluxe Gadget is back in stock?',
    'PRODUCT',
    'OPEN',
    2,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM inquiries WHERE type = 'PRODUCT' LIMIT 1);

INSERT INTO inquiries (id, customer_id, subject, message, type, status, priority, created_at)
SELECT 
    CONCAT('inq-', SUBSTRING(MD5(RAND()), 1, 8)),
    (SELECT id FROM customers ORDER BY RAND() LIMIT 1),
    'Delivery delay for my order',
    'My order ORD-2023-0001 was supposed to arrive yesterday but I have not received it yet.',
    'DELIVERY',
    'OPEN',
    3,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 10) DAY)
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM inquiries WHERE type = 'DELIVERY' LIMIT 1);

-- Success message
SELECT 'Database migration completed successfully!' as 'Status';
