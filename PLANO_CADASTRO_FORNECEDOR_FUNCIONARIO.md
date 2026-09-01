# Plano de Ação — Cadastro de Fornecedor e Funcionário/Colaborador

Baseado em: `Especificacao_Cadastro_Fornecedor_Funcionario.xlsx` (abas: Cadastro - Fornecedor,
Cadastro - Funcionário, Regras de Relacionamento, Legenda).

## 1. O que a especificação pede (resumo)

### 1.1 Cadastro de Fornecedor
| Campo | Obrigatório | Observação |
|---|---|---|
| Código do Fornecedor | Sim | Sequencial automático, gerado pelo sistema, não editável |
| Tipo de Pessoa (PF/PJ) | Sim | Define máscara de CPF/CNPJ e campos seguintes |
| Razão Social / Nome | Sim | até 150 caracteres |
| Nome Fantasia | Não | até 100 caracteres |
| CPF / CNPJ | Sim | 11 ou 14 dígitos, validar dígito verificador, sem duplicidade |
| Telefone | Não | (DD) 00000-0000 |
| E-mail | Não | formato válido |
| Endereço | Não | rua, nº, bairro, cidade, UF, CEP |
| Banco / Agência / Conta | Não | lista FEBRABAN ou texto livre |
| Chave PIX | Não | CPF/CNPJ, e-mail, telefone ou aleatória |
| Conta Padrão (Plano de Contas) | Sim | lista relacionada — pré-preenche lançamento, sobrescrevível |
| Centro de Custo Padrão | Sim | Administrativo/Assistencial/Financeiro/Comercial/Diretoria/Impostos |
| Status | Sim | Ativo/Inativo — checar regras antes de excluir |
| Data de Cadastro | Sim | automática |
| Observações | Não | texto livre |

### 1.2 Cadastro de Funcionário/Colaborador
| Campo | Obrigatório | Observação |
|---|---|---|
| Código do Colaborador | Sim | Sequencial automático, não editável |
| Nome Completo | Sim | até 150 caracteres |
| CPF | Sim | 11 dígitos, validar DV, sem duplicidade |
| Tipo de Vínculo | Sim | CLT/PJ/Estagiário/Diretoria — impacta Conta Padrão sugerida |
| Cargo / Função | Sim | até 100 caracteres |
| Centro de Custo | Sim | mesma lista do fornecedor |
| Conta Padrão (Plano de Contas) | Sim | ex.: Pró-labore, Honorários, Equipe Técnica Clínica (CLT) |
| Data de Admissão | Sim | data |
| Data de Desligamento | Não | só preenchida quando Status = Desligado |
| Status | Sim | Ativo/Inativo/Desligado |
| Forma de Pagamento | Não | Transferência/PIX/Boleto |
| Banco/Agência/Conta ou Chave PIX | Não | texto |
| Observações | Não | texto livre |

### 1.3 Regras de Relacionamento (integridade histórica)
1. **Editar cadastro já usado em lançamentos** → alteração vale só daí para frente; lançamentos passados mantêm nome/conta/centro de custo históricos congelados.
2. **Excluir fornecedor/colaborador COM lançamentos vinculados** → proibido hard delete; apenas inativar (Status = Inativo). Some das listas de novos lançamentos, mas continua disponível para consulta/relatórios.
3. **Excluir fornecedor/colaborador SEM lançamentos vinculados** → hard delete permitido.
4. **Alterar Conta Padrão do cadastro** → não retroage; só vale como novo padrão dali em diante.
5. **Um cadastro atende mais de um Centro de Custo** → o cadastro tem um padrão, mas cada lançamento pode sobrescrever.
6. **Excluir conta do Plano de Contas vinculada a fornecedores/colaboradores** → proibido enquanto houver vínculo ativo; sistema deve sugerir inativar.
7. **Buscar cadastro ao lançar despesa** → pré-preencher Centro de Custo e Conta Padrão, mantendo editável no lançamento.

### 1.4 Observação da própria planilha
> "Próximo passo: Validar esta especificação com o Jean para confirmar o que já existe hoje, o que precisa de ajuste e o que é novo desenvolvimento."

## 2. O que já existe hoje no sistema (levantamento no código)

- Rotas `/fornecedores` e `/colaboradores` já existem em [App.tsx](src/App.tsx), mas apontam para `UnderConstruction` — são placeholders vazios.
- **Não existe** tabela de Fornecedor, Funcionário, Plano de Contas nem Centro de Custo no banco (`supabase/migrations/`).
- **Não existe** conceito formal de "Plano de Contas" — o que existe hoje é categoria/subcategoria de despesa em `bills.category` / `bills.subcategory` (texto livre), com uma lista base hardcoded em [transaction.ts](src/types/transaction.ts) + customizações do usuário na tabela `custom_categories` (via [useCustomCategories.ts](src/hooks/useCustomCategories.ts) e `ManageCategoriesDialog`).
- **Não existe** Centro de Custo em lugar nenhum do código atual.
- Existe um padrão de "lista relacionada simples" já implementado: `referral_sources` (fonte de indicação de paciente) — tabela `id/name`, hook `useReferralSources`, dialog de gestão. É o modelo mais próximo para listas auxiliares (ex.: Centro de Custo), mas Fornecedor/Funcionário são entidades ricas — devem seguir o padrão completo de `patients` (tipo + hook + form + tabela + página).
- Modelo de dados do projeto é "clínica compartilhada": RLS libera leitura/escrita para qualquer usuário `authenticated`, sem coluna `user_id` restritiva nas tabelas mais novas (ver `bill_payments`, `bill_history`). Deve manter esse padrão para as novas tabelas.
- Já existe padrão de auditoria (`bill_history` + `writeAuditLog` em [auditLog.ts](src/utils/auditLog.ts)) que serve de modelo para o "congelamento histórico" exigido na regra 1.

## 3. Decisões de modelagem antes de codar

Estas decisões impactam o schema e precisam ser confirmadas com você antes da Etapa 1:

1. **Plano de Contas** é hoje só texto (`category`/`subcategory` em `bills`). A especificação trata "Conta Padrão (Plano de Contas)" como algo com **código** e vínculo real (lista relacionada), não texto livre. Proposta: criar tabela `chart_of_accounts` (plano de contas) formal, e migrar `bills.category`/`subcategory` para referenciar essa tabela por FK, preservando os valores atuais como seed inicial. Isso é o maior risco/esforço do projeto — é uma migração de dado existente, não só feature nova.
2. **Centro de Custo**: a especificação já traz os 6 valores fixos (Administrativo/Assistencial/Financeiro/Comercial/Diretoria/Impostos). Pode ser um `ENUM` simples no banco (mais barato) ou uma tabela `cost_centers` editável (mais flexível, permite adicionar novos centros sem migration). Recomendo tabela, para consistência com o padrão "lista relacionada" e para não travar o cliente numa lista fixa.
3. **"Congelar" dados no lançamento**: para cumprir a regra 1 (edição não retroage), `bills` precisa passar a gravar uma cópia (snapshot) do nome do fornecedor/colaborador, conta e centro de custo no momento do lançamento — além do FK para o cadastro. Ou seja, `bills` ganha colunas novas: `supplier_id` / `employee_id` (FK, nullable) e mantém `category`/`subcategory`/`cost_center` como estão hoje mas agora *pré-preenchidos* a partir do cadastro (continuam sendo a "fonte da verdade histórica" do lançamento).
4. **Exclusão lógica**: `status` já cobre Ativo/Inativo/Desligado — a trava de exclusão física (regra 2) precisa de uma verificação de "existe algum `bills` com este `supplier_id`/`employee_id`?" antes de permitir DELETE, tanto no hook quanto (idealmente) via constraint/trigger no banco para não depender só do frontend.
5. **Escopo do MVP**: a especificação define os cadastros e as regras, mas não define ainda a tela de "lançar despesa vinculada a fornecedor/colaborador" em detalhe. Vou tratar isso como parte do escopo (Etapa 4) porque é onde as regras 5 e 7 se aplicam, mas convém confirmar prioridade.

## 4. Plano de implementação por etapas

### Etapa 0 — Validação (você)
- Confirmar as decisões da seção 3 (principalmente 1 e 2: Plano de Contas e Centro de Custo como tabelas formais).
- Confirmar se "Código do Fornecedor" / "Código do Colaborador" pode ser um contador simples (`SERIAL`/sequência por tabela) exibido tipo `FOR-0001` / `COL-0001`, ou se há um formato específico esperado.

### Etapa 1 — Banco de dados (migrations)
1. `chart_of_accounts` (Plano de Contas): `id`, `code`, `name`, `type` (despesa/receita, se aplicável), `status` (ativo/inativo), timestamps. Seed com as categorias/subcategorias atuais de `expenseCategoryGroups`/`expenseCategoryLabels` para não perder o que já existe.
2. `cost_centers` (Centro de Custo): `id`, `name`, `status`, timestamps. Seed com os 6 valores fixos da planilha.
3. `suppliers` (Fornecedores): todos os campos da seção 1.1, com `code` sequencial, `person_type` (PF/PJ), CPF/CNPJ com validação de duplicidade (constraint `UNIQUE`), FK para `chart_of_accounts` (conta padrão) e `cost_centers` (centro de custo padrão), `status`.
4. `employees` (Funcionários/Colaboradores): todos os campos da seção 1.2, análogo ao acima, com `employment_type` (CLT/PJ/Estagiário/Diretoria).
5. RLS: seguir o padrão "clínica compartilhada" (todo `authenticated` lê/escreve), igual `bill_payments`/`bill_history`.
6. Trigger/constraint de proteção: impedir `DELETE` em `suppliers`/`employees`/`chart_of_accounts`/`cost_centers` quando existir referência ativa em `bills` (regras 2 e 6) — via trigger `BEFORE DELETE` que verifica existência de vínculo e lança exceção, orientando a inativar em vez de excluir.
7. Alterar `bills`: adicionar `supplier_id UUID REFERENCES suppliers(id)` e `employee_id UUID REFERENCES employees(id)` (nullable, mutuamente exclusivos ou nenhum dos dois preenchido para despesas sem cadastro vinculado). Manter `category`/`subcategory` como estão (viram o "snapshot histórico" gravado no momento do lançamento, regra 1).

### Etapa 2 — Tipos e hooks (frontend, seguindo o padrão de `patients`)
1. `src/types/supplier.ts` e `src/types/employee.ts` — interfaces em camelCase espelhando as tabelas.
2. `src/types/chartOfAccounts.ts` e `src/types/costCenter.ts`.
3. `src/hooks/useSuppliers.ts` e `src/hooks/useEmployees.ts` — CRUD completo, com:
   - Validação de CPF/CNPJ (dígito verificador) e duplicidade antes do insert.
   - Bloqueio de exclusão física com fallback para inativação (mensagem clara ao usuário, igual regra 2/6).
   - `writeAuditLog` em cada mutação, seguindo o padrão de `useBills`/`usePatients`.
4. `src/hooks/useChartOfAccounts.ts` e `src/hooks/useCostCenters.ts` — CRUD simples estilo `useReferralSources`, com a mesma trava de exclusão quando há vínculo.

### Etapa 3 — Telas de cadastro
1. `src/components/suppliers/SupplierForm.tsx` (dialog, com máscara PF/CPF vs PJ/CNPJ dinâmica) + `SupplierTable.tsx`.
2. `src/components/employees/EmployeeForm.tsx` + `EmployeeTable.tsx`.
3. Substituir os placeholders `UnderConstruction` em [Fornecedores.tsx](src/pages/Fornecedores.tsx) e [Colaboradores.tsx](src/pages/Colaboradores.tsx) pelas telas reais, mantendo as rotas já existentes.
4. Tela/dialog simples de gestão para Plano de Contas e Centro de Custo (estilo `ManageCategoriesDialog`/`ReferralSourcesDialog`), acessível a partir das telas de Fornecedores/Colaboradores/Contas.
5. Atualizar `AppSidebar.tsx` removendo o badge "Em construção" desses dois itens.

### Etapa 4 — Integração com Contas a Pagar (lançamentos)
1. Em `BillForm.tsx`/`EditBillDialog.tsx`: adicionar seleção opcional de Fornecedor OU Colaborador ao lançar uma despesa.
2. Ao selecionar, pré-preencher automaticamente `category`/`subcategory` (a partir da Conta Padrão) e o Centro de Custo, mantendo os campos editáveis no próprio lançamento (regras 5 e 7).
3. Gravar `supplier_id`/`employee_id` no `bills` para permitir relatórios futuros "gasto por fornecedor" e a checagem de vínculo ativo da regra 2/6.

### Etapa 5 — Regras de negócio e testes
1. Implementar e testar a trava de exclusão (regras 2, 3, 6) nos três níveis: trigger no banco, hook no frontend, e mensagem de UI orientando a inativação.
2. Testar edição de cadastro já usado em lançamento passado → confirmar que `bills` antigos não mudam (regra 1 e 4).
3. Testar troca de Centro de Custo/Conta no momento do lançamento individual (regra 5).
4. Testar fluxo completo: cadastrar fornecedor → lançar despesa vinculada → inativar fornecedor → confirmar que ele some da lista de novos lançamentos mas aparece em relatórios/histórico.

### Etapa 6 — Migração de dados existentes
1. Levantar categorias/subcategorias atualmente em uso em `bills` (built-in + `custom_categories`) e popular `chart_of_accounts` com elas, preservando os textos já usados em lançamentos antigos (para não quebrar filtros/relatórios existentes).
2. Confirmar com você se há fornecedores/funcionários já cadastrados informalmente (ex.: dentro de `description` dos `bills`) que valeria migrar manualmente para os novos cadastros.

## 5. Ordem de execução sugerida
Etapa 0 (validação) → Etapa 1 (banco) → Etapa 2 (hooks) → Etapa 3 (telas) → Etapa 6 (seed/migração de dados) → Etapa 4 (integração com lançamentos) → Etapa 5 (testes de regra de negócio).

## 6. Maior risco do projeto
Transformar `category`/`subcategory` de texto livre em uma tabela `chart_of_accounts` real, sem quebrar relatórios e filtros que hoje dependem dessas strings. Recomendo tratar isso com cautela extra na Etapa 1/6, com uma revisão específica antes de aplicar a migration em produção.
