-- Migration: Add maps_list_reference column to pin_packs table
-- Run this in your Supabase SQL Editor

-- Add the maps_list_reference column to store Google Maps list URLs as JSON
ALTER TABLE pin_packs 
ADD COLUMN maps_list_reference JSONB NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN pin_packs.maps_list_reference IS 'Stores Google Maps list reference as JSON with original_url, expanded_url, and title';

-- Create an index for better performance when querying packs with maps list references
CREATE INDEX idx_pin_packs_maps_list_reference ON pin_packs USING GIN (maps_list_reference);

-- Optional: Add a check constraint to ensure valid JSON structure (commented out for flexibility)
-- ALTER TABLE pin_packs 
-- ADD CONSTRAINT valid_maps_list_reference 
-- CHECK (
--   maps_list_reference IS NULL OR 
--   (maps_list_reference ? 'original_url' AND 
--    maps_list_reference ? 'expanded_url' AND 
--    maps_list_reference ? 'title')
-- );

-- Migration completed successfully
-- The maps_list_reference column can store JSON like:
-- {
--   "original_url": "https://maps.app.goo.gl/abc123",
--   "expanded_url": "https://www.google.com/maps/...",
--   "title": "Google Maps List"
-- } 