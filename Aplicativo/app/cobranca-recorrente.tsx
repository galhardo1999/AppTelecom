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
import { useContract } from '../src/context/ContractContext';
import { bffApi } from '../src/services/api';

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
    const [savedCard, setSavedCard] = useState<{ brand: string; last4: string } | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Carregar dados frescos do contrato ao montar
    React.useEffect(() => {
        loadContractData();
    }, [selectedContract?.id]);

    const loadContractData = async () => {
        if (!selectedContract?.id) return;
        setRefreshing(true);
        try {
            // Recarregar contratos para garantir dados atualizados
            const contracts = await bffApi.getClientContracts();
            const current = contracts.find((c: any) => c.id === selectedContract.id);

            if (current && current.credit_card_recorrente_numero_cartao) {
                const num = current.credit_card_recorrente_numero_cartao;
                const brand = current.credit_card_recorrente_bandeira_cartao?.toLowerCase() || 'mastercard'; // fallback
                const last4 = num.length > 4 ? num.slice(-4) : num;
                setSavedCard({ brand, last4 });
            } else {
                setSavedCard(null);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do contrato:', error);
        } finally {
            setRefreshing(false);
        }
    };

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

    const handleDeleteCard = async () => {
        if (!selectedContract?.id) return;

        Alert.alert(
            "Excluir Cartão",
            "Tem certeza que deseja remover este cartão do pagamento recorrente? Você voltará para o boleto.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await bffApi.deleteRecurringCard(selectedContract.id);
                            Alert.alert("Sucesso", "Cartão removido com sucesso!");
                            setSavedCard(null);
                            // Limpar formulário
                            setNomeTitular('');
                            setNumeroCartao('');
                            setValidade('');
                            setCvc('');
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Erro", "Não foi possível remover o cartão.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRegister = async () => {
        if (!selectedContract?.id) {
            Alert.alert("Erro", "Nenhum contrato selecionado.");
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
            await bffApi.setupRecurringCard(selectedContract.id, {
                cardNumber: cleanNumber,
                holder: nomeTitular.toUpperCase(),
                expirationDate: validade,
                securityCode: cvc,
                brand: bandeira,
                customerName: nomeTitular.toUpperCase(),
            });

            Alert.alert("Sucesso", "Cartão cadastrado com sucesso!");
            loadContractData(); // Recarregar para mostrar estado salvo
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.error || 'Não foi possível cadastrar o cartão. Tente novamente.';
            Alert.alert("Erro", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#334155" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-800">Pagamento Recorrente</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="mb-6">
                    <Text className="text-gray-600 mb-2">Contrato Selecionado</Text>
                    <View className="bg-white p-4 rounded-xl border border-gray-200">
                        <Text className="font-bold text-lg text-slate-800">
                            {selectedContract?.contrato || 'Carregando...'}
                        </Text>
                        <Text className="text-gray-500">ID: {selectedContract?.id}</Text>
                    </View>
                </View>

                {savedCard ? (
                    <View className="mb-6">
                        <Text className="text-gray-600 mb-2">Cartão Cadastrado</Text>
                        <View className="bg-white p-6 rounded-xl border border-gray-200 flex-row items-center justify-between shadow-sm">
                            <View className="flex-row items-center gap-4">
                                <ActivityIndicator animating={refreshing} size="small" className="absolute right-0 top-0 m-2" />
                                <View className={`w-12 h-8 rounded justify-center items-center bg-slate-100`}>
                                    <Ionicons
                                        name={getBrandInfo(savedCard.brand).icon}
                                        size={24}
                                        color={getBrandInfo(savedCard.brand).color}
                                    />
                                </View>
                                <View>
                                    <Text className="font-bold text-slate-800 capitalize">{savedCard.brand}</Text>
                                    <Text className="text-gray-500">•••• •••• •••• {savedCard.last4}</Text>
                                </View>
                            </View>
                        </View>

                        <View className="mt-6">
                            <TouchableOpacity
                                className="w-full bg-red-50 p-4 rounded-xl flex-row justify-center items-center border border-red-100"
                                onPress={handleDeleteCard}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ef4444" />
                                ) : (
                                    <>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" className="mr-2" />
                                        <Text className="text-red-500 font-bold text-lg">Excluir Cartão</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <Text className="text-center text-gray-400 mt-4 text-sm">
                                Ao excluir, seu contrato voltará para o boleto bancário.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View>
                        <View className="mb-6">
                            <Text className="text-gray-600 mb-4">Dados do Cartão de Crédito</Text>

                            <View className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                                <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Número do Cartão</Text>
                                <View className="flex-row items-center">
                                    <TextInput
                                        className="flex-1 text-lg text-slate-800 font-medium h-10"
                                        placeholder="0000 0000 0000 0000"
                                        keyboardType="numeric"
                                        value={numeroCartao}
                                        onChangeText={handleCardNumberChange}
                                        maxLength={19}
                                    />
                                    {bandeira !== '' && (
                                        <Ionicons
                                            name={brandInfo.icon}
                                            size={24}
                                            color={brandInfo.color}
                                        />
                                    )}
                                </View>
                            </View>

                            <View className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                                <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Nome no Cartão</Text>
                                <TextInput
                                    className="text-lg text-slate-800 font-medium h-10"
                                    placeholder="NOME COMO NO CARTÃO"
                                    autoCapitalize="characters"
                                    value={nomeTitular}
                                    onChangeText={setNomeTitular}
                                />
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200">
                                    <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Validade</Text>
                                    <TextInput
                                        className="text-lg text-slate-800 font-medium h-10"
                                        placeholder="MM/AA"
                                        keyboardType="numeric"
                                        value={validade}
                                        onChangeText={handleExpiryChange}
                                        maxLength={5}
                                    />
                                </View>

                                <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200">
                                    <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider">CVV</Text>
                                    <View className="flex-row items-center">
                                        <TextInput
                                            className="flex-1 text-lg text-slate-800 font-medium h-10"
                                            placeholder="123"
                                            keyboardType="numeric"
                                            secureTextEntry
                                            value={cvc}
                                            onChangeText={handleCvcChange}
                                            maxLength={4}
                                        />
                                        <Ionicons name="help-circle-outline" size={20} color="#94a3b8" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={!isFormValid || loading}
                        >
                            <LinearGradient
                                colors={isFormValid && !loading ? ['#0ea5e9', '#0284c7'] : ['#e2e8f0', '#cbd5e1']}
                                className="p-4 rounded-xl flex-row justify-center items-center"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="lock-closed" size={20} color={isFormValid ? "white" : "#94a3b8"} className="mr-2" />
                                        <Text className={`font-bold text-lg ${isFormValid ? 'text-white' : 'text-slate-400'}`}>
                                            Cadastrar Cartão
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View className="mt-6 flex-row justify-center items-center">
                            <Ionicons name="shield-checkmark" size={16} color="#64748b" className="mr-1" />
                            <Text className="text-slate-500 text-sm">Seus dados são criptografados e seguros.</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
