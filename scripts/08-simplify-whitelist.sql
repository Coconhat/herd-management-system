-- Simplify whitelist system
-- Remove unnecessary invitation complexity

-- Drop invitation-related columns since we don't need them for simple whitelist
ALTER TABLE email_whitelist DROP COLUMN IF EXISTS invitation_token;
ALTER TABLE email_whitelist DROP COLUMN IF EXISTS invitation_expires_at;
ALTER TABLE email_whitelist DROP COLUMN IF EXISTS invitation_sent_at;

-- Keep is_registered to track who has actually signed up
-- ALTER TABLE email_whitelist DROP COLUMN IF EXISTS is_registered;
-- Actually, keep this to track who has registered

-- Simplify the table structure
COMMENT ON TABLE email_whitelist IS 'Simple whitelist - Add email here, user can sign up with their own password';
COMMENT ON COLUMN email_whitelist.email IS 'Email address allowed to sign up';
COMMENT ON COLUMN email_whitelist.is_active IS 'Whether this email can still register (false = revoked)';
COMMENT ON COLUMN email_whitelist.is_registered IS 'Whether someone has signed up with this email yet';
COMMENT ON COLUMN email_whitelist.notes IS 'Optional notes about this user (e.g., "Farm Manager", "Veterinarian")';

-- Drop unnecessary indexes
DROP INDEX IF EXISTS idx_email_whitelist_invitation_token;
DROP INDEX IF EXISTS idx_email_whitelist_invitation_expires;

-- Make sure we have the basic indexes
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_active ON email_whitelist(is_active);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_registered ON email_whitelist(is_registered);
