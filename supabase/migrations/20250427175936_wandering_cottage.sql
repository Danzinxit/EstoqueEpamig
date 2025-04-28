/*
  # Remove conflicting users table

  1. Changes
    - Drop the custom users table as it conflicts with Supabase Auth
    - We'll use the built-in auth.users table with the profiles table instead

  Note: This is safe because:
    - The profiles table is already properly linked to auth.users
    - No data loss will occur as auth is handled by Supabase Auth
*/

DROP TABLE IF EXISTS public.users;