# Email Notifications Setup Guide

## Overview

Your farm management system now sends **automatic email notifications** for:

- ✅ **PD Check Reminders** - 29 days after breeding
- ✅ **Expected Calving Alerts** - When calving date approaches
- ✅ **Breeding Reopen Reminders** - When animals are ready to breed again after calving

Emails are sent via **Resend API** integrated directly in Supabase.

---

## 🚀 Setup Instructions

### Step 1: Create the Notifications Table

Run this in your Supabase SQL Editor:

```sql
-- Run the script: scripts/09-create-notifications-table.sql
```

Or copy-paste from: `scripts/09-create-notifications-table.sql`

### Step 2: Verify Resend Integration

Your Resend integration is already configured! Verify it exists:

```sql
-- Check if the function exists
SELECT proname FROM pg_proc WHERE proname = 'send_resend_email_on_insert';

-- Check if API key is stored
SELECT name FROM private.service_secrets WHERE name = 'resend_api_key';
```

You should see both results.

### Step 3: Test the Email System

#### Option A: Manual Test (Recommended)

Run this in Supabase SQL Editor:

```sql
-- Replace with YOUR email address
INSERT INTO public.notifications
  (user_id, animal_id, title, body, scheduled_for, channel, metadata)
VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'YOUR-EMAIL@example.com' LIMIT 1),
    NULL,
    'Test Email from Farm System',
    '<h2>Hello!</h2><p>If you receive this, your email notifications are working! 🎉</p>',
    NOW(),  -- Send immediately
    'email',
    jsonb_build_object('from', 'DH-MAGPANTAY-FARM@resend.dev')
  )
RETURNING *;
```

**Check your inbox!** You should receive the email within 1-2 minutes.

#### Option B: Test with a Real Breeding Record

1. Log into your farm system
2. Go to **Record → Breeding**
3. Create a new breeding record
4. Check your email in 1-2 minutes
5. You should get a "PD Check Reminder" email!

---

## 📧 How It Works

### Automatic Email Flow:

```
User creates breeding →
Notification inserted in database →
Supabase trigger fires →
Resend API called →
Email sent! ✅
```

### Email Schedule:

1. **Immediately after breeding:**

   - PD Check reminder scheduled for 29 days later

2. **After marking "Pregnant":**

   - Expected calving alert scheduled for 283 days after breeding

3. **After recording calving:**
   - Breeding reopen reminder scheduled for reopen date

---

## 🔧 Configuration

### Change "From" Email Address

The default sender is: `DH-MAGPANTAY-FARM@resend.dev`

To change it:

1. **In Resend Dashboard:**

   - Go to https://resend.com
   - Add and verify your custom domain
   - Update the from address below

2. **In Supabase SQL Editor:**

```sql
-- Update all notification functions to use your custom from address
-- Find and replace 'DH-MAGPANTAY-FARM@resend.dev' with 'noreply@yourdomain.com'
```

3. **In code files:**

   - `lib/actions/breeding.ts`
   - `lib/actions/calvings.ts`

   Change:

   ```typescript
   from: "DH-MAGPANTAY-FARM@resend.dev";
   ```

   To:

   ```typescript
   from: "noreply@yourdomain.com";
   ```

### Update Resend API Key

If you need to change your API key:

```sql
-- In Supabase SQL Editor
UPDATE private.service_secrets
SET value = 'YOUR_NEW_API_KEY'
WHERE name = 'resend_api_key';
```

---

## 📊 Monitoring Notifications

### Check Pending Notifications

```sql
SELECT
  id,
  title,
  scheduled_for,
  sent,
  created_at,
  (SELECT email FROM auth.users WHERE id = notifications.user_id) as recipient
FROM notifications
WHERE sent = FALSE
ORDER BY scheduled_for;
```

### Check Sent Notifications

```sql
SELECT
  id,
  title,
  scheduled_for,
  created_at,
  (SELECT email FROM auth.users WHERE id = notifications.user_id) as recipient
FROM notifications
WHERE sent = TRUE
ORDER BY created_at DESC
LIMIT 20;
```

### Process Overdue Notifications Manually

If emails aren't sending automatically, run:

```sql
SELECT process_due_notifications(100);
```

This will process up to 100 overdue notifications at once.

---

## 🐛 Troubleshooting

### Problem: No emails received

**Check 1: Is the notification created?**

```sql
SELECT * FROM notifications WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'YOUR-EMAIL@example.com'
)
ORDER BY created_at DESC LIMIT 5;
```

**Check 2: Is `sent` = TRUE?**

- If YES: Email was sent. Check spam folder.
- If NO: Email failed. Check Resend logs.

**Check 3: Resend API logs**

1. Go to https://resend.com/logs
2. Check for errors
3. Common issues:
   - Invalid API key
   - Unverified sender domain
   - Rate limits exceeded

### Problem: Emails sending but not received

1. **Check spam/junk folder**
2. **Verify sender domain in Resend**
3. **Test with a different email provider** (Gmail, Outlook, etc.)

### Problem: Trigger not firing

```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'send_email_on_notification_insert';

-- If missing, recreate it:
CREATE TRIGGER send_email_on_notification_insert
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_resend_email_on_insert();
```

---

## 📅 Setting Up Scheduled Processing (Optional)

For production, set up a cron job to process pending notifications:

### Option 1: Supabase Cron (Recommended)

```sql
-- Run every 5 minutes
SELECT cron.schedule(
  'process-farm-notifications',
  '*/5 * * * *',
  $$
  SELECT process_due_notifications(100);
  $$
);
```

### Option 2: pg_cron Extension

Enable pg_cron in Supabase:

1. Go to Database → Extensions
2. Enable `pg_cron`
3. Run the cron schedule above

---

## 🎨 Email Templates

### Current Email Format:

**PD Check Reminder:**

```
Subject: PD Check Reminder: [Ear Tag]
Body:
  Pregnancy diagnosis check is due for [Animal Name].
  Breeding Date: [Date]
  PD Check Date: [Date]
  Please perform the pregnancy check and update the results in the system.
```

**Expected Calving:**

```
Subject: Calving Expected: [Ear Tag]
Body:
  Calving is expected for [Animal Name].
  Expected Calving Date: [Date]
  Please monitor the animal closely and prepare for delivery.
```

**Breeding Reopen:**

```
Subject: Ready for Breeding: [Ear Tag]
Body:
  [Animal Name] will be available for breeding again.
  Reopen Date: [Date]
  The voluntary waiting period has ended.
```

### Customize Templates

Edit the templates in:

- `lib/actions/breeding.ts` (lines 80-107, 210-236)
- `lib/actions/calvings.ts` (lines 127-157)

---

## 💰 Resend Pricing

- **Free Tier:** 100 emails/day, 3,000/month
- **Paid Plans:** Starting at $20/month for 50,000 emails

For a typical farm with 50-100 animals:

- Estimated emails: ~5-10/day
- **Free tier is sufficient!** ✅

---

## ✅ Quick Checklist

- [ ] Run `scripts/09-create-notifications-table.sql` in Supabase
- [ ] Verify Resend function exists with test query
- [ ] Send test email with manual INSERT
- [ ] Check inbox (and spam) for test email
- [ ] Create a breeding record and verify PD reminder
- [ ] (Optional) Set up cron job for scheduled processing
- [ ] (Optional) Add custom domain in Resend for branded emails

---

## 📞 Support

If emails still aren't working:

1. Check Supabase logs: Database → Logs
2. Check Resend logs: https://resend.com/logs
3. Verify API key is correct
4. Test with `process_due_notifications()` manually

---

**Last Updated:** January 2025  
**System Version:** Email Notifications v1.0
