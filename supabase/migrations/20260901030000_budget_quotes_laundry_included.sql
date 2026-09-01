-- Migration: budget_quotes gains a laundry inclusion toggle.
-- When enabled, laundry (+R$ 200,00/mês) is billed together with the monthly fee
-- and listed as included; otherwise it is listed as billed separately.

ALTER TABLE public.budget_quotes
  ADD COLUMN laundry_included BOOLEAN NOT NULL DEFAULT false;
