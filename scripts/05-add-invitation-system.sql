-- Add invitation system to email whitelist
-- This extends the existing whitelist with invitation functionality

-- Add invitation fields to email_whitelist table
ALTER TABLE email_whitelist ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) UNIQUE;
ALTER TABLE email_whitelist ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP;
ALTER TABLE email_whitelist ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP;
ALTER TABLE email_whitelist ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT FALSE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_email_whitelist_invitation_token ON email_whitelist(invitation_token);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_invitation_expires ON email_whitelist(invitation_expires_at);

-- Update existing records to set is_registered = false for new system
UPDATE email_whitelist SET is_registered = FALSE WHERE is_registered IS NULL;
