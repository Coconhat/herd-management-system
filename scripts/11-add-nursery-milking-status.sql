-- Migration: Add N/A option for milking_status (for nursery/young animals)
-- Young animals (≤13 months) shouldn't have a milking status

-- Update the milking_status constraint to allow 'N/A'
ALTER TABLE animals DROP CONSTRAINT IF EXISTS animals_milking_status_check;
ALTER TABLE animals ADD CONSTRAINT animals_milking_status_check 
  CHECK (milking_status IN ('Milking', 'Dry', 'N/A'));

-- Optionally update existing young animals to have N/A milking status
-- This sets milking_status to 'N/A' for animals born less than 13 months ago
UPDATE animals 
SET milking_status = 'N/A'
WHERE birth_date IS NOT NULL 
  AND birth_date > CURRENT_DATE - INTERVAL '13 months'
  AND sex = 'Female';
