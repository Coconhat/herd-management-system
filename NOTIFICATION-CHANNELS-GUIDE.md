# Notification Channels Guide

## Overview

Your notifications system supports multiple delivery channels. Currently, only **email** is active, but the system is designed to support other channels in the future.

---

## 📊 Channel Types

### 1. **`channel = 'email'`** ✅ ACTIVE

**What it does:**

- Sends actual emails via Resend API
- Triggered automatically by database trigger
- Used for important farm reminders

**When to use:**

- PD check reminders
- Expected calving alerts
- Breeding reopen notifications
- Critical alerts that need immediate attention

**Example:**

```sql
INSERT INTO notifications (user_id, animal_id, title, body, scheduled_for, channel)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  123,
  'PD Check Due',
  '<p>Time to check pregnancy status</p>',
  NOW() + INTERVAL '29 days',
  'email'  -- ✅ Will send email
);
```

---

### 2. **`channel = 'in_app'`** 🚧 FUTURE FEATURE

**What it does:**

- Stores notification in database only
- Does NOT send email
- Can be displayed in an in-app notification panel (not yet built)

**When to use:**

- Low-priority reminders
- Status updates
- Activity logs
- Non-urgent information

**Future implementation ideas:**

- Bell icon in header showing unread count
- Dropdown panel with recent notifications
- Mark as read functionality

**Example:**

```sql
INSERT INTO notifications (user_id, animal_id, title, body, scheduled_for, channel)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  123,
  'Animal Weight Updated',
  '<p>Weight recorded: 450 kg</p>',
  NOW(),
  'in_app'  -- ❌ Won't send email, just stored in DB
);
```

---

### 3. **`channel = 'sms'`** 📱 NOT IMPLEMENTED

**Future feature:**

- Send SMS via Twilio or similar service
- Useful for urgent alerts when user is in the field

---

### 4. **`channel = 'push'`** 🔔 NOT IMPLEMENTED

**Future feature:**

- Browser push notifications
- Mobile app push notifications

---

## 🔧 How the Email Channel Works

### Database Flow:

```
1. Your code inserts notification with channel='email'
   ↓
2. Database trigger fires: trg_send_resend_email_after_insert
   ↓
3. Trigger calls function: send_resend_email_on_insert()
   ↓
4. Function checks: if channel != 'email' then EXIT
   ↓
5. Function fetches user's email from auth.users
   ↓
6. Function calls Resend API with HTTP request
   ↓
7. If success (status 200-299): set sent = TRUE
   ↓
8. Email arrives in user's inbox! ✅
```

### Code in send_resend_email_on_insert():

```sql
-- Only send for email channel
if new.channel IS DISTINCT FROM 'email' then
  return new;  -- Skip if not 'email'
end if;

-- ... rest of email sending logic
```

---

## 📝 Current Implementation

### Your Code Creates These Notifications:

| Event               | Channel | Sends Email? | File                      |
| ------------------- | ------- | ------------ | ------------------------- |
| New breeding record | `email` | ✅ Yes       | `lib/actions/breeding.ts` |
| Mark as pregnant    | `email` | ✅ Yes       | `lib/actions/breeding.ts` |
| Record calving      | `email` | ✅ Yes       | `lib/actions/calvings.ts` |

All are using **`channel = 'email'`** so they all trigger email sending! ✅

---

## 🔍 Checking Notifications by Channel

### See all email notifications:

```sql
SELECT
  id,
  title,
  scheduled_for,
  sent,
  (SELECT email FROM auth.users WHERE id = notifications.user_id) as recipient
FROM notifications
WHERE channel = 'email'
ORDER BY created_at DESC;
```

### See all in-app notifications:

```sql
SELECT
  id,
  title,
  scheduled_for,
  read,
  sent
FROM notifications
WHERE channel = 'in_app'
ORDER BY created_at DESC;
```

### Count by channel:

```sql
SELECT
  channel,
  COUNT(*) as total,
  SUM(CASE WHEN sent THEN 1 ELSE 0 END) as sent_count,
  SUM(CASE WHEN NOT sent THEN 1 ELSE 0 END) as pending_count
FROM notifications
GROUP BY channel;
```

---

## 🎯 Best Practices

### Use `email` channel for:

- ✅ Time-sensitive reminders (PD checks, calvings)
- ✅ Critical alerts (health issues, heat detection)
- ✅ Scheduled farm tasks
- ✅ Overdue actions

### Use `in_app` channel for (future):

- ✅ Activity logs ("Record created", "Animal updated")
- ✅ Status changes ("Animal moved to pregnant status")
- ✅ Non-urgent updates
- ✅ System notifications

---

## 🚀 Future: Building In-App Notifications

If you want to add an in-app notification panel:

### 1. Create API Endpoint

**File:** `app/api/notifications/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("channel", "in_app")
    .eq("read", false)
    .order("scheduled_for", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### 2. Add Notification Bell Component

**File:** `components/notification-bell.tsx`

```typescript
"use client";

import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.length));
  }, []);

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Button>
  );
}
```

### 3. Add to Header

Import and use `<NotificationBell />` in your layout/header.

---

## 📊 Database Schema Reference

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',  -- 'email', 'in_app', 'sms', 'push'
  sent BOOLEAN NOT NULL DEFAULT FALSE,     -- For email: was it sent successfully?
  read BOOLEAN NOT NULL DEFAULT FALSE,     -- For in_app: has user seen it?
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Field Usage by Channel:

| Field           | `email`     | `in_app`        | `sms`         | `push`    |
| --------------- | ----------- | --------------- | ------------- | --------- |
| `sent`          | ✅ Used     | ❌ Always false | 🚧 Future     | 🚧 Future |
| `read`          | ❌ N/A      | ✅ Used         | ❌ N/A        | ✅ Future |
| `body`          | ✅ HTML     | ✅ Text/HTML    | ✅ Plain text | ✅ Text   |
| `metadata.from` | ✅ Required | ❌ N/A          | ❌ N/A        | ❌ N/A    |

---

## 🐛 Troubleshooting

### Problem: Set channel to 'email' but no email sent

**Check 1:** Is the trigger working?

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_send_resend_email_after_insert';
```

**Check 2:** Look at the notification record

```sql
SELECT * FROM notifications WHERE id = <your_notification_id>;
```

If `sent = FALSE`, the email failed. Check Resend logs.

### Problem: Want to send email immediately, not scheduled

Set `scheduled_for = NOW()`:

```sql
INSERT INTO notifications (..., scheduled_for, ...)
VALUES (..., NOW(), ...);  -- Sends immediately
```

### Problem: Notification created but trigger didn't fire

The trigger only fires on **INSERT**, not UPDATE. If you update an existing notification, it won't re-send.

---

## 📚 Summary

- **`channel = 'email'`** → Sends actual emails ✅
- **`channel = 'in_app'`** → Stores in DB only, no email ❌
- Your current setup uses **`email`** for all farm reminders ✅
- Trigger `trg_send_resend_email_after_insert` handles email sending automatically ✅
- Future: Build in-app notification panel for `in_app` channel 🚧

---

**Last Updated:** January 2025  
**System:** Notification Channels v1.0
