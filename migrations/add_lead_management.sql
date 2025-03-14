-- Add new fields to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lead_status VARCHAR(50) DEFAULT 'new';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lead_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;

-- Create customer_communications table for tracking interactions
CREATE TABLE IF NOT EXISTS customer_communications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    communication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    communication_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    initiated_by VARCHAR(100),
    follow_up_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_contracts table
CREATE TABLE IF NOT EXISTS customer_contracts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    puppy_id INTEGER REFERENCES puppies(id) ON DELETE SET NULL,
    contract_type VARCHAR(100) NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signing_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    content TEXT,
    document_url TEXT,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    payment_details TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
