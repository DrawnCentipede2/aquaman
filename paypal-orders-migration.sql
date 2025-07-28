-- PayPal Orders Migration
-- Run this AFTER running supabase-schema.sql
-- This adds only the PayPal order functionality

-- Table to store order information
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
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
DO $$ 
BEGIN
    -- Create orders policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Anyone can create orders'
    ) THEN
        CREATE POLICY "Anyone can create orders" ON orders
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Anyone can view orders'
    ) THEN
        CREATE POLICY "Anyone can view orders" ON orders
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Anyone can update orders'
    ) THEN
        CREATE POLICY "Anyone can update orders" ON orders
            FOR UPDATE USING (true);
    END IF;
    
    -- Create order items policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' AND policyname = 'Anyone can create order items'
    ) THEN
        CREATE POLICY "Anyone can create order items" ON order_items
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' AND policyname = 'Anyone can view order items'
    ) THEN
        CREATE POLICY "Anyone can view order items" ON order_items
            FOR SELECT USING (true);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_pin_pack_id ON order_items(pin_pack_id);

-- Create a view for easy order querying with items
CREATE OR REPLACE VIEW order_details AS
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

-- Add photos column to pins table if it doesn't exist
DO $$ 
BEGIN
    -- Check if photos column doesn't exist, then add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pins' AND column_name = 'photos'
    ) THEN
        ALTER TABLE pins 
        ADD COLUMN photos JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add GIN index for photos if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pins_photos ON pins USING GIN (photos);

COMMENT ON TABLE orders IS 'Stores PayPal order information for pin pack purchases';
COMMENT ON TABLE order_items IS 'Stores individual items (pin packs) within each order';
COMMENT ON COLUMN pins.photos IS 'Array of base64 encoded image strings uploaded by users'; 