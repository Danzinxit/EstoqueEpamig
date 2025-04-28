/*
  # Enable RLS and Add Auth Policies

  1. Security Changes
    - Enable RLS on stock_movements table
    - Enable RLS on users table
    - Add policies for stock_movements table
    - Add policies for users table
    
  2. Notes
    - Ensures proper authentication flow
    - Maintains data security
    - Allows authenticated users to access their data
*/

-- Enable RLS on tables
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for stock_movements
CREATE POLICY "Admin can manage stock movements"
ON stock_movements
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view stock movements"
ON stock_movements
FOR SELECT
TO authenticated
USING (true);

-- Policies for users table
CREATE POLICY "Admin can manage users"
ON users
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());