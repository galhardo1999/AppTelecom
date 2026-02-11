import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContract } from '../../src/context/ContractContext';
import { bffApi } from '../../src/services/api';

const { width } = Dimensions.get('window');

/**
 * Retorna o ícone e cor da bandeira
 */
function getBrandInfo(brand: string): { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; gradient: string[] } {
    switch (brand) {
        case 'visa': return { icon: 'card', color: '#1A1F71', label: 'Visa', gradient: ['#1a1f71', '#283593'] };
        case 'mastercard': return { icon: 'card', color: '#EB001B', label: 'Mastercard', gradient: ['#eb001b', '#f79e1b'] };
        case 'elo': return { icon: 'card', color: '#00A4E0', label: 'Elo', gradient: ['#00A4E0', '#00416B'] };
        case 'amex': return { icon: 'card', color: '#006FCF', label: 'Amex', gradient: ['#006FCF', '#002663'] };
        default: return { icon: 'card-outline', color: '#64748b', label: 'Cartão', gradient: ['#334155', '#1e293b'] };
    }
}

export default function CobrancaRecorrenteScreen() {
    const router = useRouter();
    const { selectedContract, refreshContracts } = useContract();
    const [loading, setLoading] = useState(false);

    // State for saved card
    const [savedCard, setSavedCard] = useState<{
        brand: string;
        last4: string;
        holder: string;
        expiry: string;
    } | null>(null);

    // Load saved card data from contract
    React.useEffect(() => {
        if (selectedContract?.credit_card_recorrente_numero_cartao) {
            const num = selectedContract.credit_card_recorrente_numero_cartao;
            const brand = selectedContract.credit_card_recorrente_bandeira_cartao?.toLowerCase() || 'mastercard';
            const last4 = num.length > 4 ? num.slice(-4) : num;

            setSavedCard({
                brand,
                last4,
                holder: selectedContract.credit_card_recorrente_nome_cartao || '',
                expiry: selectedContract.credit_card_recorrente_validade_cartao || ''
            });
        } else {
            setSavedCard(null);
        }
    }, [selectedContract]);

    const handleRemoveCard = async () => {
        Alert.alert(
            'Remover Cartão',
            'Deseja remover o cartão recorrente? Suas faturas voltarão a ser cobrança por boleto.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: async () => {
                        if (!selectedContract) return;
                        setLoading(true);
                        try {
                            await bffApi.deleteRecurringCard(selectedContract.id);
                            await refreshContracts();
                            setSavedCard(null);
                            Alert.alert('Sucesso', 'Cartão removido com sucesso.');
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao remover cartão.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
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
                    <Text className="text-slate-800 text-lg font-bold">Pagamento Recorrente</Text>
                    <View className="w-10" />
                </View>

                <ScrollView
                    className="flex-1 px-6 pt-2"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Status Section */}
                    <View className="items-center mb-8 mt-6">
                        <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${savedCard ? 'bg-green-100' : 'bg-slate-100'}`}>
                            <Ionicons
                                name={savedCard ? "checkmark-circle" : "alert-circle"}
                                size={40}
                                color={savedCard ? "#16a34a" : "#94a3b8"}
                            />
                        </View>
                        <Text className="text-slate-800 font-bold text-2xl text-center mb-1">
                            {savedCard ? 'Recorrência Ativa' : 'Recorrência Inativa'}
                        </Text>
                        <Text className="text-slate-500 text-center leading-5 max-w-[80%]">
                            {savedCard
                                ? 'Seu cartão está configurado e suas faturas serão debitadas automaticamente.'
                                : 'Cadastre seu cartão de crédito para pagar suas faturas automaticamente.'}
                        </Text>
                    </View>

                    {/* Saved Card Preview */}
                    {savedCard && (
                        <View className="items-center mb-8">
                            <LinearGradient
                                colors={savedCard ? getBrandInfo(savedCard.brand).gradient : ['#334155', '#1e293b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-full h-56 rounded-2xl p-6 justify-between shadow-2xl"
                                style={{
                                    shadowColor: savedCard ? getBrandInfo(savedCard.brand).gradient[0] : '#000',
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 20,
                                    elevation: 10
                                }}
                            >
                                <View className="flex-row justify-between items-start">
                                    <View>
                                        <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.8)" style={{ transform: [{ rotate: '90deg' }] }} />
                                    </View>
                                    <Text className="text-white font-bold text-lg italic opacity-90">
                                        {getBrandInfo(savedCard.brand).label}
                                    </Text>
                                </View>

                                <View>
                                    <View className="flex-row items-center gap-3 mb-2">
                                        <View className="w-12 h-9 bg-yellow-400/20 rounded-md border border-yellow-200/30" />
                                    </View>
                                    <Text className="text-white text-2xl font-mono tracking-widest shadow-sm">
                                        {`•••• •••• •••• ${savedCard.last4}`}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between items-end">
                                    <View>
                                        <Text className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Titular</Text>
                                        <Text className="text-white font-medium tracking-wide uppercase shadow-sm">
                                            {savedCard.holder}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Validade</Text>
                                        <Text className="text-white font-medium tracking-wide shadow-sm">
                                            {savedCard.expiry}
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>

                            <TouchableOpacity
                                onPress={handleRemoveCard}
                                className="mt-8 bg-red-50 py-4 w-full rounded-xl items-center flex-row justify-center border border-red-100"
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ef4444" />
                                ) : (
                                    <>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" className="mr-2" />
                                        <Text className="text-red-500 font-bold text-lg">Remover Cartão</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Action Button */}
                    {!savedCard && (
                        <TouchableOpacity
                            onPress={() => router.push('/dashboard/cobranca-recorrente-cadastro' as any)}
                            activeOpacity={0.8}
                            className="shadow-lg shadow-purple-200"
                        >
                            <LinearGradient
                                colors={['#a855f7', '#7e22ce']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-4 rounded-xl items-center flex-row justify-center"
                            >
                                <Ionicons name="add-circle-outline" size={24} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Cadastrar Cartão</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Info Section */}
                    {!savedCard && (
                        <View className="mt-8 bg-blue-50 p-6 rounded-2xl">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="shield-checkmark" size={24} color="#3b82f6" className="mr-2" />
                                <Text className="text-blue-800 font-bold text-lg">É seguro?</Text>
                            </View>
                            <Text className="text-blue-700/80 leading-6">
                                Sim! Seus dados são processados diretamente pela Cielo e tokenizados. Nós não armazenamos o número do seu cartão.
                            </Text>
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
