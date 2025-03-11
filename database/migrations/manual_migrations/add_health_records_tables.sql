-- Health Records Tables Migration for Supabase

-- Create health_records table
CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES dogs(id) ON DELETE CASCADE,
    puppy_id INTEGER REFERENCES puppies(id) ON DELETE CASCADE,
    record_date TIMESTAMP NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    performed_by VARCHAR(255),
    location VARCHAR(255),
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT health_records_dog_or_puppy_check CHECK ((dog_id IS NOT NULL) OR (puppy_id IS NOT NULL))
);

-- Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES dogs(id) ON DELETE CASCADE,
    puppy_id INTEGER REFERENCES puppies(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_type VARCHAR(100),
    administration_date TIMESTAMP NOT NULL,
    expiration_date TIMESTAMP,
    administered_by VARCHAR(255),
    lot_number VARCHAR(100),
    manufacturer VARCHAR(255),
    notes TEXT,
    proof_document VARCHAR(255),
    next_due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vaccinations_dog_or_puppy_check CHECK ((dog_id IS NOT NULL) OR (puppy_id IS NOT NULL))
);

-- Create weight_records table
CREATE TABLE IF NOT EXISTS weight_records (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES dogs(id) ON DELETE CASCADE,
    puppy_id INTEGER REFERENCES puppies(id) ON DELETE CASCADE,
    weight FLOAT NOT NULL,
    weight_unit VARCHAR(10) NOT NULL DEFAULT 'lbs',
    measurement_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT weight_records_dog_or_puppy_check CHECK ((dog_id IS NOT NULL) OR (puppy_id IS NOT NULL))
);

-- Create medication_records table
CREATE TABLE IF NOT EXISTS medication_records (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES dogs(id) ON DELETE CASCADE,
    puppy_id INTEGER REFERENCES puppies(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    administration_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    frequency VARCHAR(100),
    prescribed_by VARCHAR(255),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medication_records_dog_or_puppy_check CHECK ((dog_id IS NOT NULL) OR (puppy_id IS NOT NULL))
);

-- Create health_condition_templates table
CREATE TABLE IF NOT EXISTS health_condition_templates (
    id SERIAL PRIMARY KEY,
    breed_id INTEGER REFERENCES dog_breeds(id),
    condition_name VARCHAR(255) NOT NULL,
    description TEXT,
    symptoms JSONB,
    test_recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create health_conditions table
CREATE TABLE IF NOT EXISTS health_conditions (
    id SERIAL PRIMARY KEY,
    dog_id INTEGER REFERENCES dogs(id) ON DELETE CASCADE,
    puppy_id INTEGER REFERENCES puppies(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES health_condition_templates(id),
    condition_name VARCHAR(255) NOT NULL,
    diagnosis_date TIMESTAMP,
    diagnosed_by VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    notes TEXT,
    treatment_plan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT health_conditions_dog_or_puppy_check CHECK ((dog_id IS NOT NULL) OR (puppy_id IS NOT NULL))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_health_records_dog_id ON health_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_health_records_puppy_id ON health_records(puppy_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_dog_id ON vaccinations(dog_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_puppy_id ON vaccinations(puppy_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due_date ON vaccinations(next_due_date);
CREATE INDEX IF NOT EXISTS idx_weight_records_dog_id ON weight_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_puppy_id ON weight_records(puppy_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_dog_id ON medication_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_puppy_id ON medication_records(puppy_id);
CREATE INDEX IF NOT EXISTS idx_health_conditions_dog_id ON health_conditions(dog_id);
CREATE INDEX IF NOT EXISTS idx_health_conditions_puppy_id ON health_conditions(puppy_id);

-- Create RLS policies
-- For health_records table
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_records_select_policy ON health_records 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.id FROM users p 
      INNER JOIN dogs d ON d.program_id = p.program_id
      WHERE d.id = health_records.dog_id
      UNION
      SELECT p.id FROM users p 
      INNER JOIN litters l ON l.program_id = p.program_id
      INNER JOIN puppies pup ON pup.litter_id = l.id
      WHERE pup.id = health_records.puppy_id
    )
  );

-- For vaccinations table
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY vaccinations_select_policy ON vaccinations 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.id FROM users p 
      INNER JOIN dogs d ON d.program_id = p.program_id
      WHERE d.id = vaccinations.dog_id
      UNION
      SELECT p.id FROM users p 
      INNER JOIN litters l ON l.program_id = p.program_id
      INNER JOIN puppies pup ON pup.litter_id = l.id
      WHERE pup.id = vaccinations.puppy_id
    )
  );

-- For weight_records table
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY weight_records_select_policy ON weight_records 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.id FROM users p 
      INNER JOIN dogs d ON d.program_id = p.program_id
      WHERE d.id = weight_records.dog_id
      UNION
      SELECT p.id FROM users p 
      INNER JOIN litters l ON l.program_id = p.program_id
      INNER JOIN puppies pup ON pup.litter_id = l.id
      WHERE pup.id = weight_records.puppy_id
    )
  );

-- For medication_records table
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY medication_records_select_policy ON medication_records 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.id FROM users p 
      INNER JOIN dogs d ON d.program_id = p.program_id
      WHERE d.id = medication_records.dog_id
      UNION
      SELECT p.id FROM users p 
      INNER JOIN litters l ON l.program_id = p.program_id
      INNER JOIN puppies pup ON pup.litter_id = l.id
      WHERE pup.id = medication_records.puppy_id
    )
  );

-- For health_conditions table
ALTER TABLE health_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_conditions_select_policy ON health_conditions 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.id FROM users p 
      INNER JOIN dogs d ON d.program_id = p.program_id
      WHERE d.id = health_conditions.dog_id
      UNION
      SELECT p.id FROM users p 
      INNER JOIN litters l ON l.program_id = p.program_id
      INNER JOIN puppies pup ON pup.litter_id = l.id
      WHERE pup.id = health_conditions.puppy_id
    )
  );

-- For health_condition_templates table (all breeders can see these)
ALTER TABLE health_condition_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_condition_templates_select_policy ON health_condition_templates 
  FOR SELECT USING (true);

-- Add timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_records_updated_at
BEFORE UPDATE ON health_records
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vaccinations_updated_at
BEFORE UPDATE ON vaccinations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_weight_records_updated_at
BEFORE UPDATE ON weight_records
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_medication_records_updated_at
BEFORE UPDATE ON medication_records
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_health_conditions_updated_at
BEFORE UPDATE ON health_conditions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_health_condition_templates_updated_at
BEFORE UPDATE ON health_condition_templates
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();