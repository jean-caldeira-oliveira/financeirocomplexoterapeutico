-- Migration: Add contract extension detail fields to patients table
-- These fields store the parameters for a patient's contract extension (aditivo)
-- configured directly in the patient edit form.

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS has_extension boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS extension_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS extension_due_day integer,
  ADD COLUMN IF NOT EXISTS extension_monthly_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS extension_installments integer;

COMMENT ON COLUMN patients.has_extension IS 'Whether this patient has a contract extension (aditivo)';
COMMENT ON COLUMN patients.extension_start_date IS 'Start date of the contract extension period';
COMMENT ON COLUMN patients.extension_due_day IS 'Day of month for extension installment due dates';
COMMENT ON COLUMN patients.extension_monthly_fee IS 'Monthly fee amount for the extension period (may differ from original)';
COMMENT ON COLUMN patients.extension_installments IS 'Number of additional months in the extension';
