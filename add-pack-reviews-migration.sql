-- Migration to add reviews field to pin_packs table
-- This will store aggregated reviews from all pins in the pack for better performance

-- Add reviews column to pin_packs table
ALTER TABLE pin_packs 
ADD COLUMN reviews JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_pin_packs_reviews ON pin_packs USING GIN (reviews);

-- Add column to track when reviews were last updated
ALTER TABLE pin_packs 
ADD COLUMN reviews_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for reviews update tracking
CREATE INDEX idx_pin_packs_reviews_updated ON pin_packs (reviews_updated_at);

-- Add comment explaining the reviews field structure
COMMENT ON COLUMN pin_packs.reviews IS 'JSONB array of reviews from Google Maps and local experience. Structure: [{"id": "string", "user_name": "string", "user_avatar": "string", "rating": number, "comment": "string", "date": "string", "verified": boolean, "source": "string", "place_name": "string", "profile_photo_url": "string"}]';

COMMENT ON COLUMN pin_packs.reviews_updated_at IS 'Timestamp when reviews were last fetched from Google Maps API'; 