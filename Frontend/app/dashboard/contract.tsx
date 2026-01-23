import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { ixcApi } from '../../src/services/api';
import { Contract } from '../../src/types/ixc';
import { formatCurrency, formatDateFull } from '../../src/utils/formatters';

export default function ContractScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await ixcApi.getClientContracts(user.id);
            setContracts(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os contratos.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'A':
            case 'ATIVO':
                return { bg: 'bg-green-100', text: 'text-green-700', label: 'Ativo' };
            case 'I':
            case 'INATIVO':
                return { bg: 'bg-red-100', text: 'text-red-700', label: 'Inativo' };
            case 'S':
            case 'SUSPENSO':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Suspenso' };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-700', label: status || '-' };
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header with Gradient */}
            <View className="h-[180px] w-full relative">
                <LinearGradient
                    colors={['#2e1065', '#9333ea', '#f97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />

                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6">
                    {/* Header Row */}
                    <View className="flex-row items-center py-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-2xl font-bold">Meu Contrato</Text>
                    </View>

                    {/* Subtitle */}
                    <Text className="text-white/80 text-base mt-2">
                        Detalhes dos seus contratos ativos
                    </Text>
                </SafeAreaView>
            </View>

            {/* Content */}
            <View className="flex-1 -mt-8 px-6">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#7c3aed" size="large" />
                    </View>
                ) : contracts.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <View className="w-20 h-20 bg-slate-200 rounded-full items-center justify-center mb-4">
                            <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
                        </View>
                        <Text className="text-slate-500 text-lg font-medium">Nenhum contrato encontrado</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {contracts.map((contract) => {
                            const statusInfo = getStatusColor(contract.status);
                            return (
                                <View
                                    key={contract.id}
                                    className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100"
                                >
                                    {/* Contract Header */}
                                    <View className="flex-row justify-between items-start mb-4">
                                        <View className="flex-1">
                                            <Text className="text-slate-800 text-lg font-bold mb-1">
                                                Contrato #{contract.contrato || contract.id}
                                            </Text>
                                            <View className={`self-start px-3 py-1 rounded-full ${statusInfo.bg}`}>
                                                <Text className={`text-sm font-semibold ${statusInfo.text}`}>
                                                    {statusInfo.label}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-slate-500 text-xs">Valor Mensal</Text>
                                            <Text className="text-purple-600 text-xl font-bold">
                                                {formatCurrency((parseFloat(contract.valor_contrato || '0') > 0 ? contract.valor_contrato : contract.valor) ?? '0')}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Divider */}
                                    <View className="h-px bg-slate-100 my-3" />

                                    {/* Speed Info */}
                                    <View className="flex-row mb-4">
                                        <View className="flex-1 flex-row items-center">
                                            <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-3">
                                                <Ionicons name="arrow-down" size={20} color="#22c55e" />
                                            </View>
                                            <View>
                                                <Text className="text-slate-500 text-xs">Download</Text>
                                                <Text className="text-slate-800 text-base font-bold">
                                                    {contract.download || '-'} Mbps
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="flex-1 flex-row items-center">
                                            <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                                                <Ionicons name="arrow-up" size={20} color="#3b82f6" />
                                            </View>
                                            <View>
                                                <Text className="text-slate-500 text-xs">Upload</Text>
                                                <Text className="text-slate-800 text-base font-bold">
                                                    {contract.upload || '-'} Mbps
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Details Grid */}
                                    <View className="bg-slate-50 rounded-xl p-4">
                                        <View className="flex-row mb-3">
                                            <View className="flex-1">
                                                <Text className="text-slate-500 text-xs mb-1">Data de Ativação</Text>
                                                <Text className="text-slate-800 font-medium">
                                                    {formatDateFull(contract.data_ativacao)}
                                                </Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-slate-500 text-xs mb-1">Status Internet</Text>
                                                <Text className="text-slate-800 font-medium">
                                                    {contract.status_internet || '-'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="flex-row">
                                            <View className="flex-1">
                                                <Text className="text-slate-500 text-xs mb-1">Forma de Pagamento</Text>
                                                <Text className="text-slate-800 font-medium">
                                                    {contract.forma_pagamento || '-'}
                                                </Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-slate-500 text-xs mb-1">ID do Plano</Text>
                                                <Text className="text-slate-800 font-medium">
                                                    {contract.id_plano || '-'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
