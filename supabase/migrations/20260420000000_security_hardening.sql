-- ═══════════════════════════════════════════════════════════════════════════
-- Migration de Segurança: Audit Log + Hardening de RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Tabela de Audit Log ───────────────────────────────────────────────
-- Registra todas as operações sensíveis (INSERT, UPDATE, DELETE) nas tabelas
-- principais. Útil para rastreabilidade e detecção de acessos indevidos.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name  TEXT        NOT NULL,
  operation   TEXT        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apenas admins podem ler o audit log; ninguém pode inserir/alterar diretamente
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Nenhum usuário pode inserir/alterar/deletar diretamente (apenas via trigger)
CREATE POLICY "No direct writes to audit log"
ON public.audit_log
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- ─── 2. Função de Audit ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name,
    operation,
    user_id,
    record_id,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── 3. Triggers de Audit nas tabelas sensíveis ───────────────────────────

-- Pacientes
CREATE TRIGGER audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Faturas
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Pagamentos de faturas
CREATE TRIGGER audit_invoice_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Transações financeiras
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Contas a pagar
CREATE TRIGGER audit_bills
  AFTER INSERT OR UPDATE OR DELETE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Roles de usuário (crítico: qualquer alteração de permissão é registrada)
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─── 4. Índices para performance do audit log ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id    ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);

-- ─── 5. Política de retenção: deletar logs com mais de 1 ano ─────────────
-- (Executar manualmente ou via pg_cron se disponível no plano Supabase)
-- DELETE FROM public.audit_log WHERE created_at < now() - INTERVAL '1 year';

-- ─── 6. Hardening adicional de RLS ───────────────────────────────────────
-- Garantir que user_id nunca pode ser alterado pelo próprio usuário
-- (proteção contra privilege escalation via UPDATE)

-- Bloquear alteração de user_id em patients
CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Alteração de user_id não é permitida';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_user_id_change_patients
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER prevent_user_id_change_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER prevent_user_id_change_bills
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER prevent_user_id_change_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER prevent_user_id_change_invoice_payments
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();
