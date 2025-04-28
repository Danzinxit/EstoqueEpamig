/*
  # Create admin user

  1. Changes
    - Insert admin user for Daniel with email daniel@epamig.br
    - Set up proper profile with admin role
*/

-- Create the user in auth.users
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'daniel@epamig.br',
    crypt('epamig2025', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  );

  -- Create the profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    'daniel@epamig.br',
    'Daniel',
    'admin',
    now(),
    now()
  );
END $$;