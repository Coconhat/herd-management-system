# Simple Email Whitelist System - Setup Guide

## Overview

This is a **simple whitelist system** where you control who can sign up for your farm management system.

### How It Works (3 Simple Steps)

1. **Admin adds email** to whitelist via admin panel
2. **User visits signup page** and creates their own password
3. **Done!** User can now log in and use the system

No invitation links, no tokens, no complexity. Just add an email, and they can sign up.

---

## Database Setup

### Step 1: Run the Migration Scripts

Execute these SQL scripts in your Supabase SQL Editor in order:

#### 1. Create the whitelist table (if not exists)

```sql
-- scripts/04-add-email-whitelist.sql
CREATE TABLE IF NOT EXISTS email_whitelist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE email_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "email_whitelist_select_authenticated"
  ON email_whitelist FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "email_whitelist_insert_authenticated"
  ON email_whitelist FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "email_whitelist_update_authenticated"
  ON email_whitelist FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "email_whitelist_delete_authenticated"
  ON email_whitelist FOR DELETE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_active ON email_whitelist(is_active);
```

#### 2. Add the is_registered tracking column

```sql
-- scripts/05-add-invitation-system.sql (modified)
ALTER TABLE email_whitelist
ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_email_whitelist_registered
  ON email_whitelist(is_registered);

UPDATE email_whitelist
SET is_registered = FALSE
WHERE is_registered IS NULL;
```

#### 3. Clean up unnecessary complexity (optional but recommended)

```sql
-- scripts/08-simplify-whitelist.sql
-- Remove invitation token columns if they exist
ALTER TABLE email_whitelist DROP COLUMN IF EXISTS invitation_token;
ALTER TABLE email_whitelist DROP COLUMN IF EXISTS invitation_expires_at;
ALTER TABLE email_whitelist DROP COLUMN IF EXISTS invitation_sent_at;

-- Drop unnecessary indexes
DROP INDEX IF EXISTS idx_email_whitelist_invitation_token;
DROP INDEX IF EXISTS idx_email_whitelist_invitation_expires;
```

### Step 2: Add Your First Admin Email

```sql
-- Replace with YOUR actual email address
INSERT INTO email_whitelist (email, notes, is_active, is_registered)
VALUES
  ('your-email@example.com', 'Farm Owner - Admin', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;
```

**Important:** Set `is_registered = TRUE` for your own email since you already have an account.

---

## Application Setup

### File Structure

Your simplified whitelist system uses these files:

```
lib/actions/whitelist-simple.ts          # Server actions for whitelist
app/api/auth/check-whitelist/route.ts    # Check if email is whitelisted
app/api/auth/mark-registered/route.ts    # Mark email as registered after signup
app/api/admin/whitelist/route.ts         # Admin API for managing whitelist
app/admin/whitelist/page.tsx             # Admin UI for managing whitelist
app/auth/sign-up/page.tsx                # User signup page (checks whitelist)
```

### Configuration

No special configuration needed! The system works out of the box.

---

## Usage Guide

### For Administrators

#### Access the Admin Panel

Navigate to: `https://your-domain.com/admin/whitelist`

#### Add a New User

1. Enter the user's email address
2. (Optional) Add notes like "Farm Manager" or "Veterinarian"
3. Click "Add to Whitelist"
4. Share the signup page URL with them: `https://your-domain.com/auth/sign-up`

That's it! The user can now create their own account with their own password.

#### Monitor Users

The admin panel shows:

- **Pending**: Email is whitelisted but user hasn't signed up yet
- **Registered**: User has created an account
- **Inactive**: Email was removed from whitelist (can't sign up anymore)

#### Remove a User's Access

Click the trash icon next to an email to remove them from the whitelist.

**Note:** This only prevents NEW signups. If they already have an account, they can still log in.

---

### For End Users

#### Signing Up

1. Go to `https://your-domain.com/auth/sign-up`
2. Enter your email address (must be whitelisted by admin)
3. Create a password
4. Confirm password
5. Click "Sign up"
6. Done! You can now log in

#### Error Messages

- **"This email is not authorized"**: Your email hasn't been added to the whitelist. Contact your administrator.
- **"An account with this email already exists"**: You already signed up. Use the login page instead.

---

## Security Features

✅ **Whitelist Validation**: Only pre-approved emails can sign up
✅ **Registration Tracking**: System tracks which emails have signed up
✅ **Row Level Security (RLS)**: Database enforces authentication requirements
✅ **Secure Password Storage**: Supabase handles password hashing
✅ **Prevent Duplicate Signups**: Email can only sign up once

---

## Troubleshooting

### Problem: "Email is not authorized" but I added it

**Solution:**

1. Check the admin panel - is the email spelled correctly?
2. Check if `is_active = true` in the database
3. Try logging out and back into the admin panel

### Problem: User can't sign up even though email is whitelisted

**Solution:**

1. Check if `is_registered = true` already (can't sign up twice)
2. Check Supabase Auth logs for specific errors
3. Verify RLS policies are in place

### Problem: Admin panel not loading

**Solution:**

1. Make sure you're logged in
2. Check browser console for errors
3. Verify `/api/admin/whitelist` endpoint is accessible

### Problem: Need to remove ALL whitelist entries

```sql
-- Run this in Supabase SQL Editor
DELETE FROM email_whitelist
WHERE is_active = FALSE;  -- Remove inactive entries

-- Or to keep history but deactivate all:
UPDATE email_whitelist
SET is_active = FALSE;
```

---

## FAQ

**Q: Can users change their own passwords?**
A: Yes, through Supabase's built-in password reset flow.

**Q: Can I bulk import emails?**
A: Yes! Use SQL:

```sql
INSERT INTO email_whitelist (email, notes, is_active, is_registered)
VALUES
  ('user1@example.com', 'Farm Worker', TRUE, FALSE),
  ('user2@example.com', 'Veterinarian', TRUE, FALSE),
  ('user3@example.com', 'Manager', TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;
```

**Q: What if someone signs up with a whitelisted email but I need to revoke their access?**
A: Remove them from the whitelist to prevent future signups. To disable their existing account, you'll need to use Supabase's user management in the dashboard.

**Q: Can users see who else is whitelisted?**
A: No, the whitelist is only visible to authenticated users in the admin panel.

**Q: Is there a limit to how many emails I can whitelist?**
A: No hard limit, but for performance, keep it reasonable (< 10,000 emails).

---

## Migration from Old Complex System

If you're upgrading from the old invitation token system:

1. Run the cleanup script (`08-simplify-whitelist.sql`)
2. Update all code references from `email-whitelist.ts` to `whitelist-simple.ts`
3. Remove any old invitation-related UI components
4. Test the new signup flow thoroughly

---

## API Reference

### Check Whitelist

```typescript
POST /api/auth/check-whitelist
Body: { email: string }
Response: { isWhitelisted: boolean, message: string }
```

### Mark as Registered

```typescript
POST / api / auth / mark - registered;
Body: {
  email: string;
}
Response: {
  success: boolean;
}
```

### Get All Whitelisted Emails (Admin)

```typescript
GET /api/admin/whitelist
Response: WhitelistEmail[]
```

### Add Email (Admin)

```typescript
POST /api/admin/whitelist
Body: { email: string, notes?: string }
Response: { success: boolean, message: string }
```

### Remove Email (Admin)

```typescript
DELETE /api/admin/whitelist
Body: { email: string, permanent?: boolean }
Response: { success: boolean, message: string }
```

---

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase logs
3. Verify database schema matches this guide
4. Test with a simple email first (like a temporary email service)

---

**Last Updated:** December 2024  
**System Version:** Simple Whitelist v2.0
