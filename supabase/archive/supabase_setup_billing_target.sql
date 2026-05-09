-- Add billing_target to textbook_order_items table
ALTER TABLE textbook_order_items ADD COLUMN IF NOT EXISTS billing_target text;
