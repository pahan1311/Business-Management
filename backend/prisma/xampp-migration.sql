-- XAMPP SQL Commands to update CIDMS database
-- Run these commands in phpMyAdmin SQL tab or MySQL console
-- August 22, 2025

-- Create new enum types first
-- Update inquiry_status values to match our new uppercase format
TRUNCATE TABLE inquiry_status;
INSERT INTO inquiry_status VALUES ('OPEN'), ('IN_PROGRESS'), ('RESOLVED'), ('CLOSED');

-- Add new table for inquiry types
CREATE TABLE IF NOT EXISTS inquiry_types (
    type VARCHAR(50) PRIMARY KEY
);

INSERT INTO inquiry_types VALUES 
    ('GENERAL'), ('ORDER'), ('PRODUCT'), ('DELIVERY'), ('OTHER');

-- Drop existing inquiries table constraints if they exist
ALTER TABLE inquiries
DROP FOREIGN KEY IF EXISTS fk_inquiry_assigned_to,
DROP FOREIGN KEY IF EXISTS fk_inquiry_customer,
DROP FOREIGN KEY IF EXISTS fk_inquiry_status;

-- Create new table for inquiry replies
CREATE TABLE IF NOT EXISTS inquiry_replies (
    id VARCHAR(255) PRIMARY KEY,
    inquiry_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    message TEXT NOT NULL,
    attachments TEXT NULL,
    is_internal TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    contract_start DATE NULL,
    contract_end DATE NULL,
    areas_covered TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Alter users table to add reference to delivery partners
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS partner_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL;

-- Add foreign key after we ensure the column exists
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS fk_user_partner 
FOREIGN KEY (partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL;

-- Modify inquiries table for our updates
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) AFTER description,
ADD COLUMN IF NOT EXISTS order_number VARCHAR(100) NULL AFTER type,
ADD COLUMN IF NOT EXISTS attachments TEXT NULL AFTER description,
ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER description;

-- Update column names
ALTER TABLE inquiries 
CHANGE COLUMN description message TEXT NOT NULL;

-- Update status to be UPPERCASE
UPDATE inquiries SET status = UPPER(REPLACE(status, '-', '_'));

-- Add foreign keys to inquiries table
ALTER TABLE inquiries
ADD CONSTRAINT fk_inquiry_type FOREIGN KEY (type) REFERENCES inquiry_types(type),
ADD CONSTRAINT fk_inquiry_status FOREIGN KEY (status) REFERENCES inquiry_status(status),
ADD CONSTRAINT fk_inquiry_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
ADD CONSTRAINT fk_inquiry_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id);

-- Add foreign keys to inquiry_replies table
ALTER TABLE inquiry_replies
ADD CONSTRAINT fk_inquiry_reply_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_inquiry_reply_user FOREIGN KEY (user_id) REFERENCES users(id);

-- Update existing inquiries to have types
UPDATE inquiries SET type = 'GENERAL' WHERE type IS NULL OR type NOT IN ('GENERAL', 'ORDER', 'PRODUCT', 'DELIVERY', 'OTHER');

-- Insert sample delivery partner
INSERT INTO delivery_partners (id, name, email, phone, address, contact_person, contract_start, contract_end, notes)
VALUES ('dpt001', 'Express Logistics', 'contact@expresslogistics.com', '555-111-2222', 
        '789 Delivery Lane, Logisticsville, CA 94321', 'Mike Johnson', 
        DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 9 MONTH),
        'Reliable delivery partner with excellent track record');

-- Update some users to be associated with delivery partner
UPDATE users SET partner_id = 'dpt001', department = 'DELIVERY' WHERE role = 'DELIVERY' LIMIT 5;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_id ON inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON inquiries(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry_id ON inquiry_replies(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);

-- Insert sample inquiries
INSERT INTO inquiries (id, customer_id, subject, message, type, status, priority)
VALUES 
('inq001', 'clcust1', 'Question about my recent order', 
 'I ordered a Premium Widget last week but haven\'t received a shipping notification yet.', 
 'ORDER', 'OPEN', 2);

-- Insert sample replies
INSERT INTO inquiry_replies (id, inquiry_id, user_id, message, is_internal)
VALUES 
('irep001', 'inq001', 
 (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 
 'Thank you for contacting us. I\'ve checked your order and it\'s being prepared for shipping today. You should receive a notification by tomorrow morning.', 
 0);

-- Success message
SELECT 'Database migration completed successfully!' as 'Status';
