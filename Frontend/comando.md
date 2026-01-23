Atue como um Engenheiro de Software Sênior com foco em Arquitetura Mobile (React Native/Expo) e Segurança de Sistemas.

Sua tarefa é realizar uma análise crítica profunda do projeto Apollo Telecom, um app de autoatendimento para ISPs integrado ao ERP IXC Soft. Com base na stack e no fluxo descritos abaixo, forneça um relatório técnico detalhado cobrindo:

1. Análise de Segurança (Crítica)
Protocolo de Senha: O sistema utiliza comparação via hash MD5 (padrão do IXC). Avalie os riscos de ataques de colisão e Rainbow Tables. Sugira métodos de mitigação (como Salting ou upgrade de protocolo via camada intermediária).

Armazenamento Local: O uso de expo-secure-store é adequado, mas quais dados exatamente devem ser persistidos? Analise a segurança do armazenamento de tokens de sessão.

Comunicação com API: Avalie a necessidade de SSL Pinning para evitar ataques Man-in-the-Middle (MitM), dado que o app lida com dados financeiros e de faturas.

2. Escalabilidade e Performance
Integração Direta vs. Backend Próprio: O app consome a API do IXC Soft diretamente. Analise o impacto disso caso o provedor tenha milhares de acessos simultâneos. Vale a pena criar um "BFF" (Backend for Frontend) em Node.js/Bun para cache e agregação de dados?

Renderização e Animações: Com React Native Reanimated e Worklets, como garantir que a UI se mantenha a 60/120 FPS em dispositivos Android de entrada (comuns em clientes de provedores regionais)?

Gerenciamento de Estado: Não foi mencionada uma biblioteca de estado (Zustand, TanStack Query, Redux). Sugira a melhor abordagem para evitar requisições desnecessárias à API do ERP.

3. Redundância e Resiliência (Falhas no Sistema)
Disponibilidade do ERP: Se o servidor IXC do provedor ficar offline, como o app deve se comportar? Proponha uma estratégia de Offline First ou estados de erro amigáveis.

Validação de Credenciais: O login depende exclusivamente do campo hotsite_email. Analise possíveis conflitos caso o mesmo e-mail esteja em cadastros diferentes no IXC.

4. Otimização da Stack
Versões de Dependências: O projeto usa React Native 0.81.5 (versão bleeding edge) e Expo 54. Verifique possíveis instabilidades de bibliotecas como NativeWind e Reanimated nessas versões específicas.

Build e Bundle: Sugira otimizações para o tamanho do bundle (JS bundle size) no Android e iOS, considerando o uso de expo-constants e expo-font.