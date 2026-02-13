
import { Ionicons } from '@expo/vector-icons';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ContractPickerModal } from '../../src/components/ContractPickerModal';
import { GradientHeader } from '../../src/components/GradientHeader';
import { useAuth } from '../../src/context/AuthContext';
import { useContract } from '../../src/context/ContractContext';
import { bffApi } from '../../src/services/api';
import { Contract } from '../../src/types/ixc';
import { logger } from '../../src/utils/logger';



export default function PlanoScreen() {
    const { user } = useAuth();
    const { contracts, selectedContract, setSelectedContract, loading } = useContract();
    const [refreshing, setRefreshing] = useState(false);
    const [loadingContract, setLoadingContract] = useState(false);
    const [showContractPicker, setShowContractPicker] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        // O contexto não tem refresh, mas podemos simular um delay
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleDownloadContract = async (contractId: string) => {
        try {
            setLoadingContract(true);
            const base64Pdf = await bffApi.getContractPdf(contractId);

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
            logger.error('Error downloading contract:', error);
            Alert.alert('Erro', 'Não foi possível baixar o contrato.');
        } finally {
            setLoadingContract(false);
        }
    };

    const selectContract = (contract: Contract) => {
        setSelectedContract(contract);
        setShowContractPicker(false);
    };

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
            <GradientHeader title="Meu Plano" subtitle="Detalhes do seu plano de internet" />

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
                                        <View>
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
                                    <View className="flex-row items-center">
                                        {contracts.length > 1 && (
                                            <Text className="text-slate-400 text-xs ml-4 mr-3">
                                                {contracts.length} contratos
                                            </Text>
                                        )}
                                        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${getStatusInfo(selectedContract.status).color}`}>
                                            <View className={`w-2 h-2 rounded-full mr-2 ${getStatusInfo(selectedContract.status).dotColor}`} />
                                            <Text className={`text-sm font-bold ${getStatusInfo(selectedContract.status).textColor}`}>
                                                {getStatusInfo(selectedContract.status).label}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Informações do Contrato */}
                            <View className="p-5">
                                {/* Meu Plano */}
                                <InfoRow
                                    icon="wifi-outline"
                                    label="Meu Plano"
                                    value={selectedContract.contrato || selectedContract.id}
                                />

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

                                {/* Endereço concatenado com número */}
                                {selectedContract.endereco && (
                                    <InfoRow
                                        icon="location-outline"
                                        label="Endereço"
                                        value={`${selectedContract.endereco}, ${selectedContract.numero || 'S/N'}`}
                                    />
                                )}

                                {/* Bairro */}
                                {selectedContract.bairro && (
                                    <InfoRow
                                        icon="map-outline"
                                        label="Bairro"
                                        value={selectedContract.bairro}
                                    />
                                )}

                                {/* Cidade */}
                                {selectedContract.cidade && (
                                    <InfoRow
                                        icon="business-outline"
                                        label="Cidade"
                                        value={`${selectedContract.cidade}${selectedContract.estado ? ` - ${selectedContract.estado}` : ''}`}
                                    />
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
            <ContractPickerModal
                visible={showContractPicker}
                contracts={contracts}
                selectedContractId={selectedContract?.id || null}
                onSelect={selectContract}
                onClose={() => setShowContractPicker(false)}
            />
        </View>
    );
}
