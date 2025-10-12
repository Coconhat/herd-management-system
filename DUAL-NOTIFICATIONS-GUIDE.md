# Dual-Channel Notifications Setup Guide

## Overview

Your farm system now has **TWO notification channels working together**:

1. **📧 Email Notifications** - Sent at 7 AM Philippine time
2. **🔔 In-App Notifications** - Viewable at `/notifications` page

**Every important event creates BOTH:**

- ✅ An email notification (sent at 7 AM PHT on the scheduled date)
- ✅ An in-app notification (visible on the notifications page immediately)

---

## 🎯 Notification Types

### 1. **PD Check Reminders**

- **When:** 29 days after breeding
- **Email sent:** 7 AM Philippine Time on day 29
- **In-app:** Created immediately, visible on `/notifications`
- **Purpose:** Remind you to perform pregnancy diagnosis

### 2. **Expected Calving Alerts**

- **When:** 283 days after breeding (when marked pregnant)
- **Email sent:** 7 AM Philippine Time on expected calving date
- **In-app:** Created immediately, visible on `/notifications`
- **Purpose:** Alert you that calving is expected soon

### 3. **Breeding Reopen Reminders**

- **When:** Reopen date after calving (usually 40-60 days)
- **Email sent:** 7 AM Philippine Time on reopen date
- **In-app:** Created immediately, visible on `/notifications`
- **Purpose:** Remind you the animal is ready to breed again

---

## ⏰ Email Timing: 7 AM Philippine Time

### How It Works:

```typescript
// Code sets time to 7 AM Philippine Time (UTC+8)
const date = new Date(scheduledDate);
date.setHours(7 - 8, 0, 0, 0); // 7 AM PHT = -1 AM UTC
```

**Example:**

- PD check scheduled for: **February 13, 2025**
- Email will be sent: **February 13, 2025 at 7:00 AM** (Manila time)
- In-app notification: **Available immediately** on `/notifications` page

### Why 7 AM?

- ✅ Early morning reminder before farm work starts
- ✅ Gives you the whole day to complete the task
- ✅ Not too early to wake you up
- ✅ Consistent timing every day

### Want to Change the Time?

Edit these files and change the hour:

**`lib/actions/breeding.ts`** (2 places):

```typescript
// Change 7 to your preferred hour (0-23)
pdDate.setHours(7 - 8, 0, 0, 0); // 7 AM PHT

// For 8 AM:
pdDate.setHours(8 - 8, 0, 0, 0); // 8 AM PHT

// For 6 AM:
pdDate.setHours(6 - 8, 0, 0, 0); // 6 AM PHT
```

**`lib/actions/calvings.ts`**:

```typescript
reopenDate.setHours(7 - 8, 0, 0, 0); // Change 7 to your preferred hour
```

---

## 📱 Using the Notifications Page

### Accessing Notifications:

1. **Direct URL:** http://localhost:3000/notifications
2. **Bell Icon:** Click the bell icon in the header (shows unread count)

### Features:

- ✅ **All Notifications** - See complete history
- ✅ **Unread Filter** - Show only new notifications
- ✅ **Read Filter** - Show completed notifications
- ✅ **Mark as Read** - Individual or bulk actions
- ✅ **Animal Links** - Click to view animal details
- ✅ **Type Badges** - Visual indicators (PD Check, Calving, Breeding Ready)

### Screenshots of Features:

**Unread Notification:**

- Blue left border
- Highlighted background
- "Mark read" button

**Read Notification:**

- Gray/faded appearance
- No border
- Archived look

---

## 🔧 Setup Instructions

### Step 1: Add Notification Bell to Header

Find your header/layout file (usually `app/layout.tsx` or `components/side-bar.tsx`):

```typescript
import { NotificationBell } from "@/components/notification-bell";

// In your header JSX:
<header>
  {/* ... other header items ... */}
  <NotificationBell />
  {/* ... user menu ... */}
</header>;
```

### Step 2: Add to Sidebar Menu (Optional)

In your sidebar navigation, add:

```typescript
{
  title: "Notifications",
  url: "/notifications",
  icon: Bell,
}
```

### Step 3: Test the System

#### Test 1: Create a Breeding Record

1. Go to **Record → Breeding**
2. Create a new breeding record
3. Check:
   - ✅ Email scheduled for 29 days from now at 7 AM
   - ✅ Notification appears on `/notifications` page immediately

#### Test 2: Mark as Pregnant

1. Mark the breeding as "Pregnant"
2. Check:
   - ✅ Email scheduled for 283 days from now at 7 AM
   - ✅ Notification appears on `/notifications` page immediately

#### Test 3: Record a Calving

1. Record a calving
2. Check:
   - ✅ Email scheduled for reopen date at 7 AM
   - ✅ Notification appears on `/notifications` page immediately

---

## 🔍 Monitoring Notifications

### Check All Notifications in Database:

```sql
SELECT
  id,
  channel,
  title,
  scheduled_for,
  sent,
  read,
  (SELECT email FROM auth.users WHERE id = notifications.user_id) as recipient
FROM notifications
ORDER BY scheduled_for DESC;
```

### Check Pending Emails:

```sql
SELECT
  id,
  title,
  scheduled_for,
  sent
FROM notifications
WHERE channel = 'email'
  AND sent = FALSE
  AND scheduled_for > NOW()
ORDER BY scheduled_for;
```

### Check In-App Notifications:

```sql
SELECT
  id,
  title,
  read,
  created_at
FROM notifications
WHERE channel = 'in_app'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📊 How It Works

### Double Insert Strategy:

Every important event creates **TWO** notification records:

```typescript
// 1. EMAIL notification (triggers email sending at scheduled time)
await supabase.from("notifications").insert({
  ...notificationData,
  channel: "email",
  scheduled_for: "2025-02-13 07:00:00+08", // 7 AM PHT
});

// 2. IN-APP notification (visible immediately on /notifications page)
await supabase.from("notifications").insert({
  ...notificationData,
  channel: "in_app",
  scheduled_for: "2025-02-13 07:00:00+08", // Same date for reference
  sent: true, // N/A for in-app
});
```

### Why Two Records?

| Channel  | Purpose                    | When Created | When Processed            |
| -------- | -------------------------- | ------------ | ------------------------- |
| `email`  | Send email reminder        | Immediately  | At 7 AM on scheduled date |
| `in_app` | Show in notifications page | Immediately  | Available immediately     |

**Benefits:**

- ✅ Users get email reminder at optimal time
- ✅ Users can also check notifications anytime in the app
- ✅ Complete history of all farm events
- ✅ No risk of missing important dates

---

## 🎨 Customization

### Change Email Time for Specific Notification Types:

```typescript
// PD checks at 7 AM
pdDate.setHours(7 - 8, 0, 0, 0);

// Calvings at 6 AM (earlier warning)
calvingDate.setHours(6 - 8, 0, 0, 0);

// Reopen at 8 AM (later in the morning)
reopenDate.setHours(8 - 8, 0, 0, 0);
```

### Customize Email Templates:

Edit the `body` field in:

- `lib/actions/breeding.ts` (lines ~85-90, ~215-220)
- `lib/actions/calvings.ts` (lines ~140-145)

### Add More Notification Types:

1. Insert notification with custom type:

```typescript
metadata: {
  from: "DH-MAGPANTAY-FARM@resend.dev",
  type: "heat_detection", // Custom type
}
```

2. Add icon and badge in `app/notifications/page.tsx`:

```typescript
case "heat_detection":
  return <Heart className="h-5 w-5 text-red-500" />;
```

---

## 🐛 Troubleshooting

### Problem: Notifications not appearing on `/notifications` page

**Check 1:** Are in-app notifications being created?

```sql
SELECT * FROM notifications WHERE channel = 'in_app' ORDER BY created_at DESC LIMIT 5;
```

**Check 2:** Clear browser cache and refresh

**Check 3:** Check browser console for API errors

### Problem: Email not sending at 7 AM

**Check:** Verify email notification exists and is scheduled:

```sql
SELECT id, title, scheduled_for, sent
FROM notifications
WHERE channel = 'email'
  AND sent = FALSE
ORDER BY scheduled_for;
```

**Check:** Run manual processing:

```sql
SELECT process_due_notifications(100);
```

### Problem: Time zone issues

Philippine Time is **UTC+8**. If emails are arriving at wrong times:

```typescript
// Verify this calculation:
date.setHours(7 - 8, 0, 0, 0); // 7 AM PHT = -1 AM UTC (correct)
```

### Problem: Bell icon not showing unread count

**Check:** API is accessible:

```bash
curl http://localhost:3000/api/notifications
```

**Check:** Browser console for errors

---

## 📋 Complete File List

### New Files Created:

- ✅ `app/api/notifications/route.ts` - API for fetching/updating notifications
- ✅ `app/notifications/page.tsx` - Notifications page UI
- ✅ `components/notification-bell.tsx` - Bell icon with unread count

### Updated Files:

- ✅ `lib/actions/breeding.ts` - Dual-channel notifications for PD checks and calvings
- ✅ `lib/actions/calvings.ts` - Dual-channel notifications for breeding reopen

---

## ✅ Quick Checklist

- [ ] Database notifications table exists
- [ ] Email trigger function set up in Supabase
- [ ] Resend API key configured
- [ ] Test: Create breeding record
- [ ] Test: Visit `/notifications` page
- [ ] Test: See in-app notification immediately
- [ ] Test: Confirm email scheduled for 7 AM
- [ ] Optional: Add notification bell to header
- [ ] Optional: Add notifications link to sidebar

---

## 🎯 Summary

**What happens when you create a breeding record:**

1. ✅ Breeding record saved to database
2. ✅ **Email notification** created (scheduled for 7 AM on PD check date)
3. ✅ **In-app notification** created (visible immediately)
4. ✅ Bell icon updates with unread count
5. ✅ At 7 AM on PD check date: Email sent to your inbox
6. ✅ User can mark in-app notification as read anytime

**Best of both worlds:** ⏰ Email reminder + 📱 In-app tracking!

---

**Last Updated:** January 2025  
**System:** Dual-Channel Notifications v1.0
