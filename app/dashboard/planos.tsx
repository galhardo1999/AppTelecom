
import { Ionicons } from '@expo/vector-icons';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { ixcApi } from '../../src/services/api';
import { Contract } from '../../src/types/ixc';
import { formatCurrency } from '../../src/utils/formatters';

export default function PlanoScreen() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingContract, setLoadingContract] = useState(false);

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
            console.error('Error loading contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadContracts();
        setRefreshing(false);
    };

    const handleDownloadContract = async (contractId: string) => {
        try {
            setLoadingContract(true);
            const base64Pdf = await ixcApi.getContractPdf(contractId);

            if (!base64Pdf) {
                Alert.alert('Indisponível', 'Não foi possível carregar o contrato.');
                return;
            }

            const fileName = `contrato_${contractId}_${Date.now()}.pdf`;
            const file = new ExpoFile(Paths.cache, fileName);

            await file.write(base64Pdf, { encoding: 'base64' });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Meu Contrato - Apollo Telecom',
                });
            } else {
                Alert.alert('Erro', 'Compartilhamento não disponível.');
            }
        } catch (error) {
            console.error('Error downloading contract:', error);
            Alert.alert('Erro', 'Não foi possível baixar o contrato.');
        } finally {
            setLoadingContract(false);
        }
    };

    // Obter contrato principal (primeiro ativo)
    const mainContract = contracts.find(c => c.status === 'A') || contracts[0];

    // Obter informações de status
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'A':
                return { label: 'Ativo', color: 'bg-green-100', textColor: 'text-green-700' };
            case 'I':
                return { label: 'Inativo', color: 'bg-red-100', textColor: 'text-red-700' };
            case 'B':
                return { label: 'Bloqueado', color: 'bg-orange-100', textColor: 'text-orange-700' };
            case 'C':
                return { label: 'Cancelado', color: 'bg-gray-100', textColor: 'text-gray-700' };
            default:
                return { label: status, color: 'bg-slate-100', textColor: 'text-slate-700' };
        }
    };

    // Obter informações de status da internet
    const getInternetStatusInfo = (status: string) => {
        switch (status) {
            case 'A':
                return { label: 'Conectado', icon: 'wifi' as const };
            case 'D':
                return { label: 'Desconectado', icon: 'wifi-outline' as const };
            case 'B':
                return { label: 'Bloqueado', icon: 'lock-closed' as const };
            default:
                return { label: status || 'N/A', icon: 'help-circle' as const };
        }
    };

    // Componente de linha de informação
    const InfoRow = ({ icon, label, value, valueColor }: {
        icon: keyof typeof Ionicons.glyphMap;
        label: string;
        value: string;
        valueColor?: string;
    }) => (
        <View className="flex-row items-center py-3 border-b border-slate-100">
            <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mr-3">
                <Ionicons name={icon} size={20} color="#7c3aed" />
            </View>
            <View className="flex-1">
                <Text className="text-slate-500 text-xs uppercase tracking-wide">{label}</Text>
                <Text className={`font-semibold text-base ${valueColor || 'text-slate-800'}`}>{value}</Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="h-[28%] w-full relative">
                <LinearGradient
                    colors={['#a855f7', '#7e22ce', '#3b0764']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />
                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6 pt-4">
                    <Text className="text-white text-2xl font-bold mb-2">Meu Plano</Text>
                    <Text className="text-white/80 text-base">Detalhes do seu plano de internet</Text>
                </SafeAreaView>
            </View>

            {/* Content */}
            <View className="flex-1 -mt-16 px-6">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#7c3aed" size="large" />
                    </View>
                ) : mainContract ? (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
                        }
                    >
                        {/* Main Plan Card */}
                        <View className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
                            {/* Plan Header */}
                            <LinearGradient
                                colors={['#7c3aed', '#6d28d9']}
                                className="p-5"
                            >
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1">
                                        <Text className="text-white/70 text-sm mb-1">Plano Contratado</Text>
                                        <Text className="text-white text-2xl font-bold">
                                            {mainContract.plano || mainContract.plano_nome || 'Internet Fibra'}
                                        </Text>
                                    </View>
                                    <View className={`${getStatusInfo(mainContract.status).color} px-3 py-1.5 rounded-full`}>
                                        <Text className={`${getStatusInfo(mainContract.status).textColor} font-bold text-xs`}>
                                            {getStatusInfo(mainContract.status).label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Status da Conexão */}
                                <View className="bg-white/10 rounded-xl py-3 px-4 flex-row items-center mt-2">
                                    <Ionicons
                                        name={getInternetStatusInfo(mainContract.status_internet).icon}
                                        size={24}
                                        color="white"
                                    />
                                    <View className="ml-3">
                                        <Text className="text-white/70 text-xs">Status da Conexão</Text>
                                        <Text className="text-white text-lg font-bold">
                                            {getInternetStatusInfo(mainContract.status_internet).label}
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>

                            {/* Plan Details */}
                            <View className="p-5">
                                <InfoRow
                                    icon="person-outline"
                                    label="Titular"
                                    value={user?.razao || 'Cliente'}
                                />

                                {mainContract.data_ativacao && (
                                    <InfoRow
                                        icon="calendar-outline"
                                        label="Data de Ativação"
                                        value={new Date(mainContract.data_ativacao).toLocaleDateString('pt-BR')}
                                    />
                                )}

                                <InfoRow
                                    icon="document-text-outline"
                                    label="Número do Contrato"
                                    value={`#${mainContract.id}`}
                                />

                                <InfoRow
                                    icon="cash-outline"
                                    label="Valor Mensal"
                                    value={formatCurrency(mainContract.valor_contrato || mainContract.valor || '0')}
                                    valueColor="text-purple-700"
                                />

                                <InfoRow
                                    icon="card-outline"
                                    label="Forma de Pagamento"
                                    value={mainContract.forma_pagamento || 'Boleto/PIX'}
                                />
                            </View>
                        </View>

                        {/* Location Card */}
                        <View className="bg-white rounded-2xl p-5 shadow-md mb-4">
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3">
                                    <Ionicons name="location" size={20} color="#3b82f6" />
                                </View>
                                <Text className="text-slate-800 font-bold text-lg">Localidade</Text>
                            </View>
                            <Text className="text-slate-600 text-base leading-6">
                                {mainContract.endereco || user?.endereco || 'Endereço não informado'}
                            </Text>
                        </View>

                        {/* Download Contract Button */}
                        <TouchableOpacity
                            className="bg-purple-600 rounded-2xl p-5 shadow-md mb-4 flex-row items-center justify-center"
                            onPress={() => handleDownloadContract(mainContract.id)}
                            disabled={loadingContract}
                        >
                            {loadingContract ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="document-text" size={22} color="white" />
                                    </View>
                                    <Text className="text-white font-bold text-lg">Meu Contrato</Text>
                                    <View className="flex-1" />
                                    <Ionicons name="download-outline" size={24} color="white" />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Multiple contracts notice */}
                        {contracts.length > 1 && (
                            <View className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                <View className="flex-row items-center">
                                    <Ionicons name="information-circle" size={20} color="#7c3aed" />
                                    <Text className="text-purple-700 font-medium ml-2">
                                        Você possui {contracts.length} contratos
                                    </Text>
                                </View>
                                <Text className="text-purple-600 text-sm mt-1 ml-7">
                                    Mostrando o contrato principal ativo.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <View className="bg-white rounded-2xl p-8 items-center shadow-md">
                            <Ionicons name="wifi-outline" size={64} color="#cbd5e1" />
                            <Text className="text-slate-500 text-lg font-medium mt-4">Nenhum plano encontrado</Text>
                            <Text className="text-slate-400 text-center mt-2">
                                Entre em contato com o suporte para mais informações.
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}
