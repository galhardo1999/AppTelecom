import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bffApi } from '../src/services/api';
import { logger } from '../src/utils/logger';

export default function ContratoScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [contractId, setContractId] = useState<string | null>(null);
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadContract();
    }, []);

    const loadContract = async () => {
        try {
            setLoading(true);
            const contracts = await bffApi.getClientContracts();

            if (contracts && contracts.length > 0) {
                const contract = contracts[0];
                setContractId(contract.id);
            } else {
                setError('Nenhum contrato encontrado.');
            }
        } catch (err: any) {
            logger.error('Error loading contract:', err);
            setError('Erro ao carregar contrato. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!contractId) return;

        try {
            setSubmitting(true);

            // Coletar dados do dispositivo (simulado/básico para React Native)
            const timestamp = new Date().toISOString();
            const userAgent = `${Platform.OS.toUpperCase()} App Apollo Telecom`;

            await bffApi.acceptContract(contractId, {
                timestamp,
                userAgent
            });

            Alert.alert(
                'Sucesso!',
                'Contrato assinado com sucesso. Seu acesso foi liberado.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/dashboard')
                    }
                ]
            );

        } catch (err: any) {
            logger.error('Error accepting contract:', err);
            Alert.alert('Erro', 'Não foi possível registrar o aceite. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `
CONTRATANTE:
O presente contrato será regido pelas Cláusulas a seguir, sem prejuízos às normas da Anatel (Agência Nacional de
Telecomunicações) e demais dispositivos legais vigentes.
Pelo presente instrumento particular, APOLLOTELECOMLTDA, com sede na Rua Presidente Nasser, 2018, Bairro Centro,
Panorama - SP, com CNPJ/MF nº 37.929.857/0001-09, doravante designada PRESTADORA, e, de outrolado
o CONTRATANTE, como tal definido o cliente que aceita os termos e condições deste instrumento, por meio de
adesão ao serviço; têm ajustado entre si o que segue:
CLÁUSULA PRIMEIRA - DAS CONSIDERAÇÕES INICIAIS E DEFINIÇÕES
 1.1 Prestadora de Pequeno Porte (PPP), quando aqui referido, independentemente do número ou gênero em que seja
 mencionado, designa a prestadora dos serviços de comunicação multimídia com até 50.000 (cinquenta mil) acesso em
 serviço (assinante).
 1.2 A PRESTADORA se enquadra, para todos os fins de direito, no conceito de Prestadora de Pequeno Porte (PPP),
 motivo pelo qual é isenta de determinadas obrigações previstas no Regulamento dos Serviços de Comunicação
 2 / 11
 Multimídia, anexo à Resolução ANATEL 614/2013, bem como no Regulamento Geral de Direitos do Consumidor de
 Serviços de Telecomunicações (RGC), anexo à Resolução da ANATEL 632/2014, e ainda, no Regulamento de
 Gestão de Qualidade do Serviço de Comunicação Multimídia (RGQ-SCM), anexo à Resolução ANATEL 574/2011.
 1.3 A PRESTADORA, além de ser uma Prestadora de Pequeno Porte (PPP), possui menos de 5.000 (cinco mil)
 acessos em serviço (assinantes), motivo pelo qual está dispensada do cumprimento de diversas outras obrigações
 previstas no Regulamento dos Serviço de Comunicação Multimídia, anexo à Resolução ANATEL 614/2013, bem
 como no Regulamento Geral de Direitos do Consumidor de Serviços de Telecomunicações (RGC), anexo à
 Resolução ANATEL 632/2014.
 1.4 Considerando que, para fins deste contrato, a expressão CARTA DE ACEITE DE CONTRATO designa o
 instrumento (impresso ou eletrônico) de adesão (presencial ou on-line), que determina o início de sua vigência, que
 o completa e o aperfeiçoa, sendo parte indissociável e formando um só instrumento para todos os fins de direito,
 sem prejuízo de outras formas de adesão previstas em Lei e no presente Contrato.
A CARTA DE ACEITE DE CONTRATO, assinado ou o aceite do contrato pelos demais meios descritos, obriga o
CONTRATANTE aos termos e condições do presente Contrato, podendo ser alterado através de ADITIVOS, desde que
devidamente aceitos por cada parte.
CLÁUSULA SEGUNDA - DO OBJETO
2.1 O presente Contrato tem por objeto a prestação, pela PRESTADORA, do Serviço de Comunicação Multimídia
consistente na disponibilidade de acesso dedicado para transmissão e recepção (transporte) de sinais digitais em alta
velocidade que, para efeito deste instrumento, é denominado APOLLO TELECOM.
CLÁUSULA TERCEIRA - DA INFRA-ESTRUTURA NECESSÁRIA À
PRESTAÇÃO DA APOLLO TELECOM
 3.1 Para a disponibilização e regular funcionamento do APOLLO FIBRA, faz-se necessário que
 o CONTRATANTE disponibilize:
 a. Um terminal de acesso de qualquer tipo podendo ser um micro computador, celular, tablet ou qualquer outro
 dispositivo que esteja apto a acessar a rede mundial de computadores.
 b. Um ponto de energia elétrica para ligar o modem óptico da PRESTADORA e o roteador do CONTRATANTE.
 c. A PRESTADORA cederá ao CONTRATANTE o modem óptico (ONU - Optical Network
 Unit) emregime de CONSIGNAÇÃO para a prestação do serviço APOLLO FIBRA
CLÁUSULA QUARTA - DAS CARACTERÍSTICAS BÁSICAS DO APOLLO
FIBRA
 4.1 São características básicas do APOLLO FIBRA:
 a. O APOLLO FIBRA é prestado na tecnologia FTTX (Fibra óptica).
 b. As velocidades contratadas no APOLLO FIBRA são velocidades nominais máximas de acesso, sendo que
 estão sujeitas a variações decorrentes da própria tecnologia utilizada e das redes que compõem a Internet
 e estão fora da alçada de gerência da PRESTADORA, conforme os fatores técnicos abaixo expostos que
 podem interferir na velocidade:
 c. qualidade e extensão da fiação interna, seja elétrica, rede de dados ou telefônica do imóvel do
 CONTRATANTE;
 d. capacidade de processamento do equipamento e sobretudo tecnologias antigas utilizadas no roteador wi-fi,
 smartphone, tablet, videogame, smart tv, notebook, computador dentre outros dispositivos que venham a
 serutilizados em conjunto com o APOLLO FIBRA do CONTRATANTE;
 e. distância, obstáculos ou interferências no wi-fi sejam de fonte interna do imóvel (vários
 roteadores/extensoresde sinal) ou causada por vizinhos e atenuações próprias da rede Internet, que fogem
 3 / 11
 ao controle
 da PRESTADORA, produzidos entre o sinal emitido e o sinal recebido, principalmente quando a origem dos dados
 for originada em rede de terceiros;
 CONTRATANTE:
 a. problemas no equipamento utilizado pelo CONTRATANTE.
 b. Por velocidade nominal máxima teórica entende-se a velocidade que a tecnologia FTTx suporta, ou
 seja, um usuário navegando na internet poderá atingir até uma determinada velocidade limite, sem ter
 garantia que esta velocidade será sempre mantida em virtude da ocorrência dos fatores descritos na
 cláusula anterior.
 c. Por redes que compõe a Internet entende-se como um aglomerado de redes independentes, com
 equipamentos diferentes e administrados de acordo com políticas diferentes pelas Operadoras. Os pacotes
 que viajam na Internet, de acordo com as aplicações dos usuários, podem sofrer atrasos ou serem
 descartados no meio do caminho entre a origem e o destino, justamente porque os equipamentos das
 Operadoras são diferentes ao longo da rede, afetando diretamente a velocidade do acesso do usuário à
 Internet.
 d. A PRESTADORA não se responsabiliza pelas diferenças de velocidades ocorridas quando estas forem causadas
 pelos fatores elencados na cláusula 4.1.2 e por outros fatores alheios à sua vontade e que fogem do seu controle.
 e. A PRESTADORA fornecerá velocidade instantânea mínima nos termos da Resolução 574/2011 - Anatel,
 conforme abaixo discriminado:
 f. Noventa por cento da taxa de transmissão instantânea no cabo contratada pela CONTRATANTE;
 g. Oitenta por cento da taxa de transmissão média no cabo contratada pela CONTRATANTE;
 4.2 Para a mensuração das velocidades mencionadas nos incisos acima, deverão ser observadas as orientações
constantes nos sites www.speedtest.net, www.fast.com .
 4.3 Para a configuração do APOLLO FIBRA a PRESTADORA irá atribuir ao usuário um endereço IP (Internet
 Protocol) dinâmico ou fixo, público ou de cgnat de acordo com pacote contratado.
 4.4 Caso o APOLLO FIBRA seja utilizado simultaneamente em mais de um ponto de conexão no imóvel, a velocidade
 será compartilhada entre os pontos, e, portanto, poderá sofrer variações de performance.
 4.5 Todos os pontos de conexão deverão estar localizados no mesmo endereço de instalação do APOLLO FIBRA
 constante do cadastro do CONTRATANTE, não sendo possível conectar num ponto de conexão
 situado em endereço diverso.
 CLÁUSULA QUINTA - DA FRANQUIA DE CONSUMO
 5.1 Alguns serviços podem ser ofertados a CONTRATANTE com a previsão do uso de Franquia de Consumo, que
 institui uma limitação de transferência (tráfego) em bytes dentro de um determinado período. Uma vez esgotada
 a Franquia de Consumo, a CONTRATANTE ficará sujeita à redução de velocidade ou a uma cobrança
 proporcionalao consumo ocorrido, o que será antecipadamente previsto no CARTA DE ACEITE DE CONTRATO.
 5.2 A Franquia de Consumo é contabilizada mensalmente pelo sistema da PRESTADORA, começando no 1ºdia até
 o final de cada mês, ou de acordo com outro período previsto na CARTA DE ACEITE DE CONTRATO.
 5.3 Quando ocorrer a extrapolação da Franquia de Consumo, e tendo a CONTRATANTE opitado pela redução da
 velocidade contratada, está redução ocorrerá automaticamente. Neste caso, poderá a CONTRATANTE,
 alternativamente, optar pela continuidade de sua velocidade inicial (com consequente cobrança proporcional ao
 consumo adicional incorrido), devendo, para tal entrar em contato com a PRESTADORA através de Central de
 relacionamento.
 5.4 Quando ocorrer a extrapolação da Franquia de Consumo, e tendo a CONTRATANTE optado pela cobrança
 proporcional ao consumo adicional incorrido, está cobrança adicional ocorrerá automaticamente. Neste caso,
 poderá a CONTRATANTE, alternativamente, optar pela redução de velocidade contratada,
 devendo, para tal entra em contato com a PRESTADORA através de Central de Relacionamento.
 5.6 Nos termos do Artigo 80, parágrafo único, do Regulamento Geral de Direitos do Consumidor de Serviços de
 Telecomunicações (RGC), anexo à Resolução ANATEL 632/2014, a PRESTADORA, não está obrigada
 a informar à CONTRATANTE, quando ocorrer, que o seu consumo está próximo a atingir a franquia
 4 / 11
 contratada.
CLÁUSULA SEXTA - DA INSTALAÇÃO DO APOLLO FIBRA
 6.1 A APOLLO FIBRA será instalado pela PRESTADORA no endereço indicado pelo CONTRATANTE, mediante a
 análise, da disponibilidade na Central que comporta a infraestrutura à qual o endereço de instalação está vinculado,
 bem como à viabilidade técnica no local solicitado.
 6.2 Em caso de solicitação de mudança de endereço das instalações do APOLLO FIBRA, o atendimento ficará
 condicionado a estudos de viabilidade técnica e à disponibilidade na Central que comporta a infraestrutura para o
 novo endereço indicado, bem como ao aceite, pelo CONTRATANTE, de eventual nova condição comercial vigente
 à época da referida solicitação.
 6.3 No caso de impossibilidade técnica para a instalação do APOLLO FIBRA no endereço inicialmente solicitado ou
 para o qual foi solicitada a mudança do serviço, este contrato estará automaticamente extinto, sem que caiba ônus ou
 qualquer espécie de ressarcimento a qualquer das partes.
CONTRATANTE:
 6.4 Será cobrado o valor relativo a Habilitação do APOLLO FIBRA (item 11.1 deste contrato) nas seguintes
 hipóteses:
 a. Solicitação do CONTRATANTE de adesão a APOLLO FIBRA.
 b. Solicitação do CONTRATANTE de mudança de endereço de instalação da APOLLO FIBRA.
 c. Solicitação do CONTRATANTE de mudança da modalidade utilizada, para qualquer uma das modalidades
 disponíveis na empresa.
 6.5 A PRESTADORA fica isenta de qualquer responsabilidade por incompatibilidade dos sistemas operacionais e/ou
 softwares de propriedade do CONTRATANTE com o software de autenticação utilizado para a instalação
 do APOLLO FIBRA.
 6.6 A PRESTADORA após a instalação da APOLLO FIBRA realizará a ativação do serviço que será atestado
 pelo CONTRATANTE confirmando o seu funcionamento, sendo que a partir de então iniciará a cobrança pelo
 serviço.
 CLÁUSULA SÉTIMA - DAS OBRIGAÇÕES DA PRESTADORA
Sem prejuízo de outras disposições deste contrato, constituem obrigações da PRESTADORA:
 7. Ativar a interligação externa desde o ponto de conexão física da PRESTADORA até imóvel do CONTRATANTE.
 7.1 Configurar, supervisionar, manter e controlar a APOLLO FIBRA, de modo a garantir seu funcionamento, até a porta
 de saída do modem óptico, no endereço do CONTRATANTE.
 7.2 Prestar os esclarecimentos necessários ao CONTRATANTE, de modo a permitir o funcionamento do APOLLO
 FIBRA.
 7.3 Proceder às adequações técnicas eventualmente necessárias, de sua responsabilidade, para o perfeito
 funcionamento do APOLLO FIBRA.
 7.4 Não recusar o atendimento a pessoas cujas dependências estejam localizadas na área de prestação do serviço,
 nem impor condições discriminatórias, salvo nos casos em que a pessoa se encontrar em área geográfica ainda
 não atendida pela rede ou caso a capacidade de atendimento já esteja saturada.
 7.5 Tornar disponíveis ao CONTRATANTE informações sobre características e especificações técnicas dos terminais,
 necessárias à conexão destes à sua rede, sendo-lhe vedada a recusa a conectar equipamentos sem justificativa
 técnica comprovada.
 7.6 Prestar esclarecimentos ao CONTRATANTE, de pronto e livre de ônus, face a suas reclamações relativas à fruição
 dos serviços.
 7.7 Zelar estritamente pelo sigilo inerente aos serviços de telecomunicações e pela confidencialidade quanto aos dados
 e informações do CONTRATANTE, empregando todos os meios e tecnologia necessários para assegurar este direito.
 5 / 11
 7.8 Garantir a melhor experiência possível de navegação aos serviços da rede mundial de computadores devidamente
 reconhecidos e registados como servidores de conteúdo legalizado.
 7.9 Manter um centro de atendimento telefônico, atualmente prestado pelo (18) 3871-0606, para todos os seus
 assinantes.
CLÁUSULA OITAVA - DAS OBRIGAÇÕES DO CONTRATANTE
Sem prejuízo de outras disposições deste contrato, constituem obrigações do CONTRATANTE:
 8. Pagar à PRESTADORA os valores devidos pela prestação dos serviços de fornecimento conexão de internet ora
 contratados nas respectivas datas de vencimento.
 8.1 Manter a infraestrutura interna necessária para o funcionamento do APOLLO FIBRA, conforme item 3.1 deste
 instrumento.
 8.2 Assumir inteira responsabilidade pelo correto uso do APOLLO FIBRA no endereço instalado, inclusive com relação
 à configuração de seus equipamentos, obedecendo aos padrões e características técnicas autorizadas
 pela PRESTADORA, comprometendo-se a não alterar as configurações padrão da PRESTADORA e utilizar
 exclusivamente o software ou método de autenticação da PRESTADORA, cumprindo os procedimentos técnicos
 indicados.
 8.3 O serviço é prestado para o uso exclusivamente do CONTRATANTE, devendo este utilizar o APOLLO FIBRA e
 os equipamentos colocados à sua disposição para os fins previstos neste contrato, sendo expressamente proibida
 suacomercialização, cessão, locação, sublocação, compartilhamento, disponibilização ou transferência a terceiros,
 sobpena de rescisão contratual e aplicação da multa prevista no item 15.2 deste contrato.
 8.4 Assumir inteira responsabilidade, na qualidade de fiel depositário, pela guarda e integridade dos equipamentos
 fornecido pela contratada em caráterde aluguel, sendo que fica sob sua responsábilidade a devolução dos
 equipamentos alugados em perfeito estado de funcionamento, sendo eles o modem óptico (ONU Optical Network
 Unit), o Roteador e a Câmera de monitoramento quando houver aluguel destes e demais equipamentos
 eventualmente cedidos a qualquer título pela PRESTADORA e instalado no endereço de funcionamento do
 APOLLO FIBRA, obrigando-se, nos termos da lei, em caso de perda, extravio, dano ou destruição, mesmo que
 parcial, por qualquer motivo, ao respectivo ressarcimento pelo valor de mercado atualizado do modem óptico e/ou
 de qualquer outro equipamento cedido pela PRESTADORA para a prestação do serviço da APOLLO FIBRA.
CONTRATANTE:
A disponibilização pela PRESTADORA do modem óptico ou qualquer outro equipamento ao CONTRATANTE, seja por meio
de
locação, consignação ou qualquer outro meio, não caracteriza transferência de propriedade do respectivo
equipamento, motivo pelo qual no caso de extinção contratual o CONTRATANTE permanecerá responsável pela
guarda do modem óptico e eventuais outros equipamentos, sob pena do ressarcimento previsto no item 8.4 acima,
o(s) qual(is) DEVER(A/ÂO) ser DEVOLVIDO(S) pelo CONTRATANTE em até 30 (trinta) dias contados da data da efetiva
extinção
deste contrato.
 8.5 Permitir aos prepostos designados pela PRESTADORA o acesso às dependências do local onde está
 sendo prestado o serviço objeto deste contrato sempre que necessário, bem como no caso de suspeita de
 descumprimento da obrigação prevista no item 8.4.
 8.6 Responsabilizar-se pelo pagamento dos custos decorrentes da mudança de endereço de instalação do
 APOLLO FIBRA, independentemente de sua causa e a qualquer tempo, durante a vigência contratual.
 8.7 Proceder às adequações técnicas necessárias, indicadas pela PRESTADORA, ou autorizar, desde já,
 que esta assim o proceda, em face de toda e qualquer evolução tecnológica que possa ocorrer durante a vigência
 deste contrato, a fim de permitir o perfeito funcionamento da APOLLO FIBRA.
 8.8 Caso o CONTRATANTE se recuse a proceder às adaptações mencionadas neste item, o contrato estará
 extinto no prazo de 10 (dez) dias, contados de notificação prévia, emitida pela PRESTADORA, sem que talfato possa
 implicar pleito indenizatório de nenhuma espécie.
 6 / 11
 8.9 Responsabilizar-se: (i) pela reparação de qualquer dano ocorrido em seus equipamentos e/ou da PRESTADORA
 que estejam instalados nas dependências do CONTRATANTE, em razão da incorreta utilização dos serviços, incorreta
 instalação de algum software e/ou a utilização de roteador incompatível com as especificações técnicas definidas pela
 PRESTADORA; (ii) pelos danos de qualquer natureza que vier a sofrer em razão e durante a conexão de seu computador
 ou demais dispositivos à Internet.
 8.10 Responsabilizar-se integralmente pela segurança de seus dados e sistemas, utilizando-se, caso entenda
 necessário, de softwares de proteção, os quais não fazem parte do objeto deste contrato e cuja contratação deverá
 ser realizada diretamente pelo CONTRATANTE, preservando-se contra a perda de dados, perdas financeiras,
 invasão de rede e outros eventuais danos causados aos equipamentos de sua propriedade, não cabendo qualquer
 tipo de ressarcimento ou indenização, por parte da PRESTADORA, na ocorrência dessas referidas hipóteses.
 8.11 Providenciar a instalação e manutenção da infraestrutura interna necessária para o funcionamento do
 APOLLOFIBRA e também em um segundo ponto de conexão, se este for de interesse do CONTRATANTE.
 8.12 Somente conectar à rede da PRESTADORA, terminais que possuam certificação expedida ou aceita pela Anatel.
 8.13 Cumprir com as demais obrigações previstas nos artigos 59 e 60 da Resolução nº 272 de 09 de agosto de 2001.
CLÁUSULA NONA - DA MANUTENÇÃO DO APOLLO FIBRA E DO MODEM
 9. Na hipótese de interrupções por falhas atribuíveis à PRESTADORA, esta concederá automaticamente
 ao CONTRATANTE um crédito em sua mensalidade de valor proporcional ao tempo de interrupção que se der
 emfração superior a 8 (oito) horas consecutivas.
 9.1 Nos casos em que a interrupção não for automaticamente detectável pela PRESTADORA, o crédito será
 computado a partir da sua efetiva comunicação pelo CONTRATANTE à PRESTADORA.
 9.2 A PRESTADORA poderá realizar interrupções programadas no serviço para possibilitar a manutenção na
 sua redee/ou similares, as quais poderão ter duração máxima acumulada de 24 (vinte e quatro) horas no mês,
 devendo comunicá- las ao CONTRATANTE com antecedência mínima de 12 (doze) horas, por e-mail, telefone, ou
 qualqueroutro tipo de contato.
 9.3 Na hipótese acima mencionada, a PRESTADORA concederá ao CONTRATANTE um crédito em sua
 mensalidade à razão de 1/30 (um trinta avos) por dia ou fração superior a 8 (oito) horas de interrupção.
 9.4 A PRESTADORA não será obrigada a efetuar o desconto caso a interrupção ou degradação do serviço
 ocorrer pormotivos de caso fortuito ou de força maior ou culpa exclusiva do CONTRATANTE.
 9.5 A manutenção do modem óptico se dará da seguinte forma: Modem óptico locado ou em modelo de consignação:
 A PRESTADORA dará manutenção ao equipamento sem qualquer ônus para o CONTRATANTE, incluindo a sua
substituição
 em caso de evoluções tecnológicas desde que não tenha sido danificado mesmo que parcialmente pelo CONTRATANTE.
 9.6 Na hipótese de ser cedido qualquer outro equipamento ou acessórios ao CONTRATANTE para a
 prestação do serviço APOLLO FIBRA a questão da manutenção será realizada no mesmo formato previsto na
 cláusula 8.4 acima.
CLÁUSULA DÉCIMA - DA VIGÊNCIA E DA DENÚNCIA
 10.1 Este instrumento entra em vigor na data da instalação do APOLLO FIBRA e vigerá pelo prazo de 12 MESES,
 sendo renovado automaticamente, caso não seja notificado por escrito com 30 (trinta) dias de antecedência
 ao seu vencimento.
 10.2 O contrato poderá ser renunciado pelo CONTRATANTE a qualquer tempo, sendo devido o valor pela utilização
 doserviço até a data do efetivo cancelamento, acrescido de 30% (trinta por cento) de multa incidido sobre o valor
 total dos meses restantes para o término do contrato de fidelidade conforme previsto no intem 10.1 acima.
 10.3 Caso o contratante venha a romper o contrato antes do seu prazo de vigência de 12 meses, o mesmo arcará com
 a multa prevista no item 10.2 acima, e também deverá ser pago a taxa de instalação que foi concedida gratuitamente
 para a vigência de 12 meses, portanto caso o contrato seja rompido antes desta vigencia deverá ser pago a
 CONTRATADA o valor integral da taxa de instalação.
CONTRATANTE:
 7 / 11
 10.4 O presente contrato poderá ser renunciado pela PRESTADORA a qualquer tempo, sem qualquer ônus,
 mediantecomunicação escrita ao CONTRATANTE, com antecedência de 30 (trinta) dias.
 a. O encerramento deste contrato na hipótese prevista em 10.3, acima, obriga as partes ao cumprimento de
 todas as respectivas obrigações, durante o prazo de 30 (trinta) dias estabelecido para a denúncia e, por
 consequência, ficam as mesmas sujeitas à aplicação de penalidades pertinentes aos inadimplementos
 ocorridos durante esse período.
CLÁUSULA DÉCIMA PRIMEIRA - DOS PREÇOS E FORMA DE
PAGAMENTO
 11.1 Em decorrência do ajustado neste contrato o CONTRATANTE pagará, à PRESTADORA:
 a. Habilitação do APOLLO FIBRA o valor correspondente à configuração do sistema do CONTRATANTE e da
 Central que comporta a infraestrutura da PRESTADORA para a prestação do APOLLO FIBRA.
 b. Habilitação da Infraestrutura: valor correspondente à disponibilização na Central que comporta a
 infraestrutura da PRESTADORA necessária a instalação do serviço APOLLO FIBRA.
 c. Mensalidade: valor mensal, correspondente à prestação do APOLLO FIBRA pago pelo CONTRATANTE, de
 acordo com o plano de velocidade nominal máxima da PRESTADORA.
 d. Apoio técnico para instalação: valor cobrado pelo suporte dado ao CONTRATANTE, pela PRESTADORA,
 nas seguintes hipóteses:
 d.1 Caso o CONTRATANTE venha a necessitar de auxílio, por parte da PRESTADORA, para
 efetuar a instalação de roteadores e acessórios para o funcionamento do APOLLO FIBRA em outros
 ambientes diferentes do ponto definido no ato da instalação.
 d.2 Caso o CONTRATANTE venha a RESETAR INTENCIONALMENTE as configurações do roteador,
 modem ou acessórios necessários para uso do APOLLO FIBRA
 d.3 Caso o CONTRATANTE venha a danificar modem óptico, cordão óptico ou acessórios do
 APOLLOFIBRA.
 11. Os valores DEVEM OBRIGATORIAMENTE ser consultados antes por meio da Central de Relacionamento, S.A.C
 ou Whatsapp.
 1) O CONTRATANTE autoriza, neste ato, que os valores contratados sejam debitados em NOTA FISCAL e FATURA
 DE SERVIÇOS DE TELECOMUNICAÇÕES, correspondente à instalação da APOLLO FIBRA, na próxima conta
 emitida após a ativação.
CLÁUSULA DÉCIMA SEGUNDA - DOS REAJUSTES
 12.1 Os preços estipulados neste instrumento poderão ser reajustados a cada período de 12 (doze) meses ou na
 menor periodicidade permitida pela legislação em vigor, com data base em 01 de setembro, contados de 01 de
 setembro de um ano até o dia 31 de agosto do ano subsequente.
 12.2 O reajuste a que se refere o item 12.1 supra dar-se-á pela variação positiva do Índice Geral de Preços;
 Disponibilidade Interna; IGP-DI. Caso seja vedada legalmente a utilização desse índice, será utilizado o índice
 legalmente indicado para substituí-lo, sem necessidade de prévia notificação por parte da CONTRATANTE.
CLÁUSULA DÉCIMA TERCEIRA DAS PENALIDADES POR FALTA
DEPAGAMENTO
 13.1 O não pagamento dos valores contratados, lançados em Nota Fiscal Fatura de Telecomunicações
 correspondentes ao APOLLO FIBRA na data do seu vencimento, sujeita o CONTRATANTE, independentemente de
 qualquer aviso ou notificação judicial ou extrajudicial às seguintes penalidades:
 8 / 11
 a. Multa de 2% (dois por cento) aplicada sobre o valor do débito, acrescida de juros de 1% (um por cento) ao
 mês calculado de forma pro rata die, a partir do dia seguinte ao do vencimento, até a data da efetiva
 liquidação. Os valores correspondentes a esta penalidade serão incluídos na fatura.
 Além dos encargos previstos em 13.1, será acrescida aos valores devidos atualização monetária, com base na
variação do Índice Geral de preços Disponibilidade Interna - IGP-DI "pro rata die", a partir do dia seguinte ao do vencimento
até a data da efetiva liquidação do débito.
 13.2 O serviço será suspenso após 15 (quinze) dias contados do respectivo vencimento,
 ficando o seurestabelecimento condicionado ao pagamento do(s) valor(es) em atraso, acrescido(s) da
 multa e juros.
 13.3 A rescisão da APOLLO FIBRA ocorrerá independente de qualquer aviso ou notificação judicial
 ou extrajudicial, após 60 (sessenta) dias, contados da data do vencimento dos valores contratados e não
 pagos, sem prejuízo da exigibilidade dos débitos pendentes, bem como da aplicação das demais
 penalidades cabíveis.
 CLÁUSULA DÉCIMA QUARTA - DO REGIME TRIBUTÁRIO
 14.1 Nos preços contratados estão inclusos todos os tributos incidentes e demais encargos específicos do
 Setor de Telecomunicações, vigentes na data base mencionada na cláusula décima.
 14.2 Todos os tributos incidentes sobre qualquer valor devido em relação à prestação do APOLLO FIBRA já
 estão inclusos nos valores mencionados na cláusula nona acima. Serão automaticamente acrescidos aos
 valores cobrados pela prestação do APOLLO FIBRA valores relativos à criação de qualquer tributo que
 venha a incidir sobre o objeto deste contrato, ou alteração das alíquotas dos tributos atualmente incidentes.
 CLÁUSULA DÉCIMA QUINTA - DA EXTINÇÃO DO CONTRATO
 EPENALIDADES
 15.1 O presente contrato poderá ser rescindido, de pleno direito, mediante notificação prévia, nas seguintes hipóteses:
 a. Se qualquer das partes deixar de cumprir as obrigações aqui pactuadas;
 b. Se qualquer das partes, por ação ou omissão, que não se caracterize expressamente como obrigação
 decorrente deste contrato, mas que o afete, ou seja, de qualquer modo a ele vinculada, prejudique ou
 impeça a continuidade da sua execução;
 c. Se não houver disponibilidade e/ou viabilidade técnica para a instalação da APOLLO FIBRA no caso de
 solicitação de mudança de endereço feita pelo CONTRATANTE, conforme itens 6.1 e 6.2 deste contrato.
 d. Por determinação legal, ou por ordem emanada da autoridade competente, que determine a suspensão ou
 supressão da prestação dos serviços objeto deste contrato;
 e. Por pedido de falência, de recuperação judicial ou extrajudicial ou insolvência civil de qualquer das partes;
 f. É vedado ao CONTRATANTE praticar atos que desrespeitem a lei, a moral, os bons costumes e que
 comprometam a imagem pública da PRESTADORA ou, ainda, contrários aos usos e costumes considerados
 razoáveis e normalmente aceitos no ambiente da Internet, tais como, mas não se restringindo a:
 i) invadir a privacidade ou prejudicar outros membros da comunidade da Internet;
 ii) simples tentativa, acesso ou qualquer forma de controle não autorizado de banco de dados ou sistema
 informatizado da PRESTADORA e/ou de terceiros;
 iii) acessar, alterar e/ou copiar arquivos ou, ainda, simples tentativa de obtenção de senhas e dados de terceiros sem
 prévia autorização;
 iv) enviar mensagens coletivas de e-mail (spam) a grupos de usuários, ofertando produtos ou serviços de qualquer
 natureza, que não sejam de interesse dos destinatários ou que não tenham consentimento expresso deste;
 v) enviar grande quantidade de mensagens a um mesmo destinatário (bombing);
 vi) disseminar vírus de quaisquer espécies, códigos nocivos, cavalos-de-tróia, pushing ou qualquer
 material que possa ser prejudicial ao ambiente de Internet e/ou sistemas, softwares e/ou hardwaresda
 PRESTADORA e/ou de terceiros;
 vii) Divulgar e/ou transmitir mensagens e/ou conteúdos racistas, pornográficos, pedófilos ou quaisquer
 outros que violem a legislação vigente;
 viii) produzir cópias, retransmitir, promover exibição pública ou qualquer outra forma de utilização que, direta
 9 / 11
 ou indiretamente, tenha o intuito de lucro ou que, ainda que não o tenha, caracterize violação a direitos autorais
 deterceiros ou quaisquer direitos relacionados à propriedade intelectual, sendo as transgressões passíveis de
 penalidades civis e criminais;
 ix) realizar, direta ou indiretamente, qualquer alteração, manutenção ou acréscimo na infraestrutura necessária
 à prestação do Serviço sem expressa e prévia aprovação da PRESTADORA, não se aplicando esta regra ao que
 serefere à manutenção de equipamentos adquiridos pelo CONTRATANTE;
 15.2 A prática de qualquer um dos atos previstos neste contrato, além de ensejar a imediata rescisão
 contratual por culpa do CONTRATANTE, implica em multa de 30% (trinta por cento) sobre o valor equivalente
 à soma de 12 (doze) vezes o valor da mensalidade da APOLLO FIBRA, a ser paga pelo CONTRATANTE à
 PRESTADORA, sem prejuízo da apuração de eventuais perdas e danos decorrentes da infração.
 a. O descumprimento do item 8.4 deste contrato implica, além da rescisão do contrato, em multa no valor de R$
 10.000,00 (dez mil reais), a ser paga pelo CONTRATANTE à PRESTADORA, sem prejuízo da apuração de
 eventuais perdas e danos decorrentes do referido descumprimento.
 b. Nas demais hipóteses em que a extinção deste contrato ocorrer por culpa do CONTRATANTE antes de se
 completarem 30 (trinta) dias consecutivos da prestação do serviço, serão cobrados os valores referentes a 1
 (um) mês de prestação do APOLLO FIBRA.
 c. A PRESTADORA, a seu exclusivo critério, nos casos do CONTRATANTE utilizar-se de qualquer das práticas
 previstas no item 15.1 f., acima, poderá bloquear temporariamente o serviço APOLLO FIBRA por 3(três)
 dias, sendo que tal fato não poderá ensejar a aplicação dos descontos concernentes à interrupção do serviço
 de que trata a cláusula sétima, deste instrumento, e a rescisão poderá ocorrer em caso de reincidência da
 prática supra.
 d. Na hipótese acima aventada a PRESTADORA notificará o CONTRATANTE para que regularize a situação
 em 05 (cinco) dias. Caso a regularização não seja observada a PRESTADORA poderá extinguir o Contrato
 de pleno direito.
CLÁUSULA DÉCIMA SEXTA - DAS DISPOSIÇÕES GERAIS
 16.1 O presente contrato será firmado por meio da aceitação expressa do CONTRATANTE, via a assinatura no
 TERMODE ADESÃO ou assinatura eletrônica dado pelo CONTRATANTE neste CONTRATO na sua forma
 digital disponível em SAC ou o pagamento da primeira conta relativa ao APOLLO FIBRA implica também na
 aceitação, pelo CONTRATANTE, de todas as cláusulas aqui dispostas.
 16.2 É facultado à PRESTADORA proceder a adequações no APOLLO FIBRA, visando o acompanhamento
 dasevoluções tecnológicas relacionadas ao serviço prestado e a garantia da sua qualidade, sendo que nessa
 hipótese o CONTRATANTE será comunicado das referidas evoluções com antecedência prévia de 15
 (quinze) dias.
 16.3 É permitido ao CONTRATANTE, mediante solicitação à PRESTRA com antecedência mínima de 48
 (quarenta e oito) horas e desde que haja viabilidade técnica, a migração da velocidade pela qual optou no ato de
 adesão ao serviço para qualquer outra desde que seja superior a velocidade atual contratada.
 a. Na hipótese de migração, a cobrança dos valores relativos à nova velocidade será feita pro-rata-die, a
 contar da data da migração.
 16.4 O CONTRATANTE reconhece que a PRESTADORA é responsável única e exclusivamente pela prestação
 do serviço/produto APOLLO FIBRA, não tendo nenhuma responsabilidade por danos, lucros cessantes ou
 insucessoscomerciais eventualmente sofridos pelo CONTRATANTE associados à utilização do serviço.
 16.5 São parâmetros de qualidade para a prestação dos serviços de banda larga, conforme dispõe o artigo 47 da
 Resolução 272 de 9 de agosto de 2001: o fornecimento de sinais respeitando as características estabelecidas, o
 adequado atendimento às eventuais solicitações e reclamações realizadas, a disponibilidade do serviço, a emissão
 de sinais eletromagnéticos nos níveis estabelecidos em regulamentação e a divulgação de informações essenciais
 à contratação e fruição dos serviços.
 16.6 Qualquer tolerância das partes em relação ao estrito cumprimento das cláusulas e condições e exercício
 dos direitos estabelecidos neste contrato será apenas interpretada como tal, não se constituindo em hipótese
 algumaem novação, sendo que essas cláusulas, condições e direitos poderão ser exercidos, a qualquer tempo e
 a exclusivo critério de qualquer das partes.
 16.7 Todos os prazos e condições deste contrato vencem-se independentemente de aviso ou interpelação
 judicial ouextrajudicial.
 16.8 Caso qualquer das cláusulas ou condições previstas neste contrato venha a se tornar ineficaz ou
 inexequível, talfato não afetará a eficácia ou exequibilidade das demais, que deverão ser cumpridas com fidelidade
 10 / 11
 ao dispostoneste contrato.

 16.9 Fica certo e ajustado que nenhuma das Partes tem poderes para representar ou obrigar a outra, a qualquer
 título ousob qualquer pretexto.

 16.10 O presente contrato não poderá ser cedido por qualquer Parte sem o prévio consentimento por escrito da
 outra Parte. Qualquer tentativa de cessão do presente contrato com violação desta cláusula será nula e conferirá à
 Partenão cedente o direito de rescindir imediatamente o presente contrato.
 a. A restrição prevista na cláusula 16.10 acima não se aplica a cessões decorrentes de reorganizações
 societárias das partes ou a empresas afiliadas, coligadas, controladas ou controladoras e outras formas de
 fusão, cisão ou incorporação.

 16.11 Este contrato obriga as partes e seus sucessores.

 16.12 O presente contrato substitui e anula todos e quaisquer acordos
 firmados anteriormente entre as Partes com relação ao mesmo objeto,
 sejam eles escritos ou verbais.

 16.13 O CONTRATANTE, neste ato, autoriza expressamente a
 PRESTADORA a enviar ao CONTRATANTE, e-mails, malas diretas, encartes
 ou qualquer outro instrumento de comunicação ofertando serviços e/ou
 produtos da PRESTADORA. Tais permissões podem ser revogadas pelo
 CONTRATANTE a qualquer momentopor meio de solicitação feita por meio da
 Central de Relacionamento.

 16.14 O número da Central de Relacionamento é 9090 3871-0606 ou WhatsApp 18
 3871-0606.

 16. Os números telefônicos da Anatel, endereço e site são:
 End.: SAUS Quadra 06 Blocos C, E, F e H CEP 70.070-940 Brasília - DF Pabx: (0XX61)
 2312-2000
 Atendimento ao Usuário: Assessoria de Relações com o Usuário - ARU SAUS Quadra
 06, Bloco F, 2º andar, Brasília - DF,CEP 70.070-940. Central de Atendimento: 1331 e
 1332 para pessoas com necessidades especiais de audição e fala.
 Site: www.anatel.gov.br

 CLÁUSULA DÉCIMA SÉTIMA - DO FORO
 17.1 Fica eleito o foro da comarca do Município de Panorama/SP, para dirimir
 quaisquer questões relativas ao presente Contrato, com renúncia expressa de
 qualquer outro, por mais privilegiado que seja.

 Birigui, Quinta-feira, 18 de Julho de 2024
                `,
                title: 'Contrato Apollo Telecom'
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text className="text-slate-500 mt-4">Carregando contrato...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text className="text-slate-800 text-lg font-bold mt-4 text-center">Ops!</Text>
                <Text className="text-slate-600 text-center mt-2 mb-6">{error}</Text>
                <TouchableOpacity
                    className="bg-purple-600 px-6 py-3 rounded-xl"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-800">Assinatura de Contrato</Text>
                <TouchableOpacity onPress={handleShare} className="p-2 -mr-2">
                    <Ionicons name="share-outline" size={24} color="#7c3aed" />
                </TouchableOpacity>
            </View>

            {/* Conteúdo Texto */}
            <ScrollView className="flex-1 bg-white m-4 rounded-xl shadow-sm p-6">
                <Text className="text-slate-800 text-xl font-bold mb-4">Termos do Contrato</Text>

                <Text className="text-slate-800 font-bold text-lg mb-2">1. Qualificação das Partes</Text>
                <Text className="text-slate-600 mb-4">
                    Aqui você identifica quem está assinando.{'\n\n'}
                    <Text className="font-bold">Contratante/Vendedor:</Text> Nome completo, CPF/CNPJ, endereço e RG.{'\n\n'}
                    <Text className="font-bold">Contratado/Comprador:</Text> Nome completo, CPF/CNPJ, endereço e RG.
                </Text>

                <Text className="text-slate-800 font-bold text-lg mb-2">2. Objeto do Contrato</Text>
                <Text className="text-slate-600 mb-4">
                    É a descrição detalhada do que está sendo negociado.{'\n\n'}
                    Exemplo: "O presente contrato tem como objeto a prestação de serviços de consultoria em marketing digital, conforme o cronograma anexo."
                </Text>

                <Text className="text-slate-800 font-bold text-lg mb-2">3. Obrigações e Direitos</Text>
                <Text className="text-slate-600 mb-4">
                    O que cada um se compromete a fazer.{'\n\n'}
                    <Text className="font-bold">Do Contratado:</Text> Entregar o serviço no prazo, usar materiais de qualidade, etc.{'\n\n'}
                    <Text className="font-bold">Do Contratante:</Text> Fornecer as informações necessárias, efetuar o pagamento, etc.
                </Text>

                <Text className="text-slate-800 font-bold text-lg mb-2">4. Valores e Forma de Pagamento</Text>
                <Text className="text-slate-600 mb-4">
                    Seja muito específico aqui.{'\n\n'}
                    Valor total (numérico e por extenso).{'\n'}
                    Data de vencimento.{'\n'}
                    Método (PIX, boleto, transferência).{'\n'}
                    Multas por atraso (geralmente 2% de multa e 1% de juros ao mês).
                </Text>

                <Text className="text-slate-800 font-bold text-lg mb-2">5. Prazo e Rescisão</Text>
                <Text className="text-slate-600 mb-4">
                    <Text className="font-bold">Vigência:</Text> Quando começa e quando termina.{'\n\n'}
                    <Text className="font-bold">Rescisão:</Text> Em quais condições o contrato pode ser quebrado? É necessário aviso prévio de quantos dias? Existe multa por cancelamento antecipado?
                </Text>

                <Text className="text-slate-800 font-bold text-lg mb-2">6. Foro</Text>
                <Text className="text-slate-600 mb-8">
                    Define em qual cidade eventuais disputas judiciais serão resolvidas.{'\n\n'}
                    Exemplo: "As partes elegem o Foro da Comarca de [Sua Cidade] para dirimir quaisquer dúvidas oriundas deste instrumento."
                </Text>

                <View className="h-8" />
            </ScrollView>

            {/* Footer de Aceite */}
            <View className="bg-white p-6 border-t border-slate-100 shadow-lg pb-8">
                <TouchableOpacity
                    className="flex-row items-center mb-6"
                    onPress={() => setAccepted(!accepted)}
                >
                    <View
                        className="w-6 h-6 rounded border items-center justify-center mr-3"
                        style={{
                            backgroundColor: accepted ? '#7c3aed' : 'white', // purple-600
                            borderColor: accepted ? '#7c3aed' : '#94a3b8' // slate-400
                        }}
                    >
                        {accepted && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-slate-700 flex-1">
                        Li e concordo com os termos do contrato acima.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="rounded-xl py-4 items-center"
                    style={{
                        backgroundColor: accepted ? '#7c3aed' : '#cbd5e1', // purple-600 vs slate-300
                    }}
                    onPress={handleAccept}
                    disabled={!accepted || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            Assinar e Finalizar
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
