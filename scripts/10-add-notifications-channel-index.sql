-- Add missing channel index to notifications table
-- This improves query performance when filtering by channel type

CREATE INDEX IF NOT EXISTS idx_notifications_channel 
  ON public.notifications USING btree (channel) 
  TABLESPACE pg_default;

-- Verify the index was created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
ORDER BY indexname;
