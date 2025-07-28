-- Migration: Add updated_at column to orders table
-- This fixes the error: 'record "new" has no field "updated_at"'

-- Add updated_at column to orders table
ALTER TABLE orders 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set existing records to have updated_at same as created_at initially
UPDATE orders 
SET updated_at = created_at
WHERE updated_at IS NULL;

-- The trigger for automatically updating updated_at is already created in fix-security-policies.sql
-- This migration just adds the missing column that the trigger expects

-- Add index for better performance on updated_at queries
CREATE INDEX idx_orders_updated_at ON orders(updated_at);

-- Add comment explaining the column
COMMENT ON COLUMN orders.updated_at IS 'Timestamp when the order record was last updated'; 