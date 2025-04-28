/*
  # Create admin user

  1. Changes
    - Insert admin user for Daniel with email daniel@epamig.br
    - Set up proper profile with admin role
*/

-- Create the user in auth.users
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
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
    'daniel@epamig.br',
    crypt('epamig2025', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

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