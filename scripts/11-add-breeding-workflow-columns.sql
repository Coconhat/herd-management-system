-- Add workflow columns to breeding_records table for PD tracking and post-treatment visibility
-- Run this migration if the Treatment button disappears after navigating away

-- Add pd_result column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breeding_records' AND column_name = 'pd_result') THEN
        ALTER TABLE breeding_records ADD COLUMN pd_result VARCHAR(20) DEFAULT 'Unchecked' 
            CHECK (pd_result IN ('Pregnant', 'Empty', 'Unchecked'));
    END IF;
END $$;

-- Add heat_check_date column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breeding_records' AND column_name = 'heat_check_date') THEN
        ALTER TABLE breeding_records ADD COLUMN heat_check_date DATE;
    END IF;
END $$;

-- Add pregnancy_check_due_date column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breeding_records' AND column_name = 'pregnancy_check_due_date') THEN
        ALTER TABLE breeding_records ADD COLUMN pregnancy_check_due_date DATE;
    END IF;
END $$;

-- Add post_pd_treatment_due_date column if not exists (critical for Treatment button visibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breeding_records' AND column_name = 'post_pd_treatment_due_date') THEN
        ALTER TABLE breeding_records ADD COLUMN post_pd_treatment_due_date DATE;
    END IF;
END $$;

-- Add keep_in_breeding_until column if not exists (keeps record visible in breeding history)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'breeding_records' AND column_name = 'keep_in_breeding_until') THEN
        ALTER TABLE breeding_records ADD COLUMN keep_in_breeding_until DATE;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_breeding_records_pd_result ON breeding_records(pd_result);
CREATE INDEX IF NOT EXISTS idx_breeding_records_post_pd_due ON breeding_records(post_pd_treatment_due_date);
