/*
  # Add Update Equipment Quantity Function

  1. Changes
    - Add function to update equipment quantity
    - Add trigger to automatically update equipment quantity on stock movement
*/

-- Create function to update equipment quantity
CREATE OR REPLACE FUNCTION update_equipment_quantity(
  p_equipment_id UUID,
  p_quantity_change INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE equipment
  SET 
    quantity = quantity + p_quantity_change,
    updated_at = NOW()
  WHERE id = p_equipment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to handle stock movements
CREATE OR REPLACE FUNCTION handle_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- For new movements
    IF NEW.type = 'in' THEN
      PERFORM update_equipment_quantity(NEW.equipment_id, NEW.quantity);
    ELSE
      PERFORM update_equipment_quantity(NEW.equipment_id, -NEW.quantity);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the movement when deleted
    IF OLD.type = 'in' THEN
      PERFORM update_equipment_quantity(OLD.equipment_id, -OLD.quantity);
    ELSE
      PERFORM update_equipment_quantity(OLD.equipment_id, OLD.quantity);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on stock_movements
DROP TRIGGER IF EXISTS handle_stock_movement_trigger ON stock_movements;
CREATE TRIGGER handle_stock_movement_trigger
AFTER INSERT OR DELETE ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION handle_stock_movement(); 