-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Fix RLS policies to allow all authenticated users to share data
--
-- Problem: Previous policies used `user_id = auth.uid()` which isolated each
-- user's data. In a clinic context, all authenticated users must see and manage
-- the same shared data (patients, invoices, transactions, bills, etc.).
--
-- Solution: Replace per-user isolation policies with "all authenticated users"
-- policies. The user_id column is kept for audit purposes (who created the record).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── patients ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own patients" ON public.patients;

CREATE POLICY "Authenticated users can read all patients"
ON public.patients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients"
ON public.patients FOR DELETE
TO authenticated
USING (true);

-- ─── transactions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;

CREATE POLICY "Authenticated users can read all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (true);

-- ─── bills ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own bills" ON public.bills;

CREATE POLICY "Authenticated users can read all bills"
ON public.bills FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert bills"
ON public.bills FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update bills"
ON public.bills FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bills"
ON public.bills FOR DELETE
TO authenticated
USING (true);

-- ─── invoices ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own invoices" ON public.invoices;

CREATE POLICY "Authenticated users can read all invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (true);

-- ─── invoice_payments ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own invoice payments" ON public.invoice_payments;

CREATE POLICY "Authenticated users can read all invoice payments"
ON public.invoice_payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert invoice payments"
ON public.invoice_payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update invoice payments"
ON public.invoice_payments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoice payments"
ON public.invoice_payments FOR DELETE
TO authenticated
USING (true);

-- ─── referral_sources ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own referral sources" ON public.referral_sources;

CREATE POLICY "Authenticated users can read all referral sources"
ON public.referral_sources FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert referral sources"
ON public.referral_sources FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update referral sources"
ON public.referral_sources FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete referral sources"
ON public.referral_sources FOR DELETE
TO authenticated
USING (true);

-- ─── custom_categories ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own custom categories" ON public.custom_categories;

CREATE POLICY "Authenticated users can read all custom categories"
ON public.custom_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert custom categories"
ON public.custom_categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update custom categories"
ON public.custom_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete custom categories"
ON public.custom_categories FOR DELETE
TO authenticated
USING (true);
