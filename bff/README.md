# Apollo Telecom BFF

Backend for Frontend que isola as credenciais do IXC e provê autenticação JWT segura para o app mobile.

## Início Rápido

```bash
# Instalar Bun (se não tiver)
# Windows: powershell -c "irm bun.sh/install.ps1 | iex"

# Instalar dependências
bun install

# Rodar em desenvolvimento
bun run dev
```

## Endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/login` | Login com email/senha | Não |
| GET | `/api/user` | Dados do usuário | JWT |
| GET | `/api/invoices` | Faturas abertas | JWT |
| GET | `/api/contracts` | Contratos | JWT |
| POST | `/api/pix/:invoiceId` | Código PIX | JWT |
| POST | `/api/boleto/:invoiceId` | PDF do boleto | JWT |

## Deploy

Recomendado: [Railway](https://railway.app) ou [Vercel](https://vercel.com)

```bash
# Railway
railway up

# Vercel
vercel --prod
```
