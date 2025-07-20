-- Migration: Add DELETE policies for all tables
-- This fixes the 400 Bad Request error when trying to delete pin packs

-- Add DELETE policies for pins table
CREATE POLICY "Anyone can delete pins" ON pins
    FOR DELETE USING (true);

-- Add DELETE policies for pin_packs table
CREATE POLICY "Anyone can delete pin packs" ON pin_packs
    FOR DELETE USING (true);

-- Add DELETE policies for pin_pack_pins table
CREATE POLICY "Anyone can delete pin pack pins" ON pin_pack_pins
    FOR DELETE USING (true);

-- Add DELETE policies for pack_downloads table
CREATE POLICY "Anyone can delete downloads" ON pack_downloads
    FOR DELETE USING (true);

-- Add DELETE policies for pack_ratings table
CREATE POLICY "Anyone can delete ratings" ON pack_ratings
    FOR DELETE USING (true);

-- Add DELETE policies for place_edit_requests table
CREATE POLICY "Anyone can delete edit requests" ON place_edit_requests
    FOR DELETE USING (true);

-- Add UPDATE policies for pin_packs table (for editing)
CREATE POLICY "Anyone can update pin packs" ON pin_packs
    FOR UPDATE USING (true);

-- Add UPDATE policies for pins table (for editing)
CREATE POLICY "Anyone can update pins" ON pins
    FOR UPDATE USING (true); 