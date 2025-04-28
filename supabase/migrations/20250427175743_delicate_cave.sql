/*
  # Create admin user

  1. Changes
    - Insert admin user for Daniel
    - Email: daniel@epamig.br
    - Password: epamig2025
*/

-- Insert into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'daniel@epamig.br',
  crypt('epamig2025', gen_salt('bf')),
  now(),
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Insert into profiles
INSERT INTO profiles (
  id,
  email,
  full_name,
  role
)
SELECT 
  id,
  email,
  'Daniel',
  'admin'
FROM auth.users
WHERE email = 'daniel@epamig.br'
ON CONFLICT (id) DO NOTHING;