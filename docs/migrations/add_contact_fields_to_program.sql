-- Add address and phone fields to breeding_programs table
ALTER TABLE IF EXISTS breeding_programs 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment explaining purpose
COMMENT ON COLUMN breeding_programs.address IS 'Physical location or address for the breeding program';
COMMENT ON COLUMN breeding_programs.phone IS 'Contact phone number for the breeding program';