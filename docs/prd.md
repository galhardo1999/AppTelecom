# PRD — App Apollo Telecom

## 0. Metadados
- **Versão:** 1.1  
- **Data:** 2024-05-27  
- **Patrocinador:** Diretoria Apollo Telecom  
- **Stakeholders-chave:** Produto, Mobile, Backend, SecOps, QA, DevOps  
- **Status:** Draft para aprovação executiva

## 1. Resumo Executivo
O aplicativo Apollo Telecom será o cliente móvel oficial da API IXC, oferecendo login seguro, visualização inicial de dados do assinante e fundações sólidas para evoluções futuras. Este PRD organiza os 15 itens fornecidos em requisitos rastreáveis, criteriosamente aceitos e distribuídos por fases de entrega.

## 2. Objetivos e KPIs
- **Confiabilidade:** ≥ 99% de sucesso no fluxo de login/refresh em ambiente homologado.
- **Segurança:** Zero incidentes críticos relacionados a armazenamento de credenciais; SSL pinning habilitado em builds de produção.
- **Qualidade:** Cobertura mínima de 80% para módulos críticos + suíte Detox automatizada no CI.
- **Velocidade:** Onboarding de novos devs em até 2h usando README e docs.
- **Entrega:** Builds EAS disponíveis (Android/iOS) com configurações dev/staging/prod.

## 3. Escopo
**Incluído:** Autenticação IXC ponta a ponta, tela de dashboard simples, arquitetura Expo/TypeScript com Redux Toolkit, NativeWind, i18n, camada de serviços segura, testes (Jest/Detox), pipeline CI/CD, documentação, homologação em devices reais.  
**Excluído:** Funcionalidades avançadas pós-login, notificações push, billing, integrações extras ao IXC, suporte offline completo.

## 4. Premissas e Dependências
1. Backend disponibiliza URL final da API IXC (prod/homolog), documentação de autenticação e política de erros até o fim da Semana 1.  
2. Certificados válidos para ambientes produtivos; self-signed permitido somente em homolog mediante flag `IXC_SELF_SIGNED`.  
3. Equipe de Segurança aprova abordagens de SSL pinning, storage seguro e sanitização/logging antes da Fase 2.  
4. Secrets e variáveis ficam armazenadas em cofre do CI/CD/Expo (nenhum valor sensível no repo).  
5. DevOps garante contas de App Store / Play Store e acesso ao EAS Build.

## 5. Fluxo de Experiência
1. **Splash/Loading:** App inicia, carrega configurações, verifica tokens seguros.  
2. **Rota condicional:** Se tokens válidos → Dashboard; caso contrário → Login.  
3. **Login:** Usuário insere email/CPF + senha. Formulário habilita botão somente quando válido.  
4. **Autenticação:** Cliente chama `authService.login`, salva tokens criptografados e atualiza Redux.  
5. **Dashboard:** Exibe dados principais recebidos da API IXC + estado de sessão.  
6. **Refresh/Logout:** Interceptors gerenciam expiração; logout limpa storage, volta ao Login.

## 6. Requisitos Não Funcionais
- **Performance:** Timeout global 30s para API; feedback visual em todas as operações > 500 ms.  
- **Segurança:** SSL pinning, criptografia AES para storage, sanitização de entrada/logging.  
- **Composição:** Expo SDK mais recente com TypeScript estrito, ESLint + Prettier integrados ao CI.  
- **Acessibilidade:** Componentes base com suporte a screen readers e estados de foco.  
- **Localização:** i18n pronto para PT-BR/EN-US; fallback seguro.

## 7. Requisitos Detalhados (Itens 1–15)
| # | Área | Descrição | Entregáveis | Critérios de Aceite |
|---|------|-----------|-------------|---------------------|
| 1 | Planejamento | Definir repositório, convenções de branch/commit e alinhar com backend (URL, auth, erros) | Repositório (GitHub/GitLab/Bitbucket), guia de contribuição, ata de alinhamento com backend | Convenções aprovadas pelos leads; documentação salva em `docs/architecture.md` |
| 2 | Setup Expo | Iniciar projeto Expo (SDK atual) com TypeScript, ESLint, Prettier, EditorConfig e aliases (`@/features`, etc.) | `package.json` com scripts `lint`/`format`, configs `.eslintrc`, `.prettierrc`, `.editorconfig`, tsconfig com paths | `npm run lint` sem erros; imports funcionam usando aliases |
| 3 | Ambiente | Suporte a variáveis `.env` e `IXC_CONFIG` consumindo `process.env` | `.env.example` contendo `IXC_HOST`, `IXC_TOKEN`, `IXC_SELF_SIGNED`; `.gitignore` atualizado; `src/services/api/ixcConfig.ts` | Build carrega variáveis por ambiente; secrets configurados no CI/EAS |
| 4 | UI Base | Instalar NativeWind, configurar `tailwind.config.js` com tokens de tema + `nativewind.d.ts`; criar `UiButton`, `UiInput`, `UiText`, `Screen` usando `className` | Arquivos de componentes e tokens revisados por design | Componentes cobrem estados padrão/desabilitado/erro; preview interno aprovado |
| 5 | Navegação | Configurar React Navigation (AuthStack, AppStack, BottomTabs opcional) com fluxo inicial | Telas de Splash, Login, Dashboard; lógica de verificação de sessão | App redireciona corretamente conforme tokens; sem flickers perceptíveis |
| 6 | Estado | Escolher solução (Redux Toolkit recomendado), criar `store`, `authSlice`, slices extras (ui/config) e prover Provider global | `src/store/index.ts`, slices com tipagem forte | Redux DevTools mostra transições corretas; hooks customizados documentados |
| 7 | API/Storage | Criar `src/services/api/client.ts` (axios) com base URL `IXC_CONFIG.HOST`, timeout 30s, interceptors (token, erros) + serviço de auth (login, refresh, logout) + storage seguro (SecureStore/Keychain/EncryptedSharedPrefs) com AES | Arquivos `client.ts`, `authService.ts`, `secureStorage.ts` | Requests enviam header `Authorization`; 401/403 disparam refresh/logout conforme especificado; storage criptografa tokens |
| 8 | Segurança Avançada | SSL pinning, validação estrita de certificados, sanitização de dados/logs e helper de logging sem dados sensíveis | Implementação de pinning (bare/custom dev client), módulo de sanitização, logger central | Build rejeita certificados inválidos; logs não exibem senhas/tokens/CPF |
| 9 | Login Screen | `features/auth/screens/LoginScreen.tsx` com validação email/CPF (regex + máscara), senha ≥ 8 chars, validação em tempo real e botão desabilitado quando inválido/loading | Componentes + hooks de formulário; integrações com `authService` e Redux | Testes demonstram mensagens amigáveis; sucesso navega ao Dashboard |
| 10 | i18n | Configurar `src/i18n/i18n.ts` + `locales/pt-BR.json` / `locales/en-US.json`; substituir textos hardcoded | Hooks/utilitários de tradução integrados | Alternar idioma atualiza textos sem reiniciar app |
| 11 | Dashboard | Tela minimal pós-login exibindo dados da API IXC + caching (in-memory ou storage) | `features/dashboard/DashboardScreen.tsx`, serviço de dados com cache | Fluxo completo login → dashboard validado; dados persistem até expiração |
| 12 | Testes | Configurar Jest + React Native Testing Library + Detox | Suites para formulário de login, serviços de API (mocks axios) e hooks de auth; cenários Detox (abrir app, login inválido, login válido, logout) | CI roda `npm run lint`, `npm run test`, job Detox opcional; taxa de sucesso > 95% |
| 13 | CI/CD + Builds | Pipeline (GitHub Actions ou similar) executando lint/testes por PR, integração com EAS Build (dev/staging/prod) com secrets IXC; geração `.aab` e `.ipa`/archive | Configs `.github/workflows/*.yml` (ou equivalente), perfis EAS, documentação de secrets | Merge bloqueado se pipeline falhar; builds distribuídos para QA |
| 14 | Documentação | Pasta `/docs` com `architecture.md`, `auth-flow.md`, `installation.md`, `security-checklist.md`, `troubleshooting.md`; README com visão geral, setup local, `.env`, testes | Arquivos markdown revisados | Novos devs conseguem rodar o app seguindo README sem auxílio adicional |
| 15 | Homologação & Entrega | Testar em devices reais (Android 9+/iOS 13+), revisar checklist de segurança (SSL pinning, criptografia, logs) e preparar release final | Relatório de testes, checklist assinado, registro de bugs corrigidos, vídeo da jornada (login → dashboard → logout) | Stakeholders aprovam release; nenhum bug blocker aberto |

## 8. Arquitetura de Referência
- **Front-end:** Expo (Managed ou Bare conforme SSL pinning) + React Native, TypeScript estrito, NativeWind.  
- **Estado:** Redux Toolkit + hooks específicos (`useAuth`).  
- **Serviços:** Axios client com interceptors; SecureStore/Keychain + AES.  
- **Infra CI/CD:** GitHub Actions (lint/test/build) + Expo EAS Build + distribuição interna.  
- **Observabilidade:** Logger central com níveis (debug/info/warn/error) e sanitização.

## 9. Estratégia de Testes
1. **Unitários:** Jest + RNTL para formulários, slices, hooks.  
2. **Integração:** Mocks axios para auth/refresh/logout, validação de interceptors.  
3. **E2E:** Detox cobrindo abertura, login inválido/válido e logout.  
4. **Manuais:** Checklist em devices reais Android 9+/iOS 13+.  
5. **Segurança:** Revisão de SSL pinning, certificados, storage e logging antes de liberar builds.

## 10. Plano de Entrega (Marcos)
1. **Semana 1:** Itens 1–3 concluídos, ambientes definidos.  
2. **Semana 2:** UI base, navegação e store (Itens 4–6).  
3. **Semana 3:** Serviços, segurança e login (Itens 7–9) + primeira rodada de testes unitários.  
4. **Semana 4:** i18n, dashboard e suítes completas de testes (Itens 10–12).  
5. **Semana 5:** CI/CD, documentação e homologação (Itens 13–15) + builds EAS.

## 11. Riscos e Mitigações
| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Atraso na definição da API IXC | Bloqueia desenvolvimento | Alta | Formalizar contrato com backend; usar mocks temporários |
| Limitações do Expo para SSL pinning | Pode exigir ejetar para bare | Média | Validar PoC na Semana 2; planejar custom dev client | 
| Falta de secrets no CI/EAS | Impede builds automatizados | Média | DevOps participa desde Fase 0; checklist no `.env.example` |
| Falhas em devices antigos | Reprovação na homologação | Baixa | Testes periódicos em Android 9+/iOS 13+ físicos/simulados |

## 12. Próximos Passos
1. Validar este PRD com Produto, Backend e Segurança.  
2. Criar épicos/boards no tracker (um por seção de requisitos).  
3. Kickoff técnico com definição de owner por item e cronograma detalhado.  
4. Agendar revisão de segurança antes do início da Fase 2.  
5. Preparar plano de comunicação para homologação e vídeo de demonstração final.

---
Documento reformulado a partir da lista original, agregando objetivos, critérios de aceite e cronograma para orientar execução, QA e handoff.
