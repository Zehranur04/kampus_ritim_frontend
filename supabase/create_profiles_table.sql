-- Create a profiles table linked to auth.users
-- Run this in Supabase SQL editor (Database -> SQL Editor)
-- Create a simple profiles table linked to auth.users
-- This file only creates the table (if it does not exist) and does NOT enable RLS or policies.
-- Run this in Supabase SQL editor (Database -> SQL Editor)

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  full_name text,
  faculty text,
  department text,
  year text,
  avatar_url text,
  created_at timestamptz default now()
);
