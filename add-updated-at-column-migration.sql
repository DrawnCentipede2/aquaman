-- Migration: Add updated_at column to pin_packs table
-- Run this in your Supabase SQL editor

-- Add updated_at column to pin_packs table
ALTER TABLE pin_packs 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set existing records to have updated_at same as created_at
UPDATE pin_packs 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to pin_packs table
CREATE TRIGGER update_pin_packs_updated_at 
    BEFORE UPDATE ON pin_packs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Also add an index for better performance
CREATE INDEX idx_pin_packs_updated_at ON pin_packs(updated_at); 