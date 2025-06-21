-- Migration to add enhanced place information fields to existing pins table
-- Run this in your Supabase SQL editor AFTER the initial schema has been created

-- Add new columns to pins table
ALTER TABLE pins 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS rating_count INTEGER,
ADD COLUMN IF NOT EXISTS business_status TEXT,
ADD COLUMN IF NOT EXISTS current_opening_hours JSONB,
ADD COLUMN IF NOT EXISTS reviews JSONB,
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS needs_manual_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraint for rating validation
ALTER TABLE pins 
ADD CONSTRAINT IF NOT EXISTS valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Create additional indexes for new fields
CREATE INDEX IF NOT EXISTS idx_pins_city_country ON pins(city, country);
CREATE INDEX IF NOT EXISTS idx_pins_rating ON pins(rating);
CREATE INDEX IF NOT EXISTS idx_pins_business_status ON pins(business_status);
CREATE INDEX IF NOT EXISTS idx_pins_place_id ON pins(place_id);

-- Create place_edit_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS place_edit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
    user_id TEXT,
    field_name TEXT NOT NULL,
    current_value TEXT,
    requested_value TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

-- Enable RLS on place_edit_requests table
ALTER TABLE place_edit_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes for edit requests
CREATE INDEX IF NOT EXISTS idx_edit_requests_pin_id ON place_edit_requests(pin_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_status ON place_edit_requests(status);
CREATE INDEX IF NOT EXISTS idx_edit_requests_created_at ON place_edit_requests(created_at);

-- Create policies for place_edit_requests table
CREATE POLICY IF NOT EXISTS "Anyone can view edit requests" ON place_edit_requests
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert edit requests" ON place_edit_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can update edit requests" ON place_edit_requests
    FOR UPDATE USING (true);

-- Update existing pins table policies to handle new fields (if needed)
-- The existing policies should already cover the new fields since they allow all operations

COMMENT ON TABLE place_edit_requests IS 'Stores user requests to edit place information for admin review';
COMMENT ON COLUMN pins.current_opening_hours IS 'JSON object containing opening hours from Google Places API';
COMMENT ON COLUMN pins.reviews IS 'JSON array containing recent reviews from Google Places API';
COMMENT ON COLUMN pins.business_status IS 'Business operational status: OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY'; 