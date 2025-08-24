-- Adding user_id columns and RLS policies for multi-user support

-- Create Animals table
CREATE TABLE IF NOT EXISTS animals (
  id SERIAL PRIMARY KEY,
  ear_tag VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  breed VARCHAR(100),
  birth_date DATE,
  sex VARCHAR(10) CHECK (sex IN ('Male', 'Female')),
  dam_id INTEGER REFERENCES animals(id),
  sire_id INTEGER REFERENCES animals(id),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Deceased', 'Culled')),
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ear_tag, user_id)
);

-- Enable RLS on animals table
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

-- RLS policies for animals table
CREATE POLICY "animals_select_own" ON animals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "animals_insert_own" ON animals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "animals_update_own" ON animals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "animals_delete_own" ON animals FOR DELETE USING (auth.uid() = user_id);

-- Create Calvings table
CREATE TABLE IF NOT EXISTS calvings (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER NOT NULL REFERENCES animals(id),
  calving_date DATE NOT NULL,
  calf_ear_tag VARCHAR(50),
  calf_sex VARCHAR(10) CHECK (calf_sex IN ('Male', 'Female')),
  birth_weight DECIMAL(5,2),
  complications TEXT,
  assistance_required BOOLEAN DEFAULT FALSE,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on calvings table
ALTER TABLE calvings ENABLE ROW LEVEL SECURITY;

-- RLS policies for calvings table
CREATE POLICY "calvings_select_own" ON calvings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calvings_insert_own" ON calvings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calvings_update_own" ON calvings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "calvings_delete_own" ON calvings FOR DELETE USING (auth.uid() = user_id);

-- Create Health Records table
CREATE TABLE IF NOT EXISTS health_records (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER NOT NULL REFERENCES animals(id),
  record_date DATE NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  description TEXT,
  treatment TEXT,
  veterinarian VARCHAR(100),
  cost DECIMAL(10,2),
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on health_records table
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for health_records table
CREATE POLICY "health_records_select_own" ON health_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "health_records_insert_own" ON health_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health_records_update_own" ON health_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "health_records_delete_own" ON health_records FOR DELETE USING (auth.uid() = user_id);

-- Create Breeding Records table
CREATE TABLE IF NOT EXISTS breeding_records (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER NOT NULL REFERENCES animals(id),
  breeding_date DATE NOT NULL,
  sire_ear_tag VARCHAR(50),
  breeding_method VARCHAR(20) CHECK (breeding_method IN ('Natural', 'AI')),
  expected_calving_date DATE,
  confirmed_pregnant BOOLEAN,
  pregnancy_check_date DATE,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on breeding_records table
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for breeding_records table
CREATE POLICY "breeding_records_select_own" ON breeding_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "breeding_records_insert_own" ON breeding_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "breeding_records_update_own" ON breeding_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "breeding_records_delete_own" ON breeding_records FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_animals_user_id ON animals(user_id);
CREATE INDEX IF NOT EXISTS idx_animals_ear_tag_user ON animals(ear_tag, user_id);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_calvings_animal_id ON calvings(animal_id);
CREATE INDEX IF NOT EXISTS idx_calvings_user_id ON calvings(user_id);
CREATE INDEX IF NOT EXISTS idx_calvings_date ON calvings(calving_date);
CREATE INDEX IF NOT EXISTS idx_health_records_animal_id ON health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_animal_id ON breeding_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_user_id ON breeding_records(user_id);
