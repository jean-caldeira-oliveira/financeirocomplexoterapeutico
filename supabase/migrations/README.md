# Migrations — processo manual

As migrations deste projeto **não são aplicadas via `supabase db push`**.
O histórico de migrations aplicadas no banco remoto não bate com os arquivos
deste diretório (várias migrations recentes já existiam manualmente no banco
antes do arquivo `.sql` correspondente ser commitado), então um `db push`
tenta reaplicar objetos que já existem e falha (`already exists`).

## Como aplicar uma nova migration

1. O agente/desenvolvedor cria o arquivo `.sql` em `supabase/migrations/`.
2. **Você (Jean) copia o conteúdo do arquivo e roda manualmente no SQL
   Editor do painel do Supabase** (projeto `financeirocomplexoterapeutico`,
   ref `zgthjlrdgjbfwvwxbijz`).
3. Depois de rodar com sucesso, avise para seguirmos com o próximo passo
   (ex.: gerar os tipos TypeScript a partir do schema atualizado).

## Migrations pendentes agora

- ~~`20260901040000_add_suppliers_employees.sql`~~ — já aplicada.
- `20260901050000_seed_chart_of_accounts.sql` — popula `chart_of_accounts`
  com um conjunto mínimo de 20 contas (as 15 subcategorias de despesa já
  usadas hoje em `bills.category`/`subcategory`, mais 3 contas específicas
  citadas na especificação para Funcionário: Pró-labore, Honorários, Equipe
  Técnica Clínica CLT). Sem isso, o campo "Conta Padrão" (obrigatório) fica
  vazio e é impossível concluir um cadastro de Fornecedor/Funcionário.
  Não migra lançamentos (`bills`) antigos — só popula o catálogo de contas
  disponível para novos cadastros.

## Depois de rodar a migration

Rode para atualizar os tipos TypeScript usados pelo frontend
(`src/integrations/supabase/types.ts`):

```
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

Se preferir, cole o resultado de `select column_name, data_type from
information_schema.columns where table_name = 'suppliers'` (e o mesmo para
`employees`, `cost_centers`, `chart_of_accounts`) para eu conferir se o
schema aplicado bate com o esperado.
