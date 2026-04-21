ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS fine_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_period_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_method text NOT NULL DEFAULT '';