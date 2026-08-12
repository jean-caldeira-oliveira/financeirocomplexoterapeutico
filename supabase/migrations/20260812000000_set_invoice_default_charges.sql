-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Set correct default values for invoice late-payment charges
--
-- Business rules:
--   • Multa de mora : 2% fixo sobre o saldo da parcela (cobrada uma única vez
--                     a partir do 1º dia de atraso)
--   • Juros de mora : 0,033% ao dia em juros compostos
--                     (equivale a ~1% ao mês — limite legal CDC)
--   • Carência      : 0 dias (encargos iniciam no 1º dia de atraso)
--
-- Changes:
--   1. Set column DEFAULT values so new rows inherit the correct rates
--   2. Backfill existing rows that still have NULL or 0 in fine_rate /
--      interest_rate_monthly so they also follow the business rules
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Set column defaults ───────────────────────────────────────────────
ALTER TABLE public.invoices
  ALTER COLUMN fine_rate          SET DEFAULT 2,
  ALTER COLUMN interest_rate_monthly SET DEFAULT 1,
  ALTER COLUMN grace_period_days  SET DEFAULT 0;

-- ─── 2. Backfill existing rows ────────────────────────────────────────────
-- Only update rows that have never had a fine_rate set (NULL or 0)
UPDATE public.invoices
SET fine_rate = 2
WHERE fine_rate IS NULL OR fine_rate = 0;

-- Only update rows that have never had an interest rate set (NULL or 0)
UPDATE public.invoices
SET interest_rate_monthly = 1
WHERE interest_rate_monthly IS NULL OR interest_rate_monthly = 0;

-- Ensure grace_period_days is never NULL
UPDATE public.invoices
SET grace_period_days = 0
WHERE grace_period_days IS NULL;
