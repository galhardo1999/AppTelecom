import { Ionicons } from '@expo/vector-icons';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
    const [loadingContract, setLoadingContract] = useState(false);

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await ixcApi.getClientContracts(user.id);
            // Filtrar apenas contratos ativos (status = 'A' ou 'ATIVO')
            const activeContracts = data.filter((c: Contract) =>
                c.status?.toUpperCase() === 'A' || c.status?.toUpperCase() === 'ATIVO'
            );
            setContracts(activeContracts);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os contratos.');
        } finally {
            setLoading(false);
        }
    };

    // Mesma lógica do planos.tsx para baixar o PDF do contrato
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

    const InfoRow = ({ icon, iconColor, bgColor, label, value }: {
        icon: keyof typeof Ionicons.glyphMap;
        iconColor: string;
        bgColor: string;
        label: string;
        value: string;
    }) => (
        <View className="flex-row items-center py-3 border-b border-slate-100">
            <View className={`w-10 h-10 ${bgColor} rounded-xl items-center justify-center mr-3`}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-500 text-xs">{label}</Text>
                <Text className="text-slate-800 text-base font-medium">{value || '-'}</Text>
            </View>
        </View>
    );

    // Helper para formatar endereço completo
    const getEnderecoCompleto = (contract: Contract) => {
        const partes = [contract.endereco, contract.numero].filter(Boolean);
        return partes.join(', ') || '-';
    };

    const getCidadeEstado = (contract: Contract) => {
        const partes = [contract.cidade, contract.estado].filter(Boolean);
        return partes.join(' - ') || '-';
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header com Gradiente Padrão */}
            <View className="h-[25%] w-full relative">
                <LinearGradient
                    colors={['#a855f7', '#7e22ce', '#3b0764']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />

                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6">
                    {/* Header Row */}
                    <View className="flex-row items-center py-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-white text-2xl font-bold">Meu Contrato</Text>
                            <Text className="text-white/80 text-sm mt-1">
                                Detalhes do seu contrato ativo
                            </Text>
                        </View>
                        <View className="bg-white/20 p-2 rounded-xl">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 60, height: 22 }}
                                resizeMode="contain"
                                tintColor="white"
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Conteúdo */}
            <View className="flex-1 -mt-12 px-6">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#7c3aed" size="large" />
                        <Text className="text-slate-500 mt-4">Carregando contratos...</Text>
                    </View>
                ) : contracts.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <View className="w-20 h-20 bg-slate-200 rounded-full items-center justify-center mb-4">
                            <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
                        </View>
                        <Text className="text-slate-500 text-lg font-medium">Nenhum contrato ativo</Text>
                        <Text className="text-slate-400 text-sm mt-2">Entre em contato com o suporte</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {contracts.map((contract) => (
                            <View
                                key={contract.id}
                                className="bg-white rounded-2xl shadow-sm mb-4 border border-slate-100 overflow-hidden"
                            >
                                {/* Cabeçalho do Card */}
                                <View className="bg-purple-50 px-5 py-4 border-b border-purple-100">
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-row items-center">
                                            <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-3">
                                                <Ionicons name="document-text" size={24} color="#7c3aed" />
                                            </View>
                                            <View>
                                                <Text className="text-slate-800 text-lg font-bold">
                                                    Contrato #{contract.contrato || contract.id}
                                                </Text>
                                                <View className="flex-row items-center mt-1">
                                                    <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                                    <Text className="text-green-600 text-sm font-medium">Ativo</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-slate-500 text-xs">Valor Mensal</Text>
                                            <Text className="text-purple-600 text-xl font-bold">
                                                {formatCurrency(
                                                    (parseFloat(contract.valor_contrato || '0') > 0
                                                        ? contract.valor_contrato
                                                        : contract.valor) ?? '0'
                                                )}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Botão Download PDF do Contrato */}
                                <View className="px-5 py-4 border-b border-slate-100">
                                    <TouchableOpacity
                                        onPress={() => handleDownloadContract(contract.id)}
                                        disabled={loadingContract}
                                        className="bg-purple-600 rounded-xl py-4 flex-row items-center justify-center active:bg-purple-700"
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

                                {/* Detalhes do Contrato */}
                                <View className="px-5">
                                    <Text className="text-slate-600 text-xs font-semibold uppercase mt-4 mb-2">
                                        Informações do Contrato
                                    </Text>

                                    <InfoRow
                                        icon="finger-print"
                                        iconColor="#64748b"
                                        bgColor="bg-slate-100"
                                        label="ID do Contrato"
                                        value={contract.id}
                                    />

                                    <InfoRow
                                        icon="calendar"
                                        iconColor="#0891b2"
                                        bgColor="bg-cyan-50"
                                        label="Data de Ativação"
                                        value={formatDateFull(contract.data_ativacao)}
                                    />

                                    <InfoRow
                                        icon="location"
                                        iconColor="#7c3aed"
                                        bgColor="bg-purple-50"
                                        label="Endereço"
                                        value={getEnderecoCompleto(contract)}
                                    />

                                    <InfoRow
                                        icon="business"
                                        iconColor="#f59e0b"
                                        bgColor="bg-amber-50"
                                        label="Bairro"
                                        value={contract.bairro || '-'}
                                    />

                                    <InfoRow
                                        icon="map"
                                        iconColor="#3b82f6"
                                        bgColor="bg-blue-50"
                                        label="Cidade / Estado"
                                        value={getCidadeEstado(contract)}
                                    />
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
