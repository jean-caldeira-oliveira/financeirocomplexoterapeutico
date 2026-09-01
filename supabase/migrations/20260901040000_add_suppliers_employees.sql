-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Cadastro de Fornecedor e Funcionário/Colaborador
--
-- Baseado em Especificacao_Cadastro_Fornecedor_Funcionario.xlsx
--
-- Cria:
--   1. cost_centers        (Centro de Custo — lista editável)
--   2. chart_of_accounts   (Plano de Contas — estrutura pronta, seed fica
--                           para uma migração futura, após validar com o
--                           usuário a migração das categorias já em uso)
--   3. suppliers            (Fornecedores)
--   4. employees             (Funcionários/Colaboradores)
--
-- Regras de negócio implementadas via trigger (ver planilha, aba
-- "Regras de Relacionamento"):
--   - Não permitir hard delete de cost_centers/chart_of_accounts quando há
--     fornecedor/colaborador ativo vinculado.
--   - Não permitir hard delete de suppliers/employees quando há lançamento
--     (bills) vinculado — deve inativar em vez de excluir.
--
-- Modelo de RLS: "clínica compartilhada" (igual bill_payments/bill_history) —
-- qualquer usuário autenticado lê e escreve.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. cost_centers (Centro de Custo) ───────────────────────────────────────
CREATE TABLE public.cost_centers (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  status     TEXT        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cost_centers"
ON public.cost_centers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cost_centers"
ON public.cost_centers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update cost_centers"
ON public.cost_centers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cost_centers"
ON public.cost_centers FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed com os 6 centros de custo fixos definidos na especificação
INSERT INTO public.cost_centers (name) VALUES
  ('Administrativo'),
  ('Assistencial'),
  ('Financeiro'),
  ('Comercial'),
  ('Diretoria'),
  ('Impostos');

-- ─── 2. chart_of_accounts (Plano de Contas) ──────────────────────────────────
-- Estrutura pronta. O conteúdo (migração das categorias/subcategorias já
-- usadas em bills.category/subcategory) fica para uma migração futura,
-- para não arriscar quebrar lançamentos/relatórios existentes sem validação.
CREATE TABLE public.chart_of_accounts (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code       TEXT        NOT NULL UNIQUE,
  name       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chart_of_accounts"
ON public.chart_of_accounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert chart_of_accounts"
ON public.chart_of_accounts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update chart_of_accounts"
ON public.chart_of_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete chart_of_accounts"
ON public.chart_of_accounts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 3. suppliers (Fornecedores) ─────────────────────────────────────────────
CREATE SEQUENCE public.suppliers_code_seq START 1;

CREATE TABLE public.suppliers (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code                  TEXT        NOT NULL UNIQUE DEFAULT ('FOR-' || lpad(nextval('public.suppliers_code_seq')::text, 4, '0')),
  person_type           TEXT        NOT NULL CHECK (person_type IN ('PF', 'PJ')),
  legal_name            TEXT        NOT NULL,
  trade_name            TEXT,
  document               TEXT        NOT NULL UNIQUE, -- CPF (11) ou CNPJ (14), somente dígitos
  phone                 TEXT,
  email                 TEXT,
  address               TEXT,
  bank_info             TEXT,
  pix_key               TEXT,
  default_account_id    UUID        NOT NULL REFERENCES public.chart_of_accounts(id),
  default_cost_center_id UUID       NOT NULL REFERENCES public.cost_centers(id),
  status                TEXT        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_document_format CHECK (
    (person_type = 'PF' AND length(document) = 11) OR
    (person_type = 'PJ' AND length(document) = 14)
  )
);

ALTER SEQUENCE public.suppliers_code_seq OWNED BY public.suppliers.id;

CREATE INDEX suppliers_status_idx ON public.suppliers(status);
CREATE INDEX suppliers_default_account_id_idx ON public.suppliers(default_account_id);
CREATE INDEX suppliers_default_cost_center_id_idx ON public.suppliers(default_cost_center_id);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read suppliers"
ON public.suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suppliers"
ON public.suppliers FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 4. employees (Funcionários/Colaboradores) ───────────────────────────────
CREATE SEQUENCE public.employees_code_seq START 1;

CREATE TABLE public.employees (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code                   TEXT        NOT NULL UNIQUE DEFAULT ('COL-' || lpad(nextval('public.employees_code_seq')::text, 4, '0')),
  full_name              TEXT        NOT NULL,
  document               TEXT        NOT NULL UNIQUE CHECK (length(document) = 11), -- CPF, somente dígitos
  employment_type        TEXT        NOT NULL CHECK (employment_type IN ('CLT', 'PJ', 'Estagiário', 'Diretoria')),
  role_title             TEXT        NOT NULL,
  cost_center_id         UUID        NOT NULL REFERENCES public.cost_centers(id),
  default_account_id     UUID        NOT NULL REFERENCES public.chart_of_accounts(id),
  admission_date         DATE        NOT NULL,
  termination_date       DATE,
  status                 TEXT        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'desligado')),
  payment_method         TEXT        CHECK (payment_method IN ('transferencia', 'pix', 'boleto')),
  bank_info_or_pix_key   TEXT,
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employees_termination_requires_status CHECK (
    termination_date IS NULL OR status = 'desligado'
  )
);

ALTER SEQUENCE public.employees_code_seq OWNED BY public.employees.id;

CREATE INDEX employees_status_idx ON public.employees(status);
CREATE INDEX employees_cost_center_id_idx ON public.employees(cost_center_id);
CREATE INDEX employees_default_account_id_idx ON public.employees(default_account_id);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employees"
ON public.employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert employees"
ON public.employees FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
ON public.employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees"
ON public.employees FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 5. Vínculo com bills (lançamentos) ──────────────────────────────────────
-- Nullable: um lançamento pode não estar vinculado a nenhum cadastro.
-- category/subcategory continuam sendo gravados no bill (snapshot histórico) —
-- eles são pré-preenchidos a partir do cadastro no momento do lançamento, mas
-- uma edição posterior do cadastro NÃO deve alterar lançamentos já criados
-- (Regra de Relacionamento nº 1 da especificação).
ALTER TABLE public.bills
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id),
  ADD COLUMN employee_id UUID REFERENCES public.employees(id),
  ADD CONSTRAINT bills_supplier_or_employee_exclusive CHECK (
    supplier_id IS NULL OR employee_id IS NULL
  );

CREATE INDEX bills_supplier_id_idx ON public.bills(supplier_id);
CREATE INDEX bills_employee_id_idx ON public.bills(employee_id);

-- ─── 6. Proteção contra exclusão física quando há vínculo ativo ─────────────
-- Regras de Relacionamento nº 2 e 3: só permite hard delete de
-- supplier/employee se não houver NENHUM bill vinculado (histórico incluso).
CREATE OR REPLACE FUNCTION public.prevent_delete_supplier_with_bills()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bills WHERE supplier_id = OLD.id) THEN
    RAISE EXCEPTION 'Não é possível excluir o fornecedor "%": existem lançamentos vinculados. Inative o cadastro em vez de excluí-lo.', OLD.legal_name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_delete_supplier_with_bills
  BEFORE DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_supplier_with_bills();

CREATE OR REPLACE FUNCTION public.prevent_delete_employee_with_bills()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bills WHERE employee_id = OLD.id) THEN
    RAISE EXCEPTION 'Não é possível excluir o colaborador "%": existem lançamentos vinculados. Inative o cadastro em vez de excluí-lo.', OLD.full_name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_delete_employee_with_bills
  BEFORE DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_employee_with_bills();

-- Regra de Relacionamento nº 6: não permitir excluir uma conta do Plano de
-- Contas ou um Centro de Custo enquanto houver fornecedor/colaborador ATIVO
-- vinculado (como conta/centro padrão).
CREATE OR REPLACE FUNCTION public.prevent_delete_account_with_active_links()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.suppliers WHERE default_account_id = OLD.id AND status = 'ativo'
    UNION ALL
    SELECT 1 FROM public.employees WHERE default_account_id = OLD.id AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir a conta "%": há fornecedores/colaboradores ativos vinculados. Inative a conta em vez de excluí-la.', OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_delete_account_with_active_links
  BEFORE DELETE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_account_with_active_links();

CREATE OR REPLACE FUNCTION public.prevent_delete_cost_center_with_active_links()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.suppliers WHERE default_cost_center_id = OLD.id AND status = 'ativo'
    UNION ALL
    SELECT 1 FROM public.employees WHERE cost_center_id = OLD.id AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir o centro de custo "%": há fornecedores/colaboradores ativos vinculados. Inative o centro de custo em vez de excluí-lo.', OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_delete_cost_center_with_active_links
  BEFORE DELETE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_cost_center_with_active_links();
