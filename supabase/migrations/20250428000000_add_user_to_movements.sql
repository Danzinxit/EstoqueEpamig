/*
  # Add User to Stock Movements

  1. Changes
    - Add user_id column to stock_movements table
    - Add foreign key constraint to profiles table
    - Update existing records to use current user
*/

-- Add user_id column
ALTER TABLE stock_movements
ADD COLUMN user_id UUID REFERENCES profiles(id);

-- Update existing records to use current user
UPDATE stock_movements
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- Make user_id not null after updating existing records
ALTER TABLE stock_movements
ALTER COLUMN user_id SET NOT NULL;

-- Add policy to ensure users can only see their own movements
CREATE POLICY "Users can view their own movements"
ON stock_movements FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add policy to allow admins to view all movements
CREATE POLICY "Admins can view all movements"
ON stock_movements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 