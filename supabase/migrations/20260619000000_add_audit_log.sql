-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add audit_log table
--
-- This is a developer-only, immutable audit trail.
-- No UPDATE or DELETE policies are granted — rows are permanent.
-- Only INSERT (by authenticated users) and SELECT are allowed.
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop if partially created (safe — no data yet)
DROP TABLE IF EXISTS public.audit_log;

CREATE TABLE public.audit_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who performed the action
  user_id       UUID        REFERENCES auth.users(id),
  user_name     TEXT,
  user_email    TEXT,
  -- What section of the app was used
  module        TEXT        NOT NULL CHECK (module IN (
                  'pacientes', 'cobrancas', 'contas', 'transacoes', 'admin', 'sistema'
                )),
  -- CRUD action
  action        TEXT        NOT NULL CHECK (action IN (
                  'criar', 'editar', 'excluir', 'pagar', 'pagamento_parcial',
                  'reverter_pagamento', 'ativar', 'desativar', 'login', 'logout'
                )),
  -- Human-readable description of what happened
  description   TEXT        NOT NULL,
  -- Optional: name of the patient/product/entity involved
  entity_name   TEXT,
  -- Optional: ID of the record that was affected
  entity_id     TEXT,
  -- Timestamp (server-side, cannot be faked by client)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx  ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx     ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_module_idx      ON public.audit_log(module);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ── SELECT: all authenticated users can read (shared clinic model) ────────────
CREATE POLICY "Authenticated users can read audit_log"
ON public.audit_log FOR SELECT
TO authenticated
USING (true);

-- ── INSERT: authenticated users can insert their own rows ─────────────────────
CREATE POLICY "Authenticated users can insert audit_log"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ── NO UPDATE policy ──────────────────────────────────────────────────────────
-- ── NO DELETE policy ──────────────────────────────────────────────────────────
-- Rows are permanent. Only a superuser/service_role can remove them.
