-- Create notifications table for email reminders
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_animal_id ON notifications(animal_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "notifications_select_own" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" 
  ON notifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" 
  ON notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to send email immediately after insert
DROP TRIGGER IF EXISTS send_email_on_notification_insert ON notifications;
CREATE TRIGGER send_email_on_notification_insert
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_resend_email_on_insert();

-- Comment for documentation
COMMENT ON TABLE notifications IS 'Stores notifications/reminders for users. Emails are sent automatically via Resend when scheduled_for is reached.';
COMMENT ON COLUMN notifications.channel IS 'Notification channel (email, sms, push). Only "email" is supported currently.';
COMMENT ON COLUMN notifications.sent IS 'Whether the email was successfully sent via Resend API';
COMMENT ON COLUMN notifications.scheduled_for IS 'When to send this notification (can be NOW() for immediate or future date for scheduled)';
COMMENT ON COLUMN notifications.metadata IS 'Extra data like "from" email address override';
