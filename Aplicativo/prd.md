# PRD — Apollo Telecom App (Mobile)

> Documento atualizado em 23/03/2026, refletindo o estado atual do projeto.

## 1. Visão Geral

Aplicativo móvel para clientes finais de provedores de internet (ISP) que utilizam o ERP IXC Soft. O app permite ao cliente consultar faturas, planos, realizar pagamentos (PIX, boleto) e gerenciar cobrança recorrente por cartão de crédito.

**Não possui cadastro (sign-up)** — apenas login com credenciais existentes no IXC.

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo (Managed Workflow, SDK 54) |
| Linguagem | TypeScript |
| Estilização | NativeWind (TailwindCSS para RN) |
| Navegação | Expo Router + Material Top Tabs (swipe entre abas) |
| Estado Global | Context API (`AuthContext`, `ContractContext`) |
| Fetching/Cache | React Query (`@tanstack/react-query`) |
| HTTP Client | Axios (conectando ao BFF) |
| Auth Storage | `expo-secure-store` (JWT + credenciais biométricas) |
| Animações | `react-native-reanimated` |

---

## 3. Arquitetura

```
┌─────────────┐      HTTPS/JWT       ┌──────────────┐      API IXC       ┌──────────┐
│  App Mobile  │  ──────────────────▶ │  BFF (Vercel) │ ──────────────▶   │  IXC Soft │
│  (Expo/RN)   │  ◀────────────────── │  Node.js API  │ ◀──────────────   │   ERP     │
└─────────────┘                       └──────────────┘                    └──────────┘
                                            │
                                            ▼
                                      ┌──────────┐
                                      │  Cielo    │
                                      │ (Braspag) │
                                      └──────────┘
```

O app **nunca** se conecta diretamente ao IXC. Toda comunicação passa pelo BFF (Backend For Frontend), que:
- Gerencia credenciais sensíveis do IXC (token de admin)
- Implementa autenticação JWT para o app
- Faz proxy seguro de todas as chamadas
- Integra com Cielo/Braspag para tokenização de cartões

---

## 4. Telas e Funcionalidades

### 4.1 Login (`app/index.tsx`) ✅
- Email + Senha com validação via BFF/IXC
- **Biometria** (Face ID / TouchID) via `useBiometrics` hook
- Lembrar email no dispositivo
- Animações de teclado (logo shrink, conteúdo sobe)
- Modal de recuperação de senha
- Alertas customizados (`CustomAlert`)

### 4.2 Dashboard — 5 abas com swipe (`app/dashboard/`)

#### Home (`index.tsx`) ✅
- Saudação com nome do cliente
- Seleção de contrato (quando há múltiplos)
- Resumo da última fatura (valor, vencimento, status)
- Ações rápidas: copiar PIX, ver boleto, 2ª via
- Alerta de faturas vencidas
- Banner de anúncios regionais (`AdBanner`)
- Modal promocional por cidade (`PromotionalModal`)

#### Faturas (`faturas.tsx`) ✅
- 3 abas: Vencidas, Abertas, Pagas (com contadores)
- Seleção de contrato (múltiplos)
- Copiar código PIX / linha digitável
- Gerar e compartilhar boleto em PDF
- Download/salvamento de boletos
- WebView para visualização de PDFs

#### Planos (`planos.tsx`) ✅
- Detalhes do contrato: plano, titular, data de ativação, endereço
- Status do contrato com badges coloridos (Ativo, Bloqueado, Cancelado)
- Download do contrato em PDF
- Seleção entre múltiplos contratos

#### Suporte (`suporte.tsx`) ✅
- Canais de atendimento: WhatsApp, Telefone
- FAQ com passos detalhados
- Mensagens pré-definidas para WhatsApp

#### Perfil (`perfil.tsx`) ✅
- Dados do usuário (com mascaramento LGPD: email, CPF)
- Links para Meu Plano, Pagamento Recorrente, Central de Ajuda
- Seção de Pendências (documentos a assinar)
- Logout com confirmação

### 4.3 Assinatura de Contrato (`app/contrato.tsx`) ✅
- Exibe o texto completo do contrato de prestação de serviços Apollo Telecom (SCM/Anatel)
- Checkbox de aceite + botão "Assinar e Finalizar"
- Envia aceite ao BFF com timestamp e user-agent do dispositivo
- Botão de compartilhamento do contrato (Share nativo)
- Redireciona para o dashboard após aceite bem-sucedido

### 4.4 Teste de Velocidade (`app/velocidade.tsx`) ✅
- WebView embutida apontando para `fast.com/pt/` (Speedtest Netflix)
- Header com gradiente cyan
- Indicador de carregamento customizado enquanto a página carrega
- Botão de voltar para a tela anterior

### 4.5 Pagamento Recorrente (`app/recorrencia/`)

#### Detalhes (`index.tsx`) ✅
- Visualização do cartão cadastrado (preview premium com gradiente da bandeira)
- Status: Ativa vs. Inativa
- Botão de remover cartão com confirmação
- Botão de cadastrar cartão (se não tiver)

#### Cadastro (`cadastro.tsx`) ✅
- Formulário: nome, número do cartão, validade, CVC
- Detecção automática de bandeira (Visa, Mastercard, Elo, Amex)
- Preview do cartão em tempo real com gradiente da bandeira
- Validação completa do formulário
- Tokenização via Cielo/Braspag (backend)

---

## 5. Segurança Implementada

| Medida | Status | Detalhe |
|---|---|---|
| BFF Proxy | ✅ | App nunca acessa IXC diretamente |
| JWT + SecureStore | ✅ | Token armazenado em keychain/keystore nativo |
| Interceptador 401 | ✅ | Logout automático em token expirado |
| Logger de Produção | ✅ | Suprime logs em prod, sanitiza dados sensíveis |
| Screen Security | ✅ | Previne screenshots em telas financeiras |
| LGPD Masking | ✅ | Email e CPF parcialmente ocultos no perfil |
| Zero console.log | ✅ | Nenhum dado sensível exposto em logs |

---

## 6. Endpoints do BFF (API)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Autenticação (email + senha) |
| GET | `/api/user` | Dados do usuário |
| GET | `/api/invoices` | Faturas em aberto |
| GET | `/api/invoices/history` | Histórico completo de faturas |
| POST | `/api/invoices/pix/:id` | Gerar código PIX |
| POST | `/api/invoices/boleto/:id` | Gerar boleto PDF (base64) |
| GET | `/api/contracts` | Contratos do cliente |
| POST | `/api/contracts/:id` | Download contrato PDF (base64) |
| GET | `/api/contracts/usage` | Consumo de internet |
| PUT | `/api/contracts/:id/recurring-card` | Cadastrar cartão recorrente |
| DELETE | `/api/contracts/:id/recurring-card` | Remover cartão recorrente |

---

## 7. Estrutura do Projeto

```
app/
├── _layout.tsx              # Root layout (providers, auth redirect)
├── index.tsx                # Tela de Login
├── contrato.tsx             # Assinatura digital de contrato
├── velocidade.tsx           # Teste de velocidade (WebView fast.com)
├── dashboard/
│   ├── _layout.tsx          # Tab layout (Material Top Tabs)
│   ├── index.tsx            # Home
│   ├── faturas.tsx          # Faturas
│   ├── planos.tsx           # Planos/Contratos
│   ├── suporte.tsx          # Suporte/FAQ
│   └── perfil.tsx           # Perfil
└── recorrencia/
    ├── _layout.tsx          # Stack layout
    ├── index.tsx            # Detalhes do cartão
    └── cadastro.tsx         # Cadastro de cartão

src/
├── components/
│   ├── AdBanner.tsx         # Banner rotativo de anúncios
│   ├── ContractPickerModal.tsx  # Modal de seleção de contrato (shared)
│   ├── CreditCardPreview.tsx    # Preview premium de cartão (shared)
│   ├── CustomAlert.tsx      # Modal de alerta customizado
│   ├── DashboardTabBar.tsx  # TabBar customizada
│   ├── GradientHeader.tsx   # Header gradiente padrão (shared)
│   ├── PromotionalModal.tsx # Modal de promoções por cidade
│   ├── Skeleton.tsx         # Componentes de loading skeleton
│   └── StateComponents.tsx  # Error/Empty/Loading states
├── context/
│   ├── AuthContext.tsx      # Autenticação + sessão
│   └── ContractContext.tsx  # Gerenciamento de contratos
├── hooks/
│   ├── useBiometrics.ts     # Face ID / TouchID
│   ├── useMutations.ts      # React Query mutations (PIX, boleto, cartão)
│   ├── useQueries.ts        # React Query queries (faturas, contratos)
│   └── useScreenSecurity.ts # Prevenção de screenshots
├── lib/
│   └── queryClient.ts       # Instância e configuração central do React Query
├── services/
│   └── api.ts               # Axios + interceptadores + endpoints BFF
├── types/
│   └── ixc.ts               # Types: Invoice, Contract, RadUsuario
└── utils/
    ├── cardUtils.ts          # Detecção/formatação de bandeiras (shared)
    ├── cityImages.ts         # Mapeamento de imagens por cidade
    ├── formatters.ts         # Formatadores (moeda, data, nome, CPF)
    ├── logger.ts             # Logger seguro para produção
    ├── maskUtils.ts          # Mascaramento LGPD (email, CPF, CNPJ)
    └── toast.ts              # Toast cross-platform
```

---

## 8. Melhorias Futuras (Backlog)

- [ ] **Refatorar `faturas.tsx`** (~780 linhas) — dividir em sub-componentes
- [ ] **Refatorar `index.tsx` Login** (~515 linhas) — extrair modais e lógica
- [ ] **Notificações push** — alertas de faturas vencidas
- [ ] **Modo offline** — cache local de dados com React Query persistence
- [x] **Tela de velocidade** — teste de velocidade via WebView (fast.com) — `app/velocidade.tsx` ✅
- [ ] **Dark mode** — suporte a tema escuro
- [x] **Assinatura digital** — aceite eletrônico de contrato com registro de timestamp — `app/contrato.tsx` ✅
- [ ] **Testes automatizados** — Jest + React Native Testing Library