# Whitelist System - Quick Setup Checklist

## ✅ Step-by-Step Setup

### 1. Database Setup (Supabase SQL Editor)

- [ ] Run script 1: Create `email_whitelist` table if needed
- [ ] Run script 2: Add `is_registered` column
- [ ] Run script 3 (optional): Clean up old invitation token columns
- [ ] Add your admin email to whitelist with `is_registered = TRUE`

```sql
-- Quick command to add yourself:
INSERT INTO email_whitelist (email, notes, is_active, is_registered)
VALUES
  ('YOUR-EMAIL@example.com', 'Admin', TRUE, TRUE)
ON CONFLICT (email) DO UPDATE SET is_registered = TRUE;
```

### 2. Verify Files Exist

- [ ] `lib/actions/whitelist-simple.ts` (new file)
- [ ] `app/api/auth/mark-registered/route.ts` (new file)
- [ ] `app/admin/whitelist/page.tsx` (new file)
- [ ] `app/api/auth/check-whitelist/route.ts` (updated)
- [ ] `app/api/admin/whitelist/route.ts` (updated)
- [ ] `app/auth/sign-up/page.tsx` (updated)

### 3. Test the System

#### Test as Admin:

- [ ] Log in to your app
- [ ] Visit `/admin/whitelist`
- [ ] Add a test email (use a temporary email service like temp-mail.org)
- [ ] Verify it appears in the list with "Pending" status

#### Test as New User:

- [ ] Open signup page in incognito window: `/auth/sign-up`
- [ ] Try to sign up with a NON-whitelisted email → Should get error
- [ ] Try to sign up with your whitelisted test email → Should work!
- [ ] Create a password and complete signup
- [ ] Go back to admin panel → Email should now show "Registered" status

#### Test Duplicate Prevention:

- [ ] Try to sign up again with the same email → Should get "account already exists" error

### 4. Production Checklist

- [ ] Add all real user emails to whitelist
- [ ] Share signup link with users: `https://your-domain.com/auth/sign-up`
- [ ] Monitor the admin panel for registrations
- [ ] Remove any test emails from whitelist

---

## 🚨 Common Issues & Fixes

### Issue: "Email is not authorized" error

**Fix:** Check admin panel - is email added and active?

### Issue: Admin panel shows 404

**Fix:** Make sure you're logged in first!

### Issue: Database errors

**Fix:** Run all SQL scripts in Supabase SQL Editor

### Issue: User can't see anything after signup

**Fix:** Check RLS policies on your other tables (animals, breeding_records, etc.)

---

## 📝 Quick Commands

### Add multiple users at once:

```sql
INSERT INTO email_whitelist (email, notes, is_active, is_registered)
VALUES
  ('manager@farm.com', 'Farm Manager', TRUE, FALSE),
  ('worker@farm.com', 'Farm Worker', TRUE, FALSE),
  ('vet@clinic.com', 'Veterinarian', TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;
```

### See all whitelisted emails:

```sql
SELECT email, is_active, is_registered, notes, created_at
FROM email_whitelist
ORDER BY created_at DESC;
```

### Remove inactive emails:

```sql
DELETE FROM email_whitelist WHERE is_active = FALSE;
```

---

## 🎯 How to Use Daily

**Adding a new user:**

1. Go to `/admin/whitelist`
2. Enter their email
3. Add a note (e.g., "Assistant Manager")
4. Click "Add to Whitelist"
5. Send them this link: `https://your-domain.com/auth/sign-up`
6. Tell them to use the email you whitelisted

**That's it!** They create their own password and can start working.

---

## Need Help?

1. Check `WHITELIST-SETUP-GUIDE.md` for detailed docs
2. Check browser console (F12) for errors
3. Check Supabase logs for database errors
4. Verify all files were created correctly
