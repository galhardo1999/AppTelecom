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
1. Qualificação das Partes
Aqui você identifica quem está assinando.

Contratante/Vendedor: Nome completo, CPF/CNPJ, endereço e RG.

Contratado/Comprador: Nome completo, CPF/CNPJ, endereço e RG.

2. Objeto do Contrato
É a descrição detalhada do que está sendo negociado.

Exemplo: "O presente contrato tem como objeto a prestação de serviços de consultoria em marketing digital, conforme o cronograma anexo."

3. Obrigações e Direitos
O que cada um se compromete a fazer.

Do Contratado: Entregar o serviço no prazo, usar materiais de qualidade, etc.

Do Contratante: Fornecer as informações necessárias, efetuar o pagamento, etc.

4. Valores e Forma de Pagamento
Seja muito específico aqui.

Valor total (numérico e por extenso).

Data de vencimento.

Método (PIX, boleto, transferência).

Multas por atraso (geralmente 2% de multa e 1% de juros ao mês).

5. Prazo e Rescisão
Vigência: Quando começa e quando termina.

Rescisão: Em quais condições o contrato pode ser quebrado? É necessário aviso prévio de quantos dias? Existe multa por cancelamento antecipado?

6. Foro
Define em qual cidade eventuais disputas judiciais serão resolvidas.

Exemplo: "As partes elegem o Foro da Comarca de [Sua Cidade] para dirimir quaisquer dúvidas oriundas deste instrumento."
1. Qualificação das Partes
Aqui você identifica quem está assinando.

Contratante/Vendedor: Nome completo, CPF/CNPJ, endereço e RG.

Contratado/Comprador: Nome completo, CPF/CNPJ, endereço e RG.

2. Objeto do Contrato
É a descrição detalhada do que está sendo negociado.

Exemplo: "O presente contrato tem como objeto a prestação de serviços de consultoria em marketing digital, conforme o cronograma anexo."

3. Obrigações e Direitos
O que cada um se compromete a fazer.

Do Contratado: Entregar o serviço no prazo, usar materiais de qualidade, etc.

Do Contratante: Fornecer as informações necessárias, efetuar o pagamento, etc.

4. Valores e Forma de Pagamento
Seja muito específico aqui.

Valor total (numérico e por extenso).

Data de vencimento.

Método (PIX, boleto, transferência).

Multas por atraso (geralmente 2% de multa e 1% de juros ao mês).

5. Prazo e Rescisão
Vigência: Quando começa e quando termina.

Rescisão: Em quais condições o contrato pode ser quebrado? É necessário aviso prévio de quantos dias? Existe multa por cancelamento antecipado?

6. Foro
Define em qual cidade eventuais disputas judiciais serão resolvidas.

Exemplo: "As partes elegem o Foro da Comarca de [Sua Cidade] para dirimir quaisquer dúvidas oriundas deste instrumento."
1. Qualificação das Partes
Aqui você identifica quem está assinando.

Contratante/Vendedor: Nome completo, CPF/CNPJ, endereço e RG.

Contratado/Comprador: Nome completo, CPF/CNPJ, endereço e RG.

2. Objeto do Contrato
É a descrição detalhada do que está sendo negociado.

Exemplo: "O presente contrato tem como objeto a prestação de serviços de consultoria em marketing digital, conforme o cronograma anexo."

3. Obrigações e Direitos
O que cada um se compromete a fazer.

Do Contratado: Entregar o serviço no prazo, usar materiais de qualidade, etc.

Do Contratante: Fornecer as informações necessárias, efetuar o pagamento, etc.

4. Valores e Forma de Pagamento
Seja muito específico aqui.

Valor total (numérico e por extenso).

Data de vencimento.

Método (PIX, boleto, transferência).

Multas por atraso (geralmente 2% de multa e 1% de juros ao mês).

5. Prazo e Rescisão
Vigência: Quando começa e quando termina.

Rescisão: Em quais condições o contrato pode ser quebrado? É necessário aviso prévio de quantos dias? Existe multa por cancelamento antecipado?

6. Foro
Define em qual cidade eventuais disputas judiciais serão resolvidas.

Exemplo: "As partes elegem o Foro da Comarca de [Sua Cidade] para dirimir quaisquer dúvidas oriundas deste instrumento."
1. Qualificação das Partes
Aqui você identifica quem está assinando.

Contratante/Vendedor: Nome completo, CPF/CNPJ, endereço e RG.

Contratado/Comprador: Nome completo, CPF/CNPJ, endereço e RG.

2. Objeto do Contrato
É a descrição detalhada do que está sendo negociado.

Exemplo: "O presente contrato tem como objeto a prestação de serviços de consultoria em marketing digital, conforme o cronograma anexo."

3. Obrigações e Direitos
O que cada um se compromete a fazer.

Do Contratado: Entregar o serviço no prazo, usar materiais de qualidade, etc.

Do Contratante: Fornecer as informações necessárias, efetuar o pagamento, etc.

4. Valores e Forma de Pagamento
Seja muito específico aqui.

Valor total (numérico e por extenso).

Data de vencimento.

Método (PIX, boleto, transferência).

Multas por atraso (geralmente 2% de multa e 1% de juros ao mês).

5. Prazo e Rescisão
Vigência: Quando começa e quando termina.

Rescisão: Em quais condições o contrato pode ser quebrado? É necessário aviso prévio de quantos dias? Existe multa por cancelamento antecipado?

6. Foro
Define em qual cidade eventuais disputas judiciais serão resolvidas.

Exemplo: "As partes elegem o Foro da Comarca de [Sua Cidade] para dirimir quaisquer dúvidas oriundas deste instrumento."
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
