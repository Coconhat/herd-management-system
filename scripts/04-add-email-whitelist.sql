-- Create email whitelist table
CREATE TABLE IF NOT EXISTS email_whitelist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on email_whitelist table
ALTER TABLE email_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_whitelist table (only authenticated users can view)
CREATE POLICY "email_whitelist_select_authenticated" ON email_whitelist FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "email_whitelist_insert_authenticated" ON email_whitelist FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "email_whitelist_update_authenticated" ON email_whitelist FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "email_whitelist_delete_authenticated" ON email_whitelist FOR DELETE USING (auth.role() = 'authenticated');

-- Insert initial farm owner email (replace with actual farm owner email)
-- You should update this with the actual farm owner's email address
INSERT INTO email_whitelist (email, notes, is_active) 
VALUES 
  ('farmowner@example.com', 'Farm Owner - Initial Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_active ON email_whitelist(is_active);
