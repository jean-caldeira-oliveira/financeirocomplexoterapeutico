-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Seed inicial do Plano de Contas (chart_of_accounts)
--
-- A tabela chart_of_accounts foi criada vazia em 20260901040000 para não
-- arriscar migrar as categorias de bills.category/subcategory sem validação
-- prévia. Porém, "Conta Padrão" é campo OBRIGATÓRIO no cadastro de
-- Fornecedor e de Funcionário — sem nenhuma conta cadastrada, é impossível
-- concluir um cadastro.
--
-- Esta migration popula um conjunto mínimo de contas:
--   1. As 15 subcategorias de despesa já usadas hoje em bills (grupos
--      CV/CF/IMP/PROL/BC, definidos em src/types/transaction.ts), para que
--      o Plano de Contas comece alinhado ao que já existe na prática.
--   2. As contas específicas que a especificação
--      (Especificacao_Cadastro_Fornecedor_Funcionario.xlsx) cita como
--      exemplo para Funcionário: Pró-labore, Honorários, Equipe Técnica
--      Clínica (CLT).
--
-- Isso NÃO migra os lançamentos (bills) existentes para apontar para estas
-- contas — bills.category/subcategory continuam como estão. É só o
-- catálogo de contas disponível para novos cadastros de fornecedor/
-- funcionário. A migração de bills antigos fica para decisão futura.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.chart_of_accounts (code, name) VALUES
  -- CV - Custo Variável
  ('CV-001', 'Materiais'),
  ('CV-002', 'Manutenção'),
  ('CV-003', 'Marketing'),
  ('CV-004', 'Outros Custos Variáveis'),
  -- CF - Custo Fixo
  ('CF-001', 'Aluguel'),
  ('CF-002', 'Água'),
  ('CF-003', 'Energia'),
  ('CF-004', 'Internet/Telefone'),
  ('CF-005', 'Contabilidade'),
  ('CF-006', 'Outros Custos Fixos'),
  -- IMP - Impostos
  ('IMP-001', 'Impostos'),
  ('IMP-002', 'Taxas'),
  -- PROL - Pró-labore / Folha
  ('PROL-001', 'Pró-labore Sócios'),
  ('PROL-002', 'Folha de Pagamento'),
  -- BC - Banco
  ('BC-001', 'Tarifas Bancárias'),
  ('BC-002', 'Juros'),
  ('BC-003', 'Empréstimos'),
  -- Contas citadas na especificação para o cadastro de Funcionário
  ('PROL-003', 'Pró-labore'),
  ('SERV-001', 'Honorários'),
  ('SERV-002', 'Equipe Técnica Clínica (CLT)')
ON CONFLICT (code) DO NOTHING;
