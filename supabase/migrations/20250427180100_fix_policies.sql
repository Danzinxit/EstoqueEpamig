/*
  # Fix Recursive Policies

  1. Changes
    - Drop existing policies that are causing recursion
    - Create new non-recursive policies
    - Fix equipment table policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage equipment" ON equipment;
DROP POLICY IF EXISTS "Users can view equipment" ON equipment;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Create new policies for equipment
CREATE POLICY "Authenticated users can view equipment"
ON equipment FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin users can manage equipment"
ON equipment FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Update profiles policies
CREATE POLICY "Admin users can manage profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Function to sync user role to auth.users metadata
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep user role in sync
DROP TRIGGER IF EXISTS sync_user_role_trigger ON profiles;
CREATE TRIGGER sync_user_role_trigger
AFTER INSERT OR UPDATE OF role
ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_role();

-- Sync existing roles
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(profiles.role)
)
FROM profiles
WHERE auth.users.id = profiles.id; 