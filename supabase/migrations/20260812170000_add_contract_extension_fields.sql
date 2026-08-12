-- Add contract extension tracking fields to patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS original_installments integer,
  ADD COLUMN IF NOT EXISTS extension_months integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN patients.original_installments IS 'Number of installments at contract creation (before any extensions)';
COMMENT ON COLUMN patients.extension_months IS 'Total months added via contract extensions (accumulated)';
