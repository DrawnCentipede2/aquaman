-- Migration: Enhance users table with comprehensive profile fields
-- Run this in your Supabase SQL Editor after the basic users table exists

-- First, ensure the basic users table exists (this is safe to run multiple times)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  location TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Add new profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT, -- URL or base64 string
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[], -- Array of languages spoken
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_method TEXT, -- 'email', 'phone', 'identity', etc.
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS social_links JSONB, -- Store social media links as JSON
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public', -- 'public', 'limited', 'private'
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active', -- 'active', 'suspended', 'deleted'
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_country_city ON users(country, city);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add helpful comments
COMMENT ON TABLE users IS 'Enhanced user profiles for PinCloud creators and buyers';
COMMENT ON COLUMN users.bio IS 'User bio/description for profile page';
COMMENT ON COLUMN users.verified IS 'Whether user has been verified as a local creator';
COMMENT ON COLUMN users.social_links IS 'JSON object containing social media profile links';
COMMENT ON COLUMN users.profile_visibility IS 'Controls who can see the full profile';

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for user data protection
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

DROP POLICY IF EXISTS "Users can update their own profile" ON users;  
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow public read access to basic creator info (for pack displays)
DROP POLICY IF EXISTS "Public can view basic creator info" ON users;
CREATE POLICY "Public can view basic creator info" ON users
  FOR SELECT USING (
    profile_visibility = 'public' AND 
    account_status = 'active' AND
    verified = true
  );

-- Migration completed successfully
-- The users table now supports comprehensive user profiles with:
-- - Personal information (name, bio, occupation)
-- - Location data (country, city, timezone)
-- - Verification status and methods
-- - Social links and contact info
-- - Privacy controls
-- - Account management fields 