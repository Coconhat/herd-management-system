# Email Whitelist System Setup

This system implements email whitelisting to restrict account registration to authorized users only.

## 🚀 Quick Setup

### 1. Database Setup

Run the SQL script to create the whitelist table:

```sql
-- Execute this in your Supabase SQL Editor
-- File: scripts/04-add-email-whitelist.sql
```

### 2. Add Initial Admin Email

Update the initial email in the SQL script:

```sql
-- Replace 'farmowner@example.com' with your actual email
INSERT INTO email_whitelist (email, notes, is_active)
VALUES
  ('your-email@example.com', 'Farm Owner - Initial Admin', TRUE)
ON CONFLICT (email) DO NOTHING;
```

### 3. How It Works

#### For Users:

- Only whitelisted emails can create accounts
- Non-whitelisted emails will see: _"This email address is not authorized to create an account. Please contact the farm administrator."_

#### For Administrators:

- Access admin panel at: `/admin/email-whitelist`
- Add/remove emails from whitelist
- View all authorized emails and their status

## 🛠️ Features

### ✅ **Security Features**

- **Email Validation**: Only pre-approved emails can register
- **Case Insensitive**: Emails are normalized (lowercase)
- **Soft Delete**: Emails are deactivated, not deleted (audit trail)
- **Row Level Security**: Database-level access control

### ✅ **Admin Management**

- **Add Emails**: Add new authorized emails with optional notes
- **Remove Emails**: Deactivate emails (prevents new registrations)
- **View Status**: See active/inactive emails with creation dates
- **Notes System**: Track why each email was added

### ✅ **User Experience**

- **Immediate Validation**: Email is checked before attempting registration
- **Clear Messages**: Users get clear feedback about authorization status
- **Secure Process**: No exposure of valid/invalid email lists

## 📋 Usage Instructions

### Adding New Users (Admin):

1. Go to `/admin/email-whitelist`
2. Enter the user's email address
3. Add optional notes (role, department, etc.)
4. Click "Add Email"
5. User can now register with that email

### Removing Users (Admin):

1. Go to `/admin/email-whitelist`
2. Find the email in the list
3. Click the delete button
4. Confirm removal
5. Email is deactivated (user cannot register)

### For New Users:

1. Go to `/auth/sign-up`
2. Enter your email and password
3. If email is whitelisted: Account creation proceeds
4. If not whitelisted: Error message displayed

## 🔧 API Endpoints

### Public Endpoints:

- `POST /api/auth/check-whitelist` - Check if email is whitelisted

### Admin Endpoints:

- `GET /api/admin/whitelist` - Get all whitelisted emails
- `POST /api/admin/whitelist` - Add email to whitelist
- `DELETE /api/admin/whitelist` - Remove email from whitelist

## 🗄️ Database Schema

```sql
CREATE TABLE email_whitelist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

## 🔐 Security Considerations

1. **Admin Access**: Only authenticated users can manage the whitelist
2. **Email Privacy**: No exposure of whitelist to unauthorized users
3. **Audit Trail**: Track who added each email and when
4. **Soft Deletes**: Maintain history of all whitelist changes
5. **Input Validation**: Email format validation and sanitization

## 🎯 Benefits

- **Access Control**: Only authorized personnel can access the system
- **Farm Security**: Prevents random users from creating accounts
- **Easy Management**: Simple admin interface for managing users
- **Scalable**: Can handle multiple farms or organizational units
- **Professional**: Business-appropriate security model

## 📞 Support

If users need access:

1. Contact farm administrator
2. Admin adds email to whitelist via admin panel
3. User can then register normally

The system ensures only authorized farm personnel have access while maintaining ease of use for legitimate users.
