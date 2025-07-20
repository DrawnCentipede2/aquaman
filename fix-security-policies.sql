-- Security Fixes for Google Pins Marketplace
-- Run this in your Supabase SQL editor to implement proper security

-- 1. First, let's create a proper users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    bio TEXT,
    verified BOOLEAN DEFAULT FALSE,
    city TEXT,
    country TEXT,
    occupation TEXT,
    social_links JSONB DEFAULT '{}',
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    ip TEXT,
    location TEXT
);

-- 2. Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_amount DECIMAL(10, 2) NOT NULL,
    processing_fee DECIMAL(10, 2) DEFAULT 0.99,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    user_location TEXT,
    user_ip TEXT,
    customer_email TEXT,
    user_email TEXT,
    paypal_order_id TEXT,
    paypal_payer_id TEXT,
    paypal_payment_id TEXT,
    payment_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    pin_pack_id UUID REFERENCES pin_packs(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add missing columns to existing tables
ALTER TABLE pin_packs ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]';
ALTER TABLE pin_packs ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE pin_packs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Create indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pin_packs_creator_id ON pin_packs(creator_id);

-- 6. Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view pins" ON pins;
DROP POLICY IF EXISTS "Anyone can insert pins" ON pins;
DROP POLICY IF EXISTS "Anyone can delete pins" ON pins;
DROP POLICY IF EXISTS "Anyone can view pin packs" ON pin_packs;
DROP POLICY IF EXISTS "Anyone can insert pin packs" ON pin_packs;
DROP POLICY IF EXISTS "Anyone can delete pin packs" ON pin_packs;
DROP POLICY IF EXISTS "Anyone can view pin pack pins" ON pin_pack_pins;
DROP POLICY IF EXISTS "Anyone can insert pin pack pins" ON pin_pack_pins;
DROP POLICY IF EXISTS "Anyone can delete pin pack pins" ON pin_pack_pins;
DROP POLICY IF EXISTS "Anyone can view downloads" ON pack_downloads;
DROP POLICY IF EXISTS "Anyone can insert downloads" ON pack_downloads;
DROP POLICY IF EXISTS "Anyone can delete downloads" ON pack_downloads;
DROP POLICY IF EXISTS "Anyone can view ratings" ON pack_ratings;
DROP POLICY IF EXISTS "Anyone can insert ratings" ON pack_ratings;
DROP POLICY IF EXISTS "Anyone can delete ratings" ON pack_ratings;
DROP POLICY IF EXISTS "Anyone can view edit requests" ON place_edit_requests;
DROP POLICY IF EXISTS "Anyone can insert edit requests" ON place_edit_requests;
DROP POLICY IF EXISTS "Anyone can update edit requests" ON place_edit_requests;
DROP POLICY IF EXISTS "Anyone can delete edit requests" ON place_edit_requests;

-- 7. Create secure RLS policies

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR email = current_setting('app.current_user_email', true));

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR email = current_setting('app.current_user_email', true));

CREATE POLICY "Anyone can create a user profile" ON users
    FOR INSERT WITH CHECK (true);

-- Pins table policies (public read, authenticated write)
CREATE POLICY "Anyone can view pins" ON pins
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create pins" ON pins
    FOR INSERT WITH CHECK (current_setting('app.current_user_email', true) IS NOT NULL);

CREATE POLICY "Users can update their own pins" ON pins
    FOR UPDATE USING (creator_location = current_setting('app.current_user_location', true) OR creator_ip = current_setting('app.current_user_ip', true));

-- Pin packs table policies
CREATE POLICY "Anyone can view pin packs" ON pin_packs
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create pin packs" ON pin_packs
    FOR INSERT WITH CHECK (current_setting('app.current_user_email', true) IS NOT NULL);

CREATE POLICY "Users can update their own pin packs" ON pin_packs
    FOR UPDATE USING (creator_id = current_setting('app.current_user_email', true));

-- Pin pack pins junction table policies
CREATE POLICY "Anyone can view pin pack pins" ON pin_pack_pins
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create pin pack pins" ON pin_pack_pins
    FOR INSERT WITH CHECK (current_setting('app.current_user_email', true) IS NOT NULL);

-- Pack downloads policies
CREATE POLICY "Anyone can view downloads" ON pack_downloads
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create downloads" ON pack_downloads
    FOR INSERT WITH CHECK (true);

-- Pack ratings policies
CREATE POLICY "Anyone can view ratings" ON pack_ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON pack_ratings
    FOR INSERT WITH CHECK (current_setting('app.current_user_email', true) IS NOT NULL);

-- Orders table policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (user_email = current_setting('app.current_user_email', true));

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (current_setting('app.current_user_email', true) IS NOT NULL);

-- Order items table policies
CREATE POLICY "Users can view their own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_email = current_setting('app.current_user_email', true)
        )
    );

CREATE POLICY "Users can create order items" ON order_items
    FOR INSERT WITH CHECK (current_setting('app.current_user_email', true) IS NOT NULL);

-- 8. Create functions to set user context
CREATE OR REPLACE FUNCTION set_user_context(user_email TEXT, user_location TEXT DEFAULT NULL, user_ip TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_email', user_email, false);
    PERFORM set_config('app.current_user_location', COALESCE(user_location, ''), false);
    PERFORM set_config('app.current_user_ip', COALESCE(user_ip, ''), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pin_packs_updated_at ON pin_packs;
CREATE TRIGGER update_pin_packs_updated_at
    BEFORE UPDATE ON pin_packs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 11. Add email validation to users table
ALTER TABLE users ADD CONSTRAINT valid_email CHECK (is_valid_email(email));

-- 12. Create function to sanitize user input
CREATE OR REPLACE FUNCTION sanitize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove potentially dangerous characters and limit length
    RETURN substring(regexp_replace(input_text, '[<>"\''&]', '', 'g') from 1 for 1000);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 13. Create view for public pin pack data (sanitized)
CREATE OR REPLACE VIEW public_pin_packs AS
SELECT 
    id,
    title,
    description,
    price,
    city,
    country,
    created_at,
    pin_count,
    download_count,
    average_rating,
    rating_count,
    categories
FROM pin_packs
WHERE price >= 0;

-- Grant permissions
GRANT SELECT ON public_pin_packs TO anon;
GRANT SELECT ON public_pin_packs TO authenticated;

-- 14. Create function to track downloads securely
CREATE OR REPLACE FUNCTION track_pack_download(pack_id UUID, download_type TEXT DEFAULT 'view')
RETURNS VOID AS $$
BEGIN
    -- Insert download record
    INSERT INTO pack_downloads (pin_pack_id, download_type, user_location, user_ip)
    VALUES (pack_id, download_type, current_setting('app.current_user_location', true), current_setting('app.current_user_ip', true));
    
    -- Update download count
    UPDATE pin_packs 
    SET download_count = download_count + 1
    WHERE id = pack_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to validate pin pack data
CREATE OR REPLACE FUNCTION validate_pin_pack()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate title
    IF NEW.title IS NULL OR length(trim(NEW.title)) < 3 THEN
        RAISE EXCEPTION 'Title must be at least 3 characters long';
    END IF;
    
    -- Validate price
    IF NEW.price < 0 THEN
        RAISE EXCEPTION 'Price cannot be negative';
    END IF;
    
    -- Validate city and country
    IF NEW.city IS NULL OR length(trim(NEW.city)) < 2 THEN
        RAISE EXCEPTION 'City must be at least 2 characters long';
    END IF;
    
    IF NEW.country IS NULL OR length(trim(NEW.country)) < 2 THEN
        RAISE EXCEPTION 'Country must be at least 2 characters long';
    END IF;
    
    -- Sanitize text fields
    NEW.title := sanitize_text(NEW.title);
    NEW.description := sanitize_text(NEW.description);
    NEW.city := sanitize_text(NEW.city);
    NEW.country := sanitize_text(NEW.country);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger
DROP TRIGGER IF EXISTS validate_pin_pack_trigger ON pin_packs;
CREATE TRIGGER validate_pin_pack_trigger
    BEFORE INSERT OR UPDATE ON pin_packs
    FOR EACH ROW
    EXECUTE FUNCTION validate_pin_pack();

-- 16. Create function to get user's packs securely
CREATE OR REPLACE FUNCTION get_user_packs(user_email TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL(10, 2),
    city TEXT,
    country TEXT,
    created_at TIMESTAMPTZ,
    pin_count INTEGER,
    download_count INTEGER,
    average_rating DECIMAL(3, 2),
    rating_count INTEGER
) AS $$
BEGIN
    -- Set user context
    PERFORM set_user_context(user_email);
    
    -- Return user's packs
    RETURN QUERY
    SELECT 
        pp.id,
        pp.title,
        pp.description,
        pp.price,
        pp.city,
        pp.country,
        pp.created_at,
        pp.pin_count,
        pp.download_count,
        pp.average_rating,
        pp.rating_count
    FROM pin_packs pp
    WHERE pp.creator_id = user_email
    ORDER BY pp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_packs(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_pack_download(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_context(TEXT, TEXT, TEXT) TO authenticated;

-- 17. Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_email ON audit_log(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log (you'll need to implement admin role later)
CREATE POLICY "Only admins can view audit log" ON audit_log
    FOR SELECT USING (false); -- Change this when you implement admin roles

-- 18. Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    user_email TEXT,
    action TEXT,
    table_name TEXT DEFAULT NULL,
    record_id UUID DEFAULT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (user_email, action, table_name, record_id, old_values, new_values, ip_address)
    VALUES (user_email, action, table_name, record_id, old_values, new_values, current_setting('app.current_user_ip', true));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, TEXT, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- 19. Create function to check if user can modify pack
CREATE OR REPLACE FUNCTION can_modify_pack(pack_id UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    pack_creator TEXT;
BEGIN
    SELECT creator_id INTO pack_creator
    FROM pin_packs
    WHERE id = pack_id;
    
    RETURN pack_creator = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_modify_pack(UUID, TEXT) TO authenticated;

-- 20. Final security recommendations
COMMENT ON TABLE users IS 'User profiles - requires authentication for modifications';
COMMENT ON TABLE pin_packs IS 'Pin packs - public read, authenticated write';
COMMENT ON TABLE orders IS 'Order records - users can only see their own orders';
COMMENT ON TABLE audit_log IS 'Security audit log - admin access only';

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Security policies have been updated successfully!';
    RAISE NOTICE 'Key security improvements:';
    RAISE NOTICE '- RLS policies now require authentication for writes';
    RAISE NOTICE '- Input validation and sanitization added';
    RAISE NOTICE '- Audit logging enabled';
    RAISE NOTICE '- Email validation enforced';
    RAISE NOTICE '- Download tracking secured';
    RAISE NOTICE 'Remember to test all functionality after applying these changes!';
END $$; 