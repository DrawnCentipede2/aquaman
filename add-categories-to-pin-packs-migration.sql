-- Migration: Add categories column to pin_packs table
-- This allows storing up to 3 categories per pack for better filtering

-- Add categories column as JSONB array to store multiple categories
ALTER TABLE pin_packs 
ADD COLUMN categories JSONB DEFAULT '[]'::jsonb;

-- Add constraint to ensure maximum 3 categories per pack
ALTER TABLE pin_packs 
ADD CONSTRAINT max_categories CHECK (jsonb_array_length(categories) <= 3);

-- Add index for better performance when filtering by categories
CREATE INDEX idx_pin_packs_categories ON pin_packs USING GIN (categories);

-- Add comment to document the column
COMMENT ON COLUMN pin_packs.categories IS 'Array of up to 3 category strings for filtering packs (e.g., ["Food & Drink", "Nightlife", "Cultural"])';

-- Update existing packs with default categories based on their titles (optional)
-- This helps populate existing data with relevant categories
UPDATE pin_packs 
SET categories = CASE 
    WHEN LOWER(title) LIKE '%coffee%' OR LOWER(title) LIKE '%cafe%' OR LOWER(title) LIKE '%food%' OR LOWER(title) LIKE '%restaurant%' 
    THEN '["Food & Drink"]'::jsonb
    WHEN LOWER(title) LIKE '%night%' OR LOWER(title) LIKE '%bar%' OR LOWER(title) LIKE '%club%' 
    THEN '["Nightlife"]'::jsonb
    WHEN LOWER(title) LIKE '%adventure%' OR LOWER(title) LIKE '%outdoor%' OR LOWER(title) LIKE '%hiking%' 
    THEN '["Adventure"]'::jsonb
    WHEN LOWER(title) LIKE '%family%' OR LOWER(title) LIKE '%kids%' OR LOWER(title) LIKE '%children%' 
    THEN '["Family"]'::jsonb
    WHEN LOWER(title) LIKE '%culture%' OR LOWER(title) LIKE '%museum%' OR LOWER(title) LIKE '%art%' 
    THEN '["Cultural"]'::jsonb
    WHEN LOWER(title) LIKE '%romantic%' OR LOWER(title) LIKE '%Romantic%' OR LOWER(title) LIKE '%date%' 
    THEN '["Romantic"]'::jsonb
    WHEN LOWER(title) LIKE '%business%' OR LOWER(title) LIKE '%work%' OR LOWER(title) LIKE '%office%' 
    THEN '["Business Travel"]'::jsonb
    WHEN LOWER(title) LIKE '%relax%' OR LOWER(title) LIKE '%spa%' OR LOWER(title) LIKE '%wellness%' 
    THEN '["Relaxation"]'::jsonb
    WHEN LOWER(title) LIKE '%solo%' OR LOWER(title) LIKE '%alone%' OR LOWER(title) LIKE '%independent%' 
    THEN '["Solo Travel"]'::jsonb
    WHEN LOWER(title) LIKE '%friend%' OR LOWER(title) LIKE '%group%' OR LOWER(title) LIKE '%party%' 
    THEN '["Friends Group"]'::jsonb
    ELSE '["Cultural"]'::jsonb -- Default category for existing packs
END
WHERE categories = '[]'::jsonb; 