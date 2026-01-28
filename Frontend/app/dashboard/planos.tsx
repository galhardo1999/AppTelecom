
import { Ionicons } from '@expo/vector-icons';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { ixcApi } from '../../src/services/api';
import { Contract } from '../../src/types/ixc';
import { formatCurrency } from '../../src/utils/formatters';

export default function PlanoScreen() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingContract, setLoadingContract] = useState(false);
    const [showContractPicker, setShowContractPicker] = useState(false);

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await ixcApi.getClientContracts(user.id);
            setContracts(data);
            // Selecionar o primeiro contrato ativo por padrão
            const activeContract = data.find((c: Contract) => c.status === 'A') || data[0];
            if (activeContract) {
                setSelectedContractId(activeContract.id);
            }
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

    const selectContract = (id: string) => {
        setSelectedContractId(id);
        setShowContractPicker(false);
    };

    // Contrato selecionado atualmente
    const selectedContract = contracts.find(c => c.id === selectedContractId);

    // Obter informações de status
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'A':
                return { label: 'Ativo', color: 'bg-green-100', textColor: 'text-green-700', dotColor: 'bg-green-500' };
            case 'I':
                return { label: 'Inativo', color: 'bg-red-100', textColor: 'text-red-700', dotColor: 'bg-red-500' };
            case 'B':
                return { label: 'Bloqueado', color: 'bg-orange-100', textColor: 'text-orange-700', dotColor: 'bg-orange-500' };
            case 'C':
                return { label: 'Cancelado', color: 'bg-gray-100', textColor: 'text-gray-700', dotColor: 'bg-gray-500' };
            default:
                return { label: status, color: 'bg-slate-100', textColor: 'text-slate-700', dotColor: 'bg-slate-500' };
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
                ) : selectedContract ? (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
                        }
                    >
                        {/* Detalhes do Contrato Selecionado */}
                        <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-slate-100">
                            {/* Header do Contrato com seletor */}
                            <View className="bg-purple-50 px-5 py-4 border-b border-purple-100">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-3">
                                            <Ionicons name="document-text" size={24} color="#7c3aed" />
                                        </View>
                                        <View className="flex-1">
                                            {/* Botão dropdown se tiver mais de 1 contrato */}
                                            {contracts.length > 1 ? (
                                                <TouchableOpacity
                                                    onPress={() => setShowContractPicker(true)}
                                                    className="flex-row items-center"
                                                >
                                                    <Text className="text-slate-800 text-lg font-bold">
                                                        Contrato #{selectedContract.id}
                                                    </Text>
                                                    <Ionicons name="chevron-down" size={20} color="#7c3aed" style={{ marginLeft: 4 }} />
                                                </TouchableOpacity>
                                            ) : (
                                                <Text className="text-slate-800 text-lg font-bold">
                                                    Contrato #{selectedContract.id}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${getStatusInfo(selectedContract.status).color}`}>
                                            <View className={`w-2 h-2 rounded-full mr-2 ${getStatusInfo(selectedContract.status).dotColor}`} />
                                            <Text className={`text-sm font-bold ${getStatusInfo(selectedContract.status).textColor}`}>
                                                {getStatusInfo(selectedContract.status).label}
                                            </Text>
                                        </View>
                                        {contracts.length > 1 && (
                                            <Text className="text-slate-400 text-xs mt-1">
                                                {contracts.length} contratos
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Informações do Contrato */}
                            <View className="p-5">
                                <InfoRow
                                    icon="person-outline"
                                    label="Titular"
                                    value={user?.razao || 'Cliente'}
                                />

                                {selectedContract.data_ativacao && (
                                    <InfoRow
                                        icon="calendar-outline"
                                        label="Data de Ativação"
                                        value={new Date(selectedContract.data_ativacao).toLocaleDateString('pt-BR')}
                                    />
                                )}

                                <InfoRow
                                    icon="card-outline"
                                    label="Forma de Pagamento"
                                    value={selectedContract.forma_pagamento || 'Boleto/PIX'}
                                />

                                {(selectedContract.endereco || user?.endereco) && (
                                    <View className="py-3 border-b border-slate-100">
                                        <View className="flex-row items-center">
                                            <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mr-3">
                                                <Ionicons name="location" size={20} color="#7c3aed" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-slate-500 text-xs uppercase tracking-wide">Endereço</Text>
                                                <Text className="font-semibold text-base text-slate-800">
                                                    {selectedContract.endereco || user?.endereco}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Botão Download PDF - no final */}
                                <TouchableOpacity
                                    onPress={() => handleDownloadContract(selectedContract.id)}
                                    disabled={loadingContract}
                                    className="bg-purple-600 rounded-xl py-4 mt-4 flex-row items-center justify-center active:bg-purple-700"
                                >
                                    {loadingContract ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="document-attach" size={22} color="white" />
                                            <Text className="text-white font-bold text-base ml-3">
                                                Baixar Contrato em PDF
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
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

            {/* Modal de Seleção de Contrato */}
            <Modal
                visible={showContractPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowContractPicker(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl">
                        <View className="p-5 border-b border-slate-100">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-xl font-bold text-slate-800">Selecione o Contrato</Text>
                                <TouchableOpacity onPress={() => setShowContractPicker(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <ScrollView className="max-h-80">
                            {contracts.map((contract) => {
                                const isSelected = contract.id === selectedContractId;
                                const statusInfo = getStatusInfo(contract.status);
                                return (
                                    <TouchableOpacity
                                        key={contract.id}
                                        onPress={() => selectContract(contract.id)}
                                        className={`flex-row items-center p-4 border-b border-slate-100 ${isSelected ? 'bg-purple-50' : 'bg-white'
                                            }`}
                                    >
                                        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isSelected ? 'bg-purple-600' : 'bg-slate-100'
                                            }`}>
                                            <Ionicons
                                                name="document-text"
                                                size={20}
                                                color={isSelected ? 'white' : '#64748b'}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`font-bold text-base ${isSelected ? 'text-purple-700' : 'text-slate-700'}`}>
                                                Contrato #{contract.id}
                                            </Text>
                                            <View className="flex-row items-center mt-1">
                                                <View className={`w-2 h-2 rounded-full mr-2 ${statusInfo.dotColor}`} />
                                                <Text className={`text-sm ${statusInfo.textColor}`}>
                                                    {statusInfo.label}
                                                </Text>
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={24} color="#7c3aed" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <View className="p-5">
                            <TouchableOpacity
                                onPress={() => setShowContractPicker(false)}
                                className="bg-slate-100 rounded-xl py-4 items-center"
                            >
                                <Text className="text-slate-600 font-semibold">Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
