-- Add notes fields to bills table
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS payment_notes TEXT;
