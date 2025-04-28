/*
  # Fix Stock Movements Policies

  1. Changes
    - Add policies for stock_movements table
    - Allow authenticated users to delete their own movements
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can create stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can delete stock movements" ON stock_movements;

-- Create new policies
CREATE POLICY "Users can view stock movements"
ON stock_movements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create stock movements"
ON stock_movements FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can delete stock movements"
ON stock_movements FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on stock_movements if not already enabled
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY; 