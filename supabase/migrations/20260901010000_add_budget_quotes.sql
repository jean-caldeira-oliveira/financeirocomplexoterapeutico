-- Migration: Add budget quotes (Orçamento) generated from the Orçamento tab.
-- Each quote is created by an authenticated user and stored for history/reprint.

CREATE TABLE public.budget_quotes (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id),
  user_name             TEXT,
  patient_name          TEXT        NOT NULL,
  patient_document      TEXT,
  patient_birth_date    TEXT,
  guardian_name         TEXT        NOT NULL,
  guardian_document     TEXT,
  guardian_phone        TEXT,
  room_type             TEXT        NOT NULL CHECK (room_type IN (
                          'coletivo', 'semi_privativo', 'privativo'
                        )),
  enrollment_fee        NUMERIC(12,2) NOT NULL,
  monthly_fee           NUMERIC(12,2) NOT NULL,
  psychiatric_followup  BOOLEAN     NOT NULL DEFAULT false,
  period_months         TEXT,
  validity_days         INTEGER     NOT NULL DEFAULT 30,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX budget_quotes_user_id_idx ON public.budget_quotes(user_id);
CREATE INDEX budget_quotes_created_at_idx ON public.budget_quotes(created_at);

ALTER TABLE public.budget_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read budget_quotes"
ON public.budget_quotes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert budget_quotes"
ON public.budget_quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete budget_quotes"
ON public.budget_quotes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
