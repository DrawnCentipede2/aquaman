-- Add user_email column to orders table
-- This migration adds a separate column for the PinCloud user email
-- while keeping the PayPal customer_email for payment verification

-- Add user_email column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);

-- Add comment for documentation
COMMENT ON COLUMN orders.user_email IS 'PinCloud user email (separate from PayPal customer_email)';

-- Drop the existing view first to avoid column name conflicts
DROP VIEW IF EXISTS order_details;

-- Recreate the order_details view to include user_email
CREATE VIEW order_details AS
SELECT 
    o.id,
    o.total_amount,
    o.processing_fee,
    o.currency,
    o.status,
    o.paypal_order_id,
    o.customer_email,
    o.user_email,
    o.customer_name,
    o.created_at,
    o.completed_at,
    COUNT(oi.id) as item_count,
    ARRAY_AGG(pp.title) as pack_titles
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN pin_packs pp ON oi.pin_pack_id = pp.id
GROUP BY o.id, o.total_amount, o.processing_fee, o.currency, o.status, 
         o.paypal_order_id, o.customer_email, o.user_email, o.customer_name, 
         o.created_at, o.completed_at; 