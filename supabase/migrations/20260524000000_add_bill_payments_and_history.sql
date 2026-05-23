-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add bill_payments and bill_history tables
--
-- Changes:
--   1. Update bills.status constraint to accept 'partially_paid'
--   2. Create bill_payments table (partial payment tracking)
--   3. Create bill_history table (audit log)
--   4. Enable RLS on both new tables with shared-clinic policies
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Update bills status constraint ───────────────────────────────────────
-- Drop existing check constraint if any (Supabase may have named it differently)
DO $$
BEGIN
  -- Try to drop the old constraint; ignore if it doesn't exist
  ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_status_check;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add updated constraint that includes 'partially_paid'
ALTER TABLE public.bills
  ADD CONSTRAINT bills_status_check
  CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid'));

-- ─── 2. Create bill_payments table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id        UUID        NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES auth.users(id),
  amount         NUMERIC     NOT NULL CHECK (amount > 0),
  payment_date   TIMESTAMPTZ NOT NULL,
  payment_method TEXT        NOT NULL CHECK (payment_method IN ('pix', 'dinheiro', 'cartao', 'transferencia', 'boleto')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by bill
CREATE INDEX IF NOT EXISTS bill_payments_bill_id_idx ON public.bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS bill_payments_user_id_idx ON public.bill_payments(user_id);

-- ─── 3. Create bill_history table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bill_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id     UUID        NOT NULL,  -- logical link (no FK so history survives bill deletion)
  user_id     UUID        REFERENCES auth.users(id),
  user_name   TEXT,
  action      TEXT        NOT NULL CHECK (action IN (
                'create', 'edit', 'partial_payment', 'full_payment',
                'revert_payment', 'delete', 'status_change'
              )),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by bill
CREATE INDEX IF NOT EXISTS bill_history_bill_id_idx ON public.bill_history(bill_id);
CREATE INDEX IF NOT EXISTS bill_history_created_at_idx ON public.bill_history(created_at DESC);

-- ─── 4. Enable RLS on new tables ─────────────────────────────────────────────
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_history  ENABLE ROW LEVEL SECURITY;

-- ─── 5. RLS Policies for bill_payments (shared clinic model) ─────────────────
-- All authenticated users can read all bill_payments (shared clinic data)
CREATE POLICY "Authenticated users can read all bill_payments"
ON public.bill_payments FOR SELECT
TO authenticated
USING (true);

-- Only the inserting user can insert (user_id must match)
CREATE POLICY "Authenticated users can insert bill_payments"
ON public.bill_payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Any authenticated user can update (shared clinic model)
CREATE POLICY "Authenticated users can update bill_payments"
ON public.bill_payments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Any authenticated user can delete (shared clinic model)
CREATE POLICY "Authenticated users can delete bill_payments"
ON public.bill_payments FOR DELETE
TO authenticated
USING (true);

-- ─── 6. RLS Policies for bill_history (shared clinic model) ──────────────────
-- All authenticated users can read all history
CREATE POLICY "Authenticated users can read all bill_history"
ON public.bill_history FOR SELECT
TO authenticated
USING (true);

-- Only the inserting user can insert
CREATE POLICY "Authenticated users can insert bill_history"
ON public.bill_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- History is immutable: no UPDATE or DELETE policies (audit trail)
