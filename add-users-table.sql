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