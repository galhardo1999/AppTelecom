Aja como um Desenvolvedor Senior em React Native e Expo. Eu preciso criar um aplicativo móvel para provedores de internet (ISP) que utiliza a API do ERP IXC Soft.

Objetivo do Projeto: Criar um aplicativo de consulta para clientes finais. O aplicativo não terá cadastro (sign-up); apenas login. O login deve validar as credenciais do usuário comparando com os dados existentes no banco de dados do IXC via API.

Stack Tecnológico:

Framework: React Native com Expo (Managed Workflow).

Linguagem: TypeScript.

Estilização: NativeWind (TailwindCSS) ou StyleSheet padrão (prefira um design limpo e moderno).

Gerenciamento de Estado: Context API ou Zustand.

HTTP Client: Axios.

Navegação: Expo Router ou React Navigation.

Requisitos Funcionais:

Tela de Login:

Campos: Email e Senha.

A lógica de autenticação deve consultar a API do IXC.

Deve buscar na tabela de clientes (cliente) filtrando pelo campo hotsite_email.

Se encontrar o cliente, verificar se a senha confere (obs: simule a lógica de verificação de senha baseada no retorno da API ou hash MD5 se necessário, conforme padrão do IXC).

Armazenar o token de sessão ou dados do usuário no AsyncStorage ou SecureStore.

Dashboard (Home):

Após o login, mostrar uma tela de "Boas-vindas" com o nome do cliente recuperado da API.

Esta tela servirá apenas para consulta de informações (ex: exibir o ID do cliente, Status da conexão, Plano contratado). Por enquanto, crie apenas os placeholders para esses dados.

Integração com API IXC:

Base URL e Token de API estarão no arquivo .env.

Crie um serviço dedicado (api.ts) configurado com Axios.

A autenticação na API do IXC geralmente usa Basic Auth ou um Token no Header. O app deve usar as credenciais globais do sistema (do .env) para fazer as consultas, mas o acesso do usuário final é validado contra os dados retornados.

Arquivos de Referência:

As credenciais e documentação básica de como conectar estão nos seguintes arquivos:

Conteúdo do arquivo .env:

[COLE AQUI O CONTEÚDO DO SEU .ENV]
Conteúdo do arquivo ixccliente.md (ou documentação relevante):

[COLE AQUI O CONTEÚDO DO SEU ARQUIVO IXCCLIENTE.MD]
Instruções de Saída: Gere a estrutura do projeto, a configuração do axios para a API do IXC, o Contexto de Autenticação (AuthContext) lidando com a lógica de hotsite_email, e as telas de Login e Dashboard.

⚠️ Pontos de Atenção Críticos (Leia antes de prosseguir)
Como seu "Thought Partner", preciso alertar sobre alguns riscos técnicos nessa abordagem:

Segurança das Credenciais (Risco Alto): Você mencionou que as credenciais da API estarão no .env do App.

O Problema: Em React Native, tudo o que está no .env é "buildado" junto com o app. Se alguém baixar seu app e fizer engenharia reversa, poderá extrair o Token de Admin do seu IXC. Isso daria acesso total ao seu provedor para qualquer pessoa mal-intencionada.

A Solução Correta: O ideal é criar um "Middleware" (um pequeno backend em Node.js ou PHP). O App chama esse seu backend, e o seu backend (que é seguro) chama o IXC. O App nunca deve ter a senha mestra do IXC.

CORS e Conexão Direta: A API do IXC Soft muitas vezes bloqueia requisições vindas diretamente de navegadores ou apps móveis por motivos de segurança (CORS). Você pode ter problemas de conexão Network Error se tentar chamar o IXC direto do celular sem um proxy.

Senha do IXC: O IXC geralmente armazena senhas em hash (MD5 ou similar). Ao buscar o usuário pelo hotsite_email, a API vai retornar a senha criptografada. O seu app terá que criptografar o que o usuário digitou e comparar com o que veio da API. Peça para a IA incluir uma função de hash (ex: crypto-js) se a API não tiver uma rota de /login nativa pronta para uso.