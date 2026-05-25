import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCardPreview } from '../../src/components/CreditCardPreview';
import { useContract } from '../../src/context/ContractContext';
import { useScreenSecurity } from '../../src/hooks/useScreenSecurity';
import { bffApi } from '../../src/services/api';
import { detectCardBrand, maskCardNumber, maskExpiry } from '../../src/utils/cardUtils';
import { logger } from '../../src/utils/logger';

export default function CobrancaRecorrenteCadastroScreen() {
    const router = useRouter();
    const { selectedContract, refreshContracts } = useContract();

    // Prevenir screenshots em tela de dados financeiros
    useScreenSecurity(true);

    const [nomeTitular, setNomeTitular] = useState('');
    const [numeroCartao, setNumeroCartao] = useState('');
    const [validade, setValidade] = useState('');
    const [cvc, setCvc] = useState('');
    const [loading, setLoading] = useState(false);

    // Detectar bandeira automaticamente
    const cleanNumber = numeroCartao.replace(/\D/g, '');
    const bandeira = detectCardBrand(cleanNumber);

    // Validação do formulário
    const isFormValid =
        nomeTitular.trim().length >= 3 &&
        cleanNumber.length >= 15 &&
        validade.length === 5 &&
        cvc.length >= 3 &&
        bandeira !== '';

    const handleCardNumberChange = (text: string) => {
        setNumeroCartao(maskCardNumber(text));
    };

    const handleExpiryChange = (text: string) => {
        setValidade(maskExpiry(text));
    };

    const handleCvcChange = (text: string) => {
        setCvc(text.replace(/\D/g, '').slice(0, 4));
    };

    /**
     * Envia dados do cartão para o backend
     */
    const handleSubmit = async () => {
        if (!selectedContract) {
            Alert.alert('Erro', 'Nenhum contrato selecionado');
            return;
        }

        if (!isFormValid) {
            Alert.alert('Atenção', 'Preencha todos os campos corretamente');
            return;
        }

        // Validar validade MM/AA
        const [mm] = validade.split('/');
        const mesNum = parseInt(mm, 10);
        if (mesNum < 1 || mesNum > 12) {
            Alert.alert('Atenção', 'Mês de validade inválido');
            return;
        }

        setLoading(true);

        try {
            const cardData = {
                cardNumber: cleanNumber,
                holder: nomeTitular,
                expirationDate: validade,
                securityCode: cvc,
                brand: bandeira,
                customerName: nomeTitular,
            };

            // Enviar dados do cartão para o backend (Cielo tokeniza no servidor)
            const result = await bffApi.setupRecurringCard(selectedContract.id, cardData);

            if (result.success) {
                await refreshContracts();
                Alert.alert(
                    '✅ Sucesso!',
                    'Cobrança recorrente ativada. Suas faturas serão debitadas automaticamente.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert('Erro', result.message || 'Erro ao cadastrar cartão');
            }
        } catch (error: any) {
            logger.error('Erro ao cadastrar cartão:', error);
            const errorMessage = error.response?.data?.error || 'Não foi possível cadastrar o cartão. Tente novamente.';
            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* Header Simples */}
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#334155" />
                    </TouchableOpacity>
                    <Text className="text-slate-800 text-lg font-bold">Cadastrar Cartão</Text>
                    <View className="w-10" />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-6 pt-2"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >

                        {/* Cartão Preview - Visual Premium */}
                        <View className="items-center mb-8 mt-2">
                            <CreditCardPreview
                                brand={bandeira}
                                displayNumber={cleanNumber.length > 0 ? maskCardNumber(cleanNumber) : '•••• •••• •••• ••••'}
                                holder={nomeTitular}
                                expiry={validade}
                            />
                        </View>

                        {/* Formulário Clean */}
                        <View className="space-y-5">
                            <View>
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Dados do Cartão</Text>

                                <View className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    {/* Número */}
                                    <View className="flex-row items-center px-4 py-4 border-b border-slate-100">
                                        <Ionicons name="card-outline" size={22} color="#94a3b8" />
                                        <TextInput
                                            className="flex-1 ml-3 text-slate-800 font-medium text-base"
                                            placeholder="Número do Cartão"
                                            placeholderTextColor="#cbd5e1"
                                            keyboardType="numeric"
                                            value={numeroCartao}
                                            onChangeText={handleCardNumberChange}
                                            maxLength={19}
                                        />
                                        {bandeira !== '' && (
                                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                        )}
                                    </View>

                                    {/* Nome */}
                                    <View className="flex-row items-center px-4 py-4 border-b border-slate-100">
                                        <Ionicons name="person-outline" size={22} color="#94a3b8" />
                                        <TextInput
                                            className="flex-1 ml-3 text-slate-800 font-medium text-base"
                                            placeholder="Nome impresso no cartão"
                                            placeholderTextColor="#cbd5e1"
                                            autoCapitalize="characters"
                                            value={nomeTitular}
                                            onChangeText={setNomeTitular}
                                        />
                                    </View>

                                    {/* Validade e CVV */}
                                    <View className="flex-row">
                                        <View className="flex-1 flex-row items-center px-4 py-4 border-r border-slate-100">
                                            <Ionicons name="calendar-outline" size={22} color="#94a3b8" />
                                            <TextInput
                                                className="flex-1 ml-3 text-slate-800 font-medium text-base"
                                                placeholder="MM/AA"
                                                placeholderTextColor="#cbd5e1"
                                                keyboardType="numeric"
                                                value={validade}
                                                onChangeText={handleExpiryChange}
                                                maxLength={5}
                                            />
                                        </View>
                                        <View className="flex-1 flex-row items-center px-4 py-4">
                                            <Ionicons name="lock-closed-outline" size={22} color="#94a3b8" />
                                            <TextInput
                                                className="flex-1 ml-3 text-slate-800 font-medium text-base"
                                                placeholder="CVV"
                                                placeholderTextColor="#cbd5e1"
                                                keyboardType="numeric"
                                                secureTextEntry
                                                value={cvc}
                                                onChangeText={handleCvcChange}
                                                maxLength={4}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Informações de Segurança */}
                            <View className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex-row gap-3">
                                <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                                <View className="flex-1">
                                    <Text className="text-blue-900 font-semibold text-sm mb-0.5">Pagamento Seguro</Text>
                                    <Text className="text-blue-700/70 text-xs leading-4">
                                        Seus dados são criptografados e processados diretamente pela Cielo. Não armazenamos o número completo do seu cartão.
                                    </Text>
                                </View>
                            </View>

                            {/* Botão Salvar */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!isFormValid || loading}
                                activeOpacity={0.8}
                                className="mt-4 shadow-lg shadow-purple-200"
                            >
                                <LinearGradient
                                    colors={!isFormValid ? ['#cbd5e1', '#94a3b8'] : ['#a855f7', '#7e22ce']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4 rounded-xl items-center flex-row justify-center"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text className="text-white font-bold text-lg mr-2">Ativar Recorrência</Text>
                                            <Ionicons name="arrow-forward" size={20} color="white" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
