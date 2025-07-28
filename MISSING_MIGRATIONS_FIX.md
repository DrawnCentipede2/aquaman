# Missing Database Migrations Fix

## Problem
The pack detail page is not showing reviews and creator information because several database migrations haven't been applied to your Supabase database.

## Required Migrations

### 1. Add Reviews Column to Pin Packs
Run this in your Supabase SQL Editor:

```sql
-- Migration to add reviews field to pin_packs table
-- This will store aggregated reviews from all pins in the pack for better performance

-- Add reviews column to pin_packs table
ALTER TABLE pin_packs 
ADD COLUMN reviews JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_pin_packs_reviews ON pin_packs USING GIN (reviews);

-- Add column to track when reviews were last updated
ALTER TABLE pin_packs 
ADD COLUMN reviews_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for reviews update tracking
CREATE INDEX idx_pin_packs_reviews_updated ON pin_packs (reviews_updated_at);

-- Add comment explaining the reviews field structure
COMMENT ON COLUMN pin_packs.reviews IS 'JSONB array of reviews from Google Maps and local experience. Structure: [{"id": "string", "user_name": "string", "user_avatar": "string", "rating": number, "comment": "string", "date": "string", "verified": boolean, "source": "string", "place_name": "string", "profile_photo_url": "string"}]';

COMMENT ON COLUMN pin_packs.reviews_updated_at IS 'Timestamp when reviews were last fetched from Google Maps API';
```

### 2. Create Users Table
Run this in your Supabase SQL Editor:

```sql
-- Create users table for PinCloud / Pinpacks accounts
-- Run this migration in Supabase SQL editor or via CLI

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  location text,
  ip text,
  created_at timestamptz default now(),
  last_login timestamptz
);

-- Helpful index for quick lookup
create index if not exists idx_users_email on users(email);

comment on table users is 'Stores basic user profile data for PinCloud accounts';
```

### 3. Enhance Users Table with Profile Fields
Run this in your Supabase SQL Editor:

```sql
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
```

## How to Apply These Migrations

1. **Go to your Supabase Dashboard**
2. **Navigate to the SQL Editor**
3. **Run each migration in order** (1, 2, 3)
4. **Check that the tables and columns were created successfully**

## Verification

After running the migrations, you can verify they worked by:

1. **Check the `pin_packs` table** - it should now have a `reviews` column
2. **Check that the `users` table exists** with all the profile fields
3. **Test the pack detail page** - reviews and creator information should now load

## Expected Result

After applying these migrations:
- ✅ Reviews will load from the `reviews` column in `pin_packs`
- ✅ Creator profiles will load from the `users` table
- ✅ Fallback reviews will be generated if no reviews exist
- ✅ Creator information will show properly in the pack detail page

## Troubleshooting

If you still see issues after running the migrations:

1. **Check the browser console** for any error messages
2. **Verify the migrations ran successfully** in Supabase
3. **Clear your browser cache** and reload the page
4. **Check that the `usePackDetails` hook is receiving the data** (look for the 🔍 console logs)

## Next Steps

Once the migrations are applied:
1. The pack detail page should work properly
2. Reviews will be fetched and displayed
3. Creator profiles will load correctly
4. Performance optimizations will work as expected 