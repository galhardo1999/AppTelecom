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
import { useContract } from '../../src/context/ContractContext';
import { bffApi } from '../../src/services/api';

/**
 * Detecta a bandeira do cartão pelo número (primeiros dígitos)
 */
function detectCardBrand(number: string): string {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(clean)) return 'elo';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(606282|3841)/.test(clean)) return 'hipercard';
    if (/^3(?:0[0-5]|[68])/.test(clean)) return 'diners';
    return '';
}

/**
 * Retorna o ícone e cor da bandeira
 */
function getBrandInfo(brand: string): { icon: keyof typeof Ionicons.glyphMap; color: string; label: string } {
    switch (brand) {
        case 'visa': return { icon: 'card-outline', color: '#1A1F71', label: 'Visa' };
        case 'mastercard': return { icon: 'card-outline', color: '#EB001B', label: 'Mastercard' };
        case 'elo': return { icon: 'card-outline', color: '#00A4E0', label: 'Elo' };
        case 'amex': return { icon: 'card-outline', color: '#006FCF', label: 'Amex' };
        case 'hipercard': return { icon: 'card-outline', color: '#822124', label: 'Hipercard' };
        case 'diners': return { icon: 'card-outline', color: '#0079BE', label: 'Diners' };
        default: return { icon: 'card-outline', color: '#94a3b8', label: '' };
    }
}

/**
 * Aplica máscara no número do cartão: XXXX XXXX XXXX XXXX
 */
function maskCardNumber(value: string): string {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    const groups = clean.match(/.{1,4}/g);
    return groups ? groups.join(' ') : clean;
}

/**
 * Aplica máscara na validade: MM/AA
 */
function maskExpiry(value: string): string {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
        return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
}

export default function CobrancaRecorrenteScreen() {
    const router = useRouter();
    const { selectedContract } = useContract();

    const [nomeTitular, setNomeTitular] = useState('');
    const [numeroCartao, setNumeroCartao] = useState('');
    const [validade, setValidade] = useState('');
    const [cvc, setCvc] = useState('');
    const [loading, setLoading] = useState(false);

    // Detectar bandeira automaticamente
    const cleanNumber = numeroCartao.replace(/\D/g, '');
    const bandeira = detectCardBrand(cleanNumber);
    const brandInfo = getBrandInfo(bandeira);

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
     * Simula tokenização do gateway e envia para o BFF
     * TODO: integrar com gateway real (PagSeguro, Mercado Pago, etc.)
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
        const [mm, aa] = validade.split('/');
        const mesNum = parseInt(mm, 10);
        if (mesNum < 1 || mesNum > 12) {
            Alert.alert('Atenção', 'Mês de validade inválido');
            return;
        }

        setLoading(true);

        try {
            // TODO: Substituir por integração real com gateway de pagamento
            // O gateway deve receber os dados do cartão e retornar um token seguro
            const simulatedToken = `tok_${Date.now()}_${cleanNumber.slice(-4)}`;

            // Enviar token e bandeira para o BFF (que atualiza o contrato no IXC)
            const result = await bffApi.setupRecurringCard(selectedContract.id, {
                token: simulatedToken,
                bandeira: bandeira,
            });

            if (result.success) {
                Alert.alert(
                    '✅ Cartão Cadastrado',
                    'Seu cartão foi cadastrado com sucesso para cobrança recorrente!',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert('Erro', result.message || 'Erro ao cadastrar cartão');
            }
        } catch (error: any) {
            console.error('Erro ao cadastrar cartão:', error);
            const errorMessage = error.response?.data?.error || 'Não foi possível cadastrar o cartão. Tente novamente.';
            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="h-[22%] w-full">
                <LinearGradient
                    colors={['#a855f7', '#7e22ce', '#3b0764']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />
                <SafeAreaView edges={['top']} className="flex-1 px-6">
                    <View className="flex-row items-center py-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/20 rounded-xl p-2 mr-4"
                        >
                            <Ionicons name="arrow-back" size={22} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold">Pagamento Recorrente</Text>
                    </View>
                    <Text className="text-white/80 text-sm mt-2">
                        Cadastre seu cartão de crédito para cobrança automática
                    </Text>
                </SafeAreaView>
            </View>

            {/* Formulário */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 -mt-6 px-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Card Preview */}
                    <View className="bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg">
                        <View className="flex-row justify-between items-center mb-8">
                            <Ionicons name="wifi-outline" size={24} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
                            {bandeira ? (
                                <View className="flex-row items-center bg-white/20 rounded-lg px-3 py-1">
                                    <Ionicons name={brandInfo.icon} size={18} color={brandInfo.color} />
                                    <Text className="text-white font-semibold ml-2 text-sm">{brandInfo.label}</Text>
                                </View>
                            ) : (
                                <Ionicons name="card-outline" size={24} color="#94a3b8" />
                            )}
                        </View>
                        <Text className="text-white text-xl tracking-[4px] font-mono mb-6">
                            {cleanNumber.length > 0
                                ? maskCardNumber(cleanNumber)
                                : '•••• •••• •••• ••••'}
                        </Text>
                        <View className="flex-row justify-between">
                            <View>
                                <Text className="text-slate-400 text-xs uppercase mb-1">Titular</Text>
                                <Text className="text-white text-sm font-semibold">
                                    {nomeTitular.length > 0 ? nomeTitular.toUpperCase() : 'NOME DO TITULAR'}
                                </Text>
                            </View>
                            <View>
                                <Text className="text-slate-400 text-xs uppercase mb-1">Validade</Text>
                                <Text className="text-white text-sm font-semibold">
                                    {validade.length > 0 ? validade : 'MM/AA'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Campos do formulário */}
                    <View className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
                        {/* Nome do Titular */}
                        <View className="mb-5">
                            <Text className="text-slate-600 text-sm font-semibold mb-2">Nome do Titular</Text>
                            <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                                <Ionicons name="person-outline" size={20} color="#94a3b8" />
                                <TextInput
                                    className="flex-1 ml-3 text-slate-800 text-base"
                                    placeholder="Como está no cartão"
                                    placeholderTextColor="#94a3b8"
                                    value={nomeTitular}
                                    onChangeText={setNomeTitular}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        {/* Número do Cartão */}
                        <View className="mb-5">
                            <Text className="text-slate-600 text-sm font-semibold mb-2">Número do Cartão</Text>
                            <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                                <Ionicons name={brandInfo.icon} size={20} color={bandeira ? brandInfo.color : '#94a3b8'} />
                                <TextInput
                                    className="flex-1 ml-3 text-slate-800 text-base"
                                    placeholder="0000 0000 0000 0000"
                                    placeholderTextColor="#94a3b8"
                                    value={numeroCartao}
                                    onChangeText={handleCardNumberChange}
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                            </View>
                        </View>

                        {/* Validade e CVC lado a lado */}
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="text-slate-600 text-sm font-semibold mb-2">Validade</Text>
                                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                                    <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-800 text-base"
                                        placeholder="MM/AA"
                                        placeholderTextColor="#94a3b8"
                                        value={validade}
                                        onChangeText={handleExpiryChange}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-600 text-sm font-semibold mb-2">CVC</Text>
                                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                                    <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-800 text-base"
                                        placeholder="123"
                                        placeholderTextColor="#94a3b8"
                                        value={cvc}
                                        onChangeText={handleCvcChange}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Info do Contrato */}
                    {selectedContract && (
                        <View className="bg-purple-50 rounded-2xl border border-purple-100 p-4 mb-6">
                            <View className="flex-row items-center">
                                <Ionicons name="document-text-outline" size={20} color="#7c3aed" />
                                <Text className="text-purple-700 text-sm font-semibold ml-2">
                                    Contrato #{selectedContract.id}
                                </Text>
                            </View>
                            <Text className="text-purple-600 text-xs mt-1">
                                O cartão será vinculado a este contrato para cobrança automática
                            </Text>
                        </View>
                    )}

                    {/* Botão de Cadastrar */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!isFormValid || loading}
                        className={`rounded-2xl py-4 items-center shadow-sm ${isFormValid && !loading ? 'bg-purple-600' : 'bg-slate-300'
                            }`}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator size="small" color="white" />
                                <Text className="text-white font-bold text-base ml-3">Processando...</Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center">
                                <Ionicons name="shield-checkmark-outline" size={20} color="white" />
                                <Text className="text-white font-bold text-base ml-2">Cadastrar Cartão</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Segurança */}
                    <View className="flex-row items-center justify-center mt-4">
                        <Ionicons name="lock-closed" size={14} color="#94a3b8" />
                        <Text className="text-slate-400 text-xs ml-1">
                            Seus dados são criptografados e protegidos
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
