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
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Add constraint for rating validation
ALTER TABLE pins 
ADD CONSTRAINT IF NOT EXISTS valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Create additional indexes for new fields
CREATE INDEX IF NOT EXISTS idx_pins_city_country ON pins(city, country);
CREATE INDEX IF NOT EXISTS idx_pins_rating ON pins(rating);
CREATE INDEX IF NOT EXISTS idx_pins_business_status ON pins(business_status);
CREATE INDEX IF NOT EXISTS idx_pins_place_id ON pins(place_id);
CREATE INDEX IF NOT EXISTS idx_pins_photos ON pins USING GIN (photos);

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
COMMENT ON COLUMN pins.photos IS 'Array of base64 encoded image strings uploaded by users';

-- Migration: Add Orders Table for PayPal Integration
-- Run this in your Supabase SQL editor after the main schema

-- Table to store order information
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Order details
    total_amount DECIMAL(10, 2) NOT NULL,
    processing_fee DECIMAL(10, 2) DEFAULT 0.99,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    
    -- PayPal specific fields
    paypal_order_id TEXT, -- PayPal's order ID
    paypal_payer_id TEXT, -- PayPal's payer ID
    paypal_payment_id TEXT, -- PayPal's payment ID
    
    -- Customer info (from PayPal)
    customer_email TEXT,
    customer_name TEXT,
    
    -- Order metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    user_ip TEXT,
    user_location TEXT,
    
    CONSTRAINT positive_amount CHECK (total_amount > 0)
);

-- Table to store order items (which pin packs were purchased)
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    pin_pack_id UUID NOT NULL REFERENCES pin_packs(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL, -- Price at time of purchase
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_price CHECK (price >= 0)
);

-- Enable RLS on new tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders (anyone can insert, only order owner can view)
CREATE POLICY "Anyone can create orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update orders" ON orders
    FOR UPDATE USING (true);

-- Create policies for order items
CREATE POLICY "Anyone can create order items" ON order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view order items" ON order_items
    FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_paypal_order_id ON orders(paypal_order_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_pin_pack_id ON order_items(pin_pack_id);

-- Create a view for easy order querying with items
CREATE VIEW order_details AS
SELECT 
    o.id,
    o.total_amount,
    o.processing_fee,
    o.currency,
    o.status,
    o.paypal_order_id,
    o.customer_email,
    o.customer_name,
    o.created_at,
    o.completed_at,
    COUNT(oi.id) as item_count,
    ARRAY_AGG(pp.title) as pack_titles
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN pin_packs pp ON oi.pin_pack_id = pp.id
GROUP BY o.id, o.total_amount, o.processing_fee, o.currency, o.status, 
         o.paypal_order_id, o.customer_email, o.customer_name, 
         o.created_at, o.completed_at;

-- Function to increment download count for a pin pack
CREATE OR REPLACE FUNCTION increment_download_count(pack_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE pin_packs 
    SET download_count = download_count + 1 
    WHERE id = pack_id;
    
    -- Also insert a download record for tracking
    INSERT INTO pack_downloads (pin_pack_id, download_type) 
    VALUES (pack_id, 'purchase');
END;
$$ LANGUAGE plpgsql; 