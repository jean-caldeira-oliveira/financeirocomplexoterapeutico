# 🔐 Pendência de Segurança

## ⚠️ Configurar Backup Diário do Banco de Dados

> **Status:** Pendente — requer upgrade do plano Supabase.

### Opção A — Backup automático via Supabase (recomendado)

1. No painel do Supabase, vá em **Project Settings → Database → Backups**
2. Faça upgrade para o plano **Pro ($25/mês)**
3. O backup diário será habilitado automaticamente
4. Para restaurar: **Database → Backups → Restore**

> 💡 Recomendado para um sistema clínico/financeiro com dados sensíveis.

### Opção B — Backup manual via pg_dump (gratuito)

```bash
# Obtenha a connection string em: Project Settings → Database → Connection string
pg_dump "postgresql://postgres:[SUA-SENHA]@db.zgthjlrdgjbfwvwxbijz.supabase.co:5432/postgres" \
  --no-owner \
  --no-acl \
  -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### Opção C — Script de backup automático (cron job)

```bash
#!/bin/bash
BACKUP_DIR="/backups/clinica"
DATE=$(date +%Y%m%d_%H%M%S)
DB_URL="postgresql://postgres:[SUA-SENHA]@db.zgthjlrdgjbfwvwxbijz.supabase.co:5432/postgres"

mkdir -p "$BACKUP_DIR"

pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  -f "$BACKUP_DIR/backup_$DATE.sql"

# Manter apenas os últimos 30 backups
ls -t "$BACKUP_DIR"/backup_*.sql | tail -n +31 | xargs rm -f

echo "Backup concluído: backup_$DATE.sql"
```

Adicione ao cron para rodar diariamente às 2h da manhã:

```bash
crontab -e
# Adicione a linha:
0 2 * * * /caminho/para/backup.sh >> /var/log/backup_clinica.log 2>&1
```
