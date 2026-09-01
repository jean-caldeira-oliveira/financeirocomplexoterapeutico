-- Migration: budget_quotes now always carries prices for all three room types
-- (Coletivo, Semi-Privativo, Privativo) instead of a single selected room_type,
-- so every generated quote/PDF shows all three modalities.

ALTER TABLE public.budget_quotes
  ADD COLUMN coletivo_enrollment_fee NUMERIC(12,2),
  ADD COLUMN coletivo_monthly_fee NUMERIC(12,2),
  ADD COLUMN semi_privativo_enrollment_fee NUMERIC(12,2),
  ADD COLUMN semi_privativo_monthly_fee NUMERIC(12,2),
  ADD COLUMN privativo_enrollment_fee NUMERIC(12,2),
  ADD COLUMN privativo_monthly_fee NUMERIC(12,2);

-- Backfill existing rows: put the previously-selected room's values into its
-- matching new column so historical quotes keep at least that data.
UPDATE public.budget_quotes
SET coletivo_enrollment_fee = CASE WHEN room_type = 'coletivo' THEN enrollment_fee END,
    coletivo_monthly_fee = CASE WHEN room_type = 'coletivo' THEN monthly_fee END,
    semi_privativo_enrollment_fee = CASE WHEN room_type = 'semi_privativo' THEN enrollment_fee END,
    semi_privativo_monthly_fee = CASE WHEN room_type = 'semi_privativo' THEN monthly_fee END,
    privativo_enrollment_fee = CASE WHEN room_type = 'privativo' THEN enrollment_fee END,
    privativo_monthly_fee = CASE WHEN room_type = 'privativo' THEN monthly_fee END;

ALTER TABLE public.budget_quotes
  ALTER COLUMN coletivo_enrollment_fee SET DEFAULT 0,
  ALTER COLUMN coletivo_monthly_fee SET DEFAULT 0,
  ALTER COLUMN semi_privativo_enrollment_fee SET DEFAULT 0,
  ALTER COLUMN semi_privativo_monthly_fee SET DEFAULT 0,
  ALTER COLUMN privativo_enrollment_fee SET DEFAULT 0,
  ALTER COLUMN privativo_monthly_fee SET DEFAULT 0;

UPDATE public.budget_quotes SET
  coletivo_enrollment_fee = COALESCE(coletivo_enrollment_fee, 0),
  coletivo_monthly_fee = COALESCE(coletivo_monthly_fee, 0),
  semi_privativo_enrollment_fee = COALESCE(semi_privativo_enrollment_fee, 0),
  semi_privativo_monthly_fee = COALESCE(semi_privativo_monthly_fee, 0),
  privativo_enrollment_fee = COALESCE(privativo_enrollment_fee, 0),
  privativo_monthly_fee = COALESCE(privativo_monthly_fee, 0);

ALTER TABLE public.budget_quotes
  ALTER COLUMN coletivo_enrollment_fee SET NOT NULL,
  ALTER COLUMN coletivo_monthly_fee SET NOT NULL,
  ALTER COLUMN semi_privativo_enrollment_fee SET NOT NULL,
  ALTER COLUMN semi_privativo_monthly_fee SET NOT NULL,
  ALTER COLUMN privativo_enrollment_fee SET NOT NULL,
  ALTER COLUMN privativo_monthly_fee SET NOT NULL;

ALTER TABLE public.budget_quotes
  DROP COLUMN room_type,
  DROP COLUMN enrollment_fee,
  DROP COLUMN monthly_fee;
