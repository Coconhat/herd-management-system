-- Create Milking Records table
CREATE TABLE IF NOT EXISTS milking_records (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER NOT NULL REFERENCES animals(id),
  milking_date DATE NOT NULL,
  milk_yield DECIMAL(8,2), -- in liters/kg
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on milking_records table
ALTER TABLE milking_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for milking_records table
CREATE POLICY "milking_records_select_own" ON milking_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "milking_records_insert_own" ON milking_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "milking_records_update_own" ON milking_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "milking_records_delete_own" ON milking_records FOR DELETE USING (auth.uid() = user_id);
