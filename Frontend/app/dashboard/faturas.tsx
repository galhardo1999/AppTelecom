import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { SkeletonInvoiceHeader } from '../../src/components/Skeleton';
import { ErrorState } from '../../src/components/StateComponents';
import { useAuth } from '../../src/context/AuthContext';
import { useContract } from '../../src/context/ContractContext';
import { useInvoiceHistory } from '../../src/hooks/useQueries';
import { bffApi } from '../../src/services/api';
import { Contract, Invoice } from '../../src/types/ixc';
import { formatCurrency, formatDateShort, getFirstName, getMonthName, getMonthYear } from '../../src/utils/formatters';
import { showToast } from '../../src/utils/toast';

type TabType = 'vencidas' | 'abertas' | 'pagas';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FaturasScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { contracts, selectedContract, selectedContractId, setSelectedContract } = useContract();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('vencidas');
    const [showContractPicker, setShowContractPicker] = useState(false);

    // Obter primeiro nome para saudação
    const firstName = getFirstName(user?.razao);

    // Usar query de histórico de faturas
    const { data: invoiceData, isLoading: loading, isError, refetch } = useInvoiceHistory();

    // Obter fatura do mês atual (apenas a fatura aberta mais recente do mês atual)
    const getCurrentMonthInvoice = (invoices: Invoice[]): Invoice[] => {
        if (!invoices || invoices.length === 0) return [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Encontrar fatura do mês atual
        const currentMonthInvoice = invoices.find(inv => {
            const dueDate = new Date(inv.data_vencimento);
            return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        });

        // Se não houver fatura do mês atual, retornar a primeira (mais recente)
        return currentMonthInvoice ? [currentMonthInvoice] : [invoices[0]];
    };

    // Obter faturas para a aba atual filtradas por contrato
    const getInvoicesForTab = (): Invoice[] => {
        if (!invoiceData) return [];

        let invoices: Invoice[] = [];
        switch (activeTab) {
            case 'abertas':
                // Mostrar apenas fatura do mês atual (1 fatura)
                invoices = getCurrentMonthInvoice(invoiceData.abertas || []);
                break;
            case 'vencidas':
                invoices = invoiceData.vencidas || [];
                break;
            case 'pagas':
                invoices = invoiceData.pagas || [];
                break;
            default:
                invoices = [];
        }

        // Filtrar por contrato selecionado se houver
        if (selectedContractId && invoices.length > 0) {
            return invoices.filter(inv => inv.id_contrato === selectedContractId);
        }

        return invoices;
    };

    const currentInvoices = getInvoicesForTab();

    // Definir fatura selecionada padrão quando dados carregam ou aba muda
    useEffect(() => {
        if (currentInvoices.length > 0) {
            setSelectedInvoice(currentInvoices[0]);
        } else {
            setSelectedInvoice(null);
        }
    }, [invoiceData, activeTab, selectedContractId]);

    // Auto-redirecionar para aba Vencidas se houver faturas vencidas ao ganhar foco
    useFocusEffect(
        useCallback(() => {
            if (invoiceData && invoiceData.vencidas?.length > 0) {
                setActiveTab('vencidas');
            }
        }, [invoiceData])
    );

    // Badges de contador das abas (filtradas por contrato)
    const getTabCount = (tab: TabType): number => {
        if (!invoiceData) return 0;

        let invoices: Invoice[] = [];
        if (tab === 'abertas') {
            // Mostrar 1 para fatura do mês atual se existir
            invoices = getCurrentMonthInvoice(invoiceData.abertas || []);
        } else {
            invoices = invoiceData[tab] || [];
        }

        // Filtrar por contrato selecionado se houver
        if (selectedContractId && invoices.length > 0) {
            invoices = invoices.filter(inv => inv.id_contrato === selectedContractId);
        }

        return invoices.length;
    };

    // Tratar estado de erro
    if (isError) {
        return (
            <View className="flex-1 bg-slate-50">
                <ErrorState
                    title="Erro ao carregar faturas"
                    message="Não foi possível buscar suas faturas. Verifique sua conexão."
                    onRetry={() => refetch()}
                />
            </View>
        );
    }

    const [loadingPix, setLoadingPix] = useState(false);
    const [loadingBoleto, setLoadingBoleto] = useState(false);
    const [showBoletoModal, setShowBoletoModal] = useState(false);
    const [boletoBase64, setBoletoBase64] = useState<string | null>(null);

    const handleCopyBarcode = async () => {
        if (selectedInvoice?.linha_digitavel) {
            await Clipboard.setStringAsync(selectedInvoice.linha_digitavel);
            showToast('Código de barras copiado!');
        } else {
            Alert.alert('Indisponível', 'Linha digitável não encontrada para esta fatura.');
        }
    };

    const handlePix = async () => {
        if (!selectedInvoice?.id) {
            Alert.alert('Erro', 'Nenhuma fatura selecionada.');
            return;
        }

        // Primeiro verificar se já temos o código PIX nos dados da fatura
        if (selectedInvoice.pix_copia_cola) {
            await Clipboard.setStringAsync(selectedInvoice.pix_copia_cola);
            showToast('Código PIX copiado!');
            return;
        }

        // Caso contrário, buscar da API
        try {
            setLoadingPix(true);
            const pixCode = await bffApi.getPixCode(selectedInvoice.id);

            if (pixCode) {
                await Clipboard.setStringAsync(pixCode);
                showToast('Código PIX copiado!');
            } else {
                Alert.alert('Indisponível', 'Código PIX não encontrado para esta fatura.');
            }
        } catch (error) {
            console.error('Error fetching PIX:', error);
            Alert.alert('Erro', 'Não foi possível obter o código PIX. Tente novamente.');
        } finally {
            setLoadingPix(false);
        }
    };

    const saveAndSharePdf = async (base64Data: string) => {
        if (!selectedInvoice) return;
        try {
            const fileName = `boleto_${selectedInvoice.id}_${Date.now()}.pdf`;
            const file = new ExpoFile(Paths.cache, fileName);
            console.log('Saving boleto to:', file.uri);

            await file.write(base64Data, { encoding: 'base64' });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Fatura Apollo Telecom',
                });
            } else {
                Alert.alert('Erro', 'Compartilhamento não disponível.');
            }
        } catch (error) {
            console.error('Error saving/sharing PDF:', error);
            Alert.alert('Erro', 'Falha ao processar o arquivo PDF.');
        }
    };

    const fetchBoleto = async () => {
        if (!selectedInvoice?.id) {
            Alert.alert('Erro', 'Nenhuma fatura selecionada.');
            return;
        }

        try {
            setLoadingBoleto(true);
            const base64Pdf = await bffApi.getBoleto(selectedInvoice.id);

            if (base64Pdf) {
                console.log('PDF received. Size:', base64Pdf.length);

                // No Android, WebView não consegue renderizar PDF/Base64 local diretamente.
                // Melhor prática é salvar e abrir com ação de visualização externa.
                if (Platform.OS === 'android') {
                    await saveAndSharePdf(base64Pdf);
                } else {
                    // No iOS, WebView funciona bem para PDF
                    setBoletoBase64(base64Pdf);
                    setShowBoletoModal(true);
                }
            } else {
                Alert.alert('Indisponível', 'Não foi possível gerar o boleto para esta fatura.');
            }
        } catch (error) {
            console.error('Error fetching boleto:', error);
            Alert.alert('Erro', 'Não foi possível carregar o boleto. Tente novamente.');
        } finally {
            setLoadingBoleto(false);
        }
    };

    const handleBoletoAction = () => {
        fetchBoleto();
    };

    const handleSharePdfFromModal = () => {
        if (boletoBase64) {
            saveAndSharePdf(boletoBase64);
        }
    };

    // Obter label e cor do status
    const getStatusInfo = () => {
        switch (activeTab) {
            case 'abertas':
                return { label: 'Fatura Aberta', color: '#7c3aed' };
            case 'vencidas':
                return { label: 'Fatura Vencida', color: '#ef4444' };
            case 'pagas':
                return { label: 'Fatura Paga', color: '#22c55e' };
        }
    };

    const statusInfo = getStatusInfo();
    const isPaid = activeTab === 'pagas';

    // Componente de botão de aba
    const TabButton = ({ tab, label }: { tab: TabType; label: string }) => {
        const isActive = activeTab === tab;
        const count = getTabCount(tab);

        // Estilos baseados no estado ativo/inativo
        let containerStyle = isActive ? 'bg-white shadow-sm' : 'bg-transparent';
        let textStyle = isActive
            ? (tab === 'vencidas' ? 'text-red-600' : tab === 'pagas' ? 'text-green-600' : 'text-purple-700')
            : 'text-white/80';

        let badgeContainerStyle = isActive
            ? (tab === 'vencidas' ? 'bg-red-500' : tab === 'pagas' ? 'bg-green-500' : 'bg-purple-500')
            : 'bg-white/20';

        let badgeTextStyle = isActive ? 'text-white' : 'text-white';

        // Não mostrar badge de quantidade para aba Pagas
        const showBadge = tab !== 'pagas' && count > 0;

        return (
            <TouchableOpacity
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-full flex-row items-center justify-center ${containerStyle}`}
            >
                <Text className={`font-bold text-sm ${textStyle}`}>{label}</Text>
                {showBadge && (
                    <View className={`ml-1.5 w-5 h-5 rounded-full items-center justify-center ${badgeContainerStyle}`}>
                        <Text className={`text-[10px] font-bold ${badgeTextStyle}`}>
                            {count}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Seção Superior com Gradiente */}
            <View className="h-[58%] w-full relative">
                <LinearGradient
                    colors={activeTab === 'vencidas'
                        ? ['#dc2626', '#991b1b', '#450a0a']
                        : activeTab === 'pagas'
                            ? ['#16a34a', '#15803d', '#14532d']
                            : ['#a855f7', '#7e22ce', '#3b0764']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />

                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6">
                    {/* Cabeçalho: Logo + Ações */}
                    <View className="flex-row justify-between items-center py-2">
                        <View className="bg-white/20 p-2 rounded-xl">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 80, height: 30 }}
                                resizeMode="contain"
                                tintColor="white"
                            />
                        </View>
                        <TouchableOpacity onPress={() => router.push('/dashboard/perfil')}>
                            <Ionicons name="settings-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Saudação */}
                    <View className="mt-4 mb-3">
                        <Text className="text-white text-lg font-medium">Olá, {firstName}</Text>
                    </View>

                    {/* Seletor de Contrato */}
                    {contracts.length > 1 && (
                        <TouchableOpacity
                            onPress={() => setShowContractPicker(true)}
                            className="bg-white/10 rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center flex-1 mr-2">
                                <Ionicons name="document-text-outline" size={20} color="white" />
                                <Text className="text-white font-semibold ml-2" numberOfLines={1}>
                                    {contracts.find(c => c.id === selectedContractId)?.descricao_aux_plano_venda ||
                                        `${contracts.find(c => c.id === selectedContractId)?.contrato || selectedContractId}`}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={20} color="white" />
                        </TouchableOpacity>
                    )}

                    {/* Abas */}
                    <View className="flex-row bg-black/10 rounded-full p-1 mb-4">
                        <TabButton tab="vencidas" label="Vencidas" />
                        <TabButton tab="abertas" label="Abertas" />
                        <TabButton tab="pagas" label="Pagas" />
                    </View>

                    {/* Área de Conteúdo Principal - Vazio para aba Pagas */}
                    {loading ? (
                        <SkeletonInvoiceHeader />
                    ) : isPaid ? (
                        /* Aba Pagas - área vazia, histórico abaixo */
                        null
                    ) : selectedInvoice ? (
                        <View className="flex-1 relative">
                            {/* Seletor */}
                            <Text className="text-white/80 text-sm mb-2">Selecionar Fatura:</Text>
                            <TouchableOpacity
                                onPress={() => setShowPicker(true)}
                                className="bg-white rounded-xl flex-row items-center justify-between px-4 py-3 mb-4 shadow-lg"
                            >
                                <View className="flex-row items-center space-x-2">
                                    <Ionicons name="wifi" size={20} color="#7c3aed" />
                                    <Text className="text-slate-700 font-semibold text-base">
                                        {getMonthYear(selectedInvoice.data_vencimento)}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#cbd5e1" />
                            </TouchableOpacity>

                            {/* Informações de Detalhes */}
                            <View className="flex-row items-center space-x-2 mb-2">
                                <Ionicons name="location-outline" size={16} color="white" />
                                <Text className="text-white font-medium text-xs uppercase tracking-wide">
                                    {user?.endereco || 'Endereço Principal'}
                                </Text>
                            </View>

                            {/* Exibição de Valor Grande */}
                            <View className="mt-2">
                                <Text className="text-white text-5xl font-bold tracking-tighter">
                                    {formatCurrency(selectedInvoice.valor)}
                                </Text>
                                <View className="flex-row justify-between items-center mt-2 pr-4">
                                    <Text className="text-white/90 text-base font-medium">{statusInfo.label}</Text>
                                    <Text className="text-white/80 text-sm">
                                        Vencimento: {formatDateShort(selectedInvoice.data_vencimento)}
                                    </Text>
                                </View>
                            </View>

                            {/* Marca d'água Nome do Mês */}
                            <View className="absolute bottom-6 right-0 w-[150%] opacity-10 pointer-events-none z-0">
                                <Text className="text-white text-6xl font-bold uppercase text-right pr-6" numberOfLines={1}>
                                    {getMonthName(selectedInvoice.data_vencimento)}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View className="flex-1 justify-center items-center">
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={64}
                                color="white"
                            />
                            <Text className="text-white text-lg font-bold mt-4">
                                Tudo em dia!
                            </Text>
                            <Text className="text-white/70 text-center mt-2">
                                Você não possui faturas {activeTab === 'abertas' ? 'abertas' : 'vencidas'}.
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </View>

            {/* Conteúdo - Diferente para aba Pagas (Histórico) */}
            {isPaid ? (
                /* Layout de Histórico para Faturas Pagas */
                <View className="flex-1 -mt-56 px-6 pb-6">
                    <View className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1">
                        {/* Cabeçalho do Histórico */}
                        <View className="px-5 py-4 border-b border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                    </View>
                                    <View>
                                        <Text className="text-slate-800 font-bold text-lg">Histórico de Pagamentos</Text>
                                        <Text className="text-slate-500 text-sm">{currentInvoices.length} faturas pagas</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Lista de Faturas Pagas */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: 8 }}
                            className="flex-1"
                        >
                            {currentInvoices.length > 0 ? (
                                currentInvoices.map((inv, index) => (
                                    <TouchableOpacity
                                        key={inv.id}
                                        className={`mx-4 my-2 p-4 rounded-xl border ${selectedInvoice?.id === inv.id
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-slate-50 border-slate-100'
                                            }`}
                                        onPress={() => setSelectedInvoice(inv)}
                                    >
                                        <View className="flex-row justify-between items-center">
                                            <View className="flex-row items-center flex-1">
                                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${selectedInvoice?.id === inv.id ? 'bg-green-200' : 'bg-slate-200'
                                                    }`}>
                                                    <Ionicons
                                                        name="receipt-outline"
                                                        size={20}
                                                        color={selectedInvoice?.id === inv.id ? '#16a34a' : '#64748b'}
                                                    />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className={`font-semibold text-base ${selectedInvoice?.id === inv.id ? 'text-green-700' : 'text-slate-700'
                                                        }`}>
                                                        {getMonthYear(inv.data_vencimento)}
                                                    </Text>
                                                    <Text className="text-slate-500 text-xs">
                                                        Pago em {formatDateShort(inv.data_pagamento || inv.data_vencimento)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className={`font-bold text-base ${selectedInvoice?.id === inv.id ? 'text-green-700' : 'text-slate-800'
                                                    }`}>
                                                    {formatCurrency(inv.valor)}
                                                </Text>
                                                <View className="flex-row items-center mt-1">
                                                    <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                                                    <Text className="text-green-600 text-xs font-medium">Pago</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="flex-1 justify-center items-center py-10">
                                    <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
                                        <Ionicons name="wallet-outline" size={36} color="#94a3b8" />
                                    </View>
                                    <Text className="text-slate-500 text-center">
                                        Nenhuma fatura paga encontrada.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            ) : (
                <View className="flex-1 mt-8 px-6 pb-6">
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {/* Mostrar botões de ação apenas para faturas não pagas */}
                        {!isPaid && selectedInvoice && (
                            <>
                                {/* Botão Copiar Código de Barras */}
                                <TouchableOpacity
                                    className="bg-white rounded-xl p-4 shadow-sm mb-3 flex-row items-center active:bg-slate-50 border border-slate-100"
                                    onPress={handleCopyBarcode}
                                    disabled={!selectedInvoice}
                                >
                                    <View className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center mr-4">
                                        <Ionicons name="barcode-outline" size={24} color="#64748b" />
                                    </View>
                                    <Text className="text-slate-700 font-bold text-lg flex-1">Copiar Código de Barras</Text>
                                </TouchableOpacity>

                                {/* Botão Segunda Via */}
                                <TouchableOpacity
                                    className="bg-white rounded-xl p-4 shadow-sm mb-3 flex-row items-center active:bg-slate-50 border border-slate-100"
                                    onPress={handleBoletoAction}
                                    disabled={!selectedInvoice || loadingBoleto}
                                >
                                    <View className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center mr-4">
                                        {loadingBoleto ? (
                                            <ActivityIndicator size="small" color="#64748b" />
                                        ) : (
                                            <Ionicons name="document-text-outline" size={24} color="#64748b" />
                                        )}
                                    </View>
                                    <Text className="text-slate-700 font-bold text-lg flex-1">
                                        {loadingBoleto ? 'Gerando PDF...' : 'Segunda via de Fatura'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Botão PIX */}
                                <TouchableOpacity
                                    className="bg-white rounded-xl p-4 shadow-sm mb-3 flex-row items-center active:bg-slate-50 border border-slate-100"
                                    onPress={handlePix}
                                    disabled={!selectedInvoice || loadingPix}
                                >
                                    <View className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center mr-4">
                                        {loadingPix ? (
                                            <ActivityIndicator size="small" color="#64748b" />
                                        ) : (
                                            <Ionicons name="qr-code-outline" size={24} color="#64748b" />
                                        )}
                                    </View>
                                    <Text className="text-slate-700 font-bold text-lg flex-1">
                                        {loadingPix ? 'Buscando PIX...' : 'Copiar Código PIX'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Para faturas pagas, mostrar opção de baixar comprovante */}
                        {isPaid && selectedInvoice && (
                            <TouchableOpacity
                                className="bg-white rounded-xl p-4 shadow-sm mb-3 flex-row items-center active:bg-slate-50 border border-slate-100"
                                onPress={handleBoletoAction}
                                disabled={!selectedInvoice || loadingBoleto}
                            >
                                <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
                                    {loadingBoleto ? (
                                        <ActivityIndicator size="small" color="#22c55e" />
                                    ) : (
                                        <Ionicons name="receipt-outline" size={24} color="#22c55e" />
                                    )}
                                </View>
                                <Text className="text-slate-700 font-bold text-lg flex-1">
                                    {loadingBoleto ? 'Gerando...' : 'Baixar Comprovante'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Dica de estado vazio */}
                        {!selectedInvoice && !loading && (
                            <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 items-center">
                                <Ionicons
                                    name="checkmark-done-circle-outline"
                                    size={48}
                                    color="#94a3b8"
                                />
                                <Text className="text-slate-500 text-center mt-4">
                                    Parabéns! Você está em dia com todos os pagamentos.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Modal Seletor */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showPicker}
                onRequestClose={() => setShowPicker(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/50 justify-end"
                    activeOpacity={1}
                    onPress={() => setShowPicker(false)}
                >
                    <View className="bg-white rounded-t-3xl p-6 h-[50%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-800">Selecionar Fatura</Text>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <Ionicons name="close-circle" size={30} color="#cbd5e1" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {currentInvoices.map((inv) => (
                                <TouchableOpacity
                                    key={inv.id}
                                    className={`p-4 rounded-xl border mb-3 flex-row justify-between items-center ${selectedInvoice?.id === inv.id ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-100'}`}
                                    onPress={() => {
                                        setSelectedInvoice(inv);
                                        setShowPicker(false);
                                    }}
                                >
                                    <View>
                                        <Text className={`font-bold text-base ${selectedInvoice?.id === inv.id ? 'text-purple-700' : 'text-slate-700'}`}>
                                            {getMonthYear(inv.data_vencimento)}
                                        </Text>
                                        <Text className="text-slate-500 text-sm">
                                            {isPaid ? 'Pago em' : 'Vence em'} {formatDateShort(inv.data_vencimento)}
                                        </Text>
                                    </View>
                                    <Text className={`font-bold ${selectedInvoice?.id === inv.id ? 'text-purple-700' : 'text-slate-900'}`}>
                                        {formatCurrency(inv.valor)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal PDF */}
            <Modal
                animationType="slide"
                presentationStyle="pageSheet"
                visible={showBoletoModal}
                onRequestClose={() => setShowBoletoModal(false)}
            >
                <View className="flex-1 bg-slate-50">
                    <SafeAreaView className="flex-1" edges={['top']}>
                        {/* Cabeçalho do Modal */}
                        <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-slate-200">
                            <TouchableOpacity
                                onPress={() => setShowBoletoModal(false)}
                                className="p-2"
                            >
                                <Text className="text-slate-600 font-medium text-base">Fechar</Text>
                            </TouchableOpacity>
                            <Text className="font-bold text-lg text-slate-800">Fatura</Text>
                            <TouchableOpacity
                                onPress={handleSharePdfFromModal}
                                className="bg-purple-600 px-4 py-2 rounded-lg flex-row items-center"
                            >
                                <Ionicons name="download-outline" size={18} color="white" />
                                <Text className="text-white font-bold ml-2">Baixar</Text>
                            </TouchableOpacity>
                        </View>

                        {/* WebView para PDF */}
                        <View className="flex-1 bg-slate-200 relative">
                            {boletoBase64 && (
                                <WebView
                                    originWhitelist={['*']}
                                    source={{ uri: `data:application/pdf;base64,${boletoBase64}` }}
                                    style={{ flex: 1 }}
                                    className="flex-1"
                                    startInLoadingState={true}
                                    renderLoading={() => (
                                        <View className="absolute inset-0 justify-center items-center bg-white">
                                            <ActivityIndicator size="large" color="#9333ea" />
                                        </View>
                                    )}
                                />
                            )}
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Modal Seletor de Contrato */}
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
                                return (
                                    <TouchableOpacity
                                        key={contract.id}
                                        onPress={() => {
                                            setSelectedContract(contract);
                                            setShowContractPicker(false);
                                        }}
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
                                            <Text className={`font-bold text-base ${isSelected ? 'text-purple-700' : 'text-slate-700'
                                                }`}>
                                                {contract.contrato || contract.id}
                                            </Text>
                                            <Text className="text-slate-500 text-sm">
                                                {contract.endereco || 'Internet'}
                                            </Text>
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
        </View >
    );
}
