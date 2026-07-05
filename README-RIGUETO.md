# Trio CRM — Rigueto

> CRM com WhatsApp e IA para o time de vendas da Rigueto.  
> Baseado no template open-source [wacrm](https://github.com/ArnasDon/wacrm).

## Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Banco de Dados**: Supabase (PostgreSQL + pgvector + Realtime)
- **WhatsApp**: Meta Cloud API (oficial) + Evolution API (self-hosted via Baileys)
- **IA**: OpenAI GPT-4o/GPT-4o-mini (bring-your-own-key por conta)
- **Infraestrutura**: Supabase Self-Hosted via Docker

---

## Setup Local (Desenvolvimento)

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Node.js 20+
- PowerShell 7+

### 1. Subir o Supabase local

```powershell
cd d:\Dev\trio-crm
docker compose -f infra/docker-compose.supabase.yml up -d
```

Aguardar ~30 segundos para o PostgreSQL inicializar.

### 2. Aplicar as migrations

```powershell
.\infra\setup-db.ps1
```

Isso aplica as 32 migrations em ordem (001-030 do wacrm + 031-032 do Trio CRM).

### 3. Configurar variáveis de ambiente

O arquivo `.env.local` já está configurado para o Supabase local. Revise e ajuste se necessário:

```env
# Necessário preencher apenas para conectar o WhatsApp real:
META_APP_SECRET=  # Apenas para driver Meta
```

### 4. Rodar o app

```powershell
npm run dev
```

Acesse: **http://localhost:3000**

---

## Acessos Locais

| Serviço | URL |
|---|---|
| Trio CRM (Next.js) | http://localhost:3000 |
| Supabase Studio | http://localhost:3001 |
| API Gateway (Kong) | http://localhost:8000 |
| PostgreSQL direto | localhost:5432 |

---

## Customizações Trio CRM (vs wacrm original)

### ✅ Aplicadas
- **Patch de Segurança** — `/api/automations/engine` agora requer `role >= agent` (previamente qualquer usuário autenticado podia disparar automações)
- **Evolution API Adapter** — `src/lib/whatsapp/evolution-api.ts` para conexão via QR Code
- **Migration 031** — Schema híbrido WhatsApp (Meta + Evolution)
- **Migration 032** — Função RPC `get_next_round_robin_agent` para rodízio de vendedores

### 📋 Pendente (próximas fases)
- [ ] UI de configuração do driver WhatsApp (Meta vs Evolution) em Settings
- [ ] Webhook unificado que normaliza payloads Meta e Evolution para o mesmo schema interno
- [ ] `engineSendMessage` factory que delega ao driver correto baseado em `whatsapp_config.provider`
- [ ] Integração completa do round-robin no builder de automações (modo `round_robin` no step `assign_conversation`)
- [ ] Branding: renomear "wacrm" → "Trio CRM" na UI

---

## Segurança

- Tokens WhatsApp (Meta e Evolution) armazenados criptografados com AES-256-GCM
- Service-role key nunca exposta ao client (apenas server-side)
- RLS (Row Level Security) ativo em todas as tabelas
- API pública (`/api/v1`) com chaves revogáveis por escopo

---

## Número WhatsApp Rigueto

- **Número**: +55 31 9581-2260
- **Driver padrão**: A definir (Meta oficial ou Evolution)
