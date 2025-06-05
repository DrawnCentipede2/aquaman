-- Google Pins Marketplace Database Schema
-- Run this in your Supabase SQL editor to create the required tables

-- Enable RLS (Row Level Security) - Supabase recommendation
-- For MVP, we'll keep it simple without complex policies

-- Table to store individual pins
CREATE TABLE pins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    google_maps_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    latitude DECIMAL(10, 8) NOT NULL DEFAULT 0,
    longitude DECIMAL(11, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    creator_location TEXT,
    creator_ip TEXT,
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Table to store pin packs (collections of pins)
CREATE TABLE pin_packs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    creator_location TEXT,
    pin_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT positive_price CHECK (price >= 0)
);

-- Junction table to link pins to pin packs (many-to-many relationship)
CREATE TABLE pin_pack_pins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_pack_id UUID NOT NULL REFERENCES pin_packs(id) ON DELETE CASCADE,
    pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pin_pack_id, pin_id)
);

-- Create indexes for better performance
CREATE INDEX idx_pins_category ON pins(category);
CREATE INDEX idx_pins_created_at ON pins(created_at);
CREATE INDEX idx_pin_packs_city_country ON pin_packs(city, country);
CREATE INDEX idx_pin_packs_created_at ON pin_packs(created_at);
CREATE INDEX idx_pin_pack_pins_pack_id ON pin_pack_pins(pin_pack_id);
CREATE INDEX idx_pin_pack_pins_pin_id ON pin_pack_pins(pin_id);

-- Enable RLS on all tables (required by Supabase)
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_pack_pins ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for MVP (anyone can read/write)
-- In production, you'd want more restrictive policies

-- Pins policies
CREATE POLICY "Anyone can view pins" ON pins
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pins" ON pins
    FOR INSERT WITH CHECK (true);

-- Pin packs policies
CREATE POLICY "Anyone can view pin packs" ON pin_packs
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pin packs" ON pin_packs
    FOR INSERT WITH CHECK (true);

-- Pin pack pins policies
CREATE POLICY "Anyone can view pin pack pins" ON pin_pack_pins
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pin pack pins" ON pin_pack_pins
    FOR INSERT WITH CHECK (true);

-- Optional: Create a view for easier querying of complete pin packs
CREATE VIEW pin_pack_details AS
SELECT 
    pp.id,
    pp.title,
    pp.description,
    pp.price,
    pp.city,
    pp.country,
    pp.created_at,
    pp.creator_location,
    COUNT(ppp.pin_id) as actual_pin_count
FROM pin_packs pp
LEFT JOIN pin_pack_pins ppp ON pp.id = ppp.pin_pack_id
GROUP BY pp.id, pp.title, pp.description, pp.price, pp.city, pp.country, pp.created_at, pp.creator_location;

-- Insert some sample data for testing (optional)
-- You can uncomment these after creating the tables

/*
-- Sample pin pack
INSERT INTO pin_packs (title, description, price, city, country, creator_location, pin_count) VALUES
('Best Coffee Shops in Barcelona', 'My favorite local coffee spots that tourists never find', 0.00, 'Barcelona', 'Spain', 'Barcelona, Spain', 3);

-- Get the ID of the pack we just created (replace with actual ID from above)
-- INSERT INTO pins (title, description, google_maps_url, category, latitude, longitude, creator_location) VALUES
-- ('Café Central', 'Amazing cortado and local atmosphere', 'https://maps.google.com/?q=Café+Central+Barcelona', 'cafe', 41.3851, 2.1734, 'Barcelona, Spain'),
-- ('Hidden Gems Coffee', 'Best kept secret in Gràcia neighborhood', 'https://maps.google.com/?q=Hidden+Gems+Coffee+Barcelona', 'cafe', 41.4036, 2.1588, 'Barcelona, Spain'),
-- ('Roastery Local', 'They roast their own beans daily', 'https://maps.google.com/?q=Roastery+Local+Barcelona', 'cafe', 41.3888, 2.1590, 'Barcelona, Spain');

-- Link pins to pack (you'll need to replace the UUIDs with actual ones)
-- INSERT INTO pin_pack_pins (pin_pack_id, pin_id) VALUES 
-- ('your-pack-id', 'your-pin-id-1'),
-- ('your-pack-id', 'your-pin-id-2'),
-- ('your-pack-id', 'your-pin-id-3');
*/ 