# Financeiro Complexo Terapêutico

Sistema financeiro para clínicas terapêuticas — React + Vite + TypeScript + Supabase.

## Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Backend/DB**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Deploy**: Vercel

---

## Desenvolvimento local

### Pré-requisitos

- Node.js >= 18
- npm ou pnpm

### Configuração

```sh
# 1. Clone o repositório
git clone <YOUR_GIT_URL>
cd financeirocomplexoterapeutico

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de ambiente

Veja [`.env.example`](.env.example) para todas as variáveis necessárias:

| Variável                        | Descrição                                           |
| ------------------------------- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase                             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key do Supabase (segura para o browser) |

---

## Deploy no Vercel

### 1. Suba o código para o GitHub

```sh
git init
git add .
git commit -m "chore: remove lovable, add vercel config"
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 2. Importe no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório do GitHub
3. Configure o **Root Directory** como `financeirocomplexoterapeutico` (se o repo tiver essa pasta na raiz)
4. O Vercel detecta automaticamente Vite — as configurações padrão funcionam:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Configure as variáveis de ambiente no Vercel

No painel do projeto → **Settings → Environment Variables**, adicione:

```
VITE_SUPABASE_URL=https://seu-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

### 4. Deploy

Clique em **Deploy**. A partir daí, todo `git push` na branch `main` faz deploy automático.

---

## Scripts disponíveis

```sh
npm run dev        # Servidor de desenvolvimento (porta 8080)
npm run build      # Build de produção
npm run preview    # Preview do build local
npm run lint       # Lint
npm run test       # Testes
```

---

## Supabase Edge Functions

As Edge Functions ficam em `supabase/functions/` e são deployadas separadamente via Supabase CLI:

```sh
supabase functions deploy create-user
supabase functions deploy delete-user
supabase functions deploy list-users
supabase functions deploy update-user-role
supabase functions deploy create-admin
```

Consulte [`SECURITY_SETUP.md`](SECURITY_SETUP.md) para detalhes de segurança e configuração do banco.
