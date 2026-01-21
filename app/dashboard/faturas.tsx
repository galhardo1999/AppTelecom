import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
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
import { useInvoiceHistory } from '../../src/hooks/useQueries';
import { bffApi } from '../../src/services/api';
import { Invoice } from '../../src/types/ixc';
import { formatCurrency, formatDateShort, getFirstName, getMonthName, getMonthYear } from '../../src/utils/formatters';
import { showToast } from '../../src/utils/toast';

type TabType = 'abertas' | 'vencidas' | 'pagas';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FaturasScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('abertas');

    // Get first name for greeting
    const firstName = getFirstName(user?.razao);

    // Use invoice history query
    const { data: invoiceData, isLoading: loading, isError, refetch } = useInvoiceHistory();

    // Get current month invoice (only the most recent open invoice for current month)
    const getCurrentMonthInvoice = (invoices: Invoice[]): Invoice[] => {
        if (!invoices || invoices.length === 0) return [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Find invoice for current month
        const currentMonthInvoice = invoices.find(inv => {
            const dueDate = new Date(inv.data_vencimento);
            return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
        });

        // If no invoice for current month, return the first (most recent) one
        return currentMonthInvoice ? [currentMonthInvoice] : [invoices[0]];
    };

    // Get invoices for current tab
    const getInvoicesForTab = (): Invoice[] => {
        if (!invoiceData) return [];
        switch (activeTab) {
            case 'abertas':
                // Show only current month invoice (1 invoice)
                return getCurrentMonthInvoice(invoiceData.abertas || []);
            case 'vencidas':
                return invoiceData.vencidas || [];
            case 'pagas':
                return invoiceData.pagas || [];
            default:
                return [];
        }
    };

    const currentInvoices = getInvoicesForTab();

    // Set default selected invoice when data loads or tab changes
    useEffect(() => {
        if (currentInvoices.length > 0) {
            setSelectedInvoice(currentInvoices[0]);
        } else {
            setSelectedInvoice(null);
        }
    }, [invoiceData, activeTab]);

    // Tab counter badges
    const getTabCount = (tab: TabType): number => {
        if (!invoiceData) return 0;
        if (tab === 'abertas') {
            // Show 1 for current month invoice if exists
            const abertas = invoiceData.abertas || [];
            return abertas.length > 0 ? 1 : 0;
        }
        return invoiceData[tab]?.length || 0;
    };

    // Handle error state
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

        // First check if we already have the PIX code in the invoice data
        if (selectedInvoice.pix_copia_cola) {
            await Clipboard.setStringAsync(selectedInvoice.pix_copia_cola);
            showToast('Código PIX copiado!');
            return;
        }

        // Otherwise, fetch from API
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
            const filePath = `${FileSystem.cacheDirectory}${fileName}`;
            console.log('Saving boleto to:', filePath);

            await FileSystem.writeAsStringAsync(filePath, base64Data, {
                encoding: 'base64',
            });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(filePath, {
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

                // On Android, WebView cannot render local PDF/Base64 directly.
                // Best practice is to save and open with external view action.
                if (Platform.OS === 'android') {
                    await saveAndSharePdf(base64Pdf);
                } else {
                    // On iOS, WebView works fine for PDF
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

    // Get status label and color
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

    // Tab button component
    const TabButton = ({ tab, label }: { tab: TabType; label: string }) => {
        const isActive = activeTab === tab;
        const count = getTabCount(tab);

        let bgColor = 'bg-white/20';
        let textColor = 'text-white/70';
        let badgeColor = 'bg-white/30';

        if (isActive) {
            bgColor = 'bg-white';
            textColor = 'text-purple-700';
            badgeColor = tab === 'vencidas' ? 'bg-red-500' : tab === 'pagas' ? 'bg-green-500' : 'bg-purple-500';
        }

        return (
            <TouchableOpacity
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-3 rounded-xl flex-row items-center justify-center ${bgColor}`}
            >
                <Text className={`font-semibold text-sm ${textColor}`}>{label}</Text>
                {count > 0 && (
                    <View className={`ml-1.5 px-2 py-0.5 rounded-full ${isActive ? badgeColor : 'bg-white/30'}`}>
                        <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-white/80'}`}>
                            {count}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Top Section with Gradient */}
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
                    {/* Header: Logo + Actions */}
                    <View className="flex-row justify-between items-center py-2">
                        <View className="bg-white/20 p-2 rounded-xl">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 80, height: 30 }}
                                resizeMode="contain"
                                tintColor="white"
                            />
                        </View>
                        <View className="flex-row space-x-4">
                            <TouchableOpacity>
                                <Ionicons name="notifications-outline" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/dashboard/settings')}>
                                <Ionicons name="settings-outline" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Greeting */}
                    <View className="mt-4 mb-3">
                        <Text className="text-white text-lg font-medium">Olá, {firstName}</Text>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row bg-white/10 rounded-xl p-1 mb-4">
                        <TabButton tab="abertas" label="Abertas" />
                        <TabButton tab="vencidas" label="Vencidas" />
                        <TabButton tab="pagas" label="Pagas" />
                    </View>

                    {/* Main Content Area */}
                    {loading ? (
                        <SkeletonInvoiceHeader />
                    ) : selectedInvoice ? (
                        <View className="flex-1 relative">
                            {/* Selector */}
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

                            {/* Details Information */}
                            <View className="flex-row items-center space-x-2 mb-2">
                                <Ionicons name="location-outline" size={16} color="white" />
                                <Text className="text-white font-medium text-xs uppercase tracking-wide">
                                    {user?.endereco || 'Endereço Principal'}
                                </Text>
                            </View>

                            {/* Large Value Display */}
                            <View className="mt-2">
                                <Text className="text-white text-5xl font-bold tracking-tighter">
                                    {formatCurrency(selectedInvoice.valor)}
                                </Text>
                                <View className="flex-row justify-between items-center mt-2 pr-4">
                                    <Text className="text-white/90 text-base font-medium">{statusInfo.label}</Text>
                                    <Text className="text-white/80 text-sm">
                                        {isPaid ? 'Pago em' : 'Vencimento:'} {formatDateShort(selectedInvoice.data_vencimento)}
                                    </Text>
                                </View>
                            </View>

                            {/* Watermark Month Name */}
                            <View className="absolute bottom-6 right-0 w-[150%] opacity-10 pointer-events-none z-0">
                                <Text className="text-white text-6xl font-bold uppercase text-right pr-6" numberOfLines={1}>
                                    {getMonthName(selectedInvoice.data_vencimento)}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View className="flex-1 justify-center items-center">
                            <Ionicons
                                name={isPaid ? "document-text-outline" : "checkmark-circle-outline"}
                                size={64}
                                color="white"
                            />
                            <Text className="text-white text-lg font-bold mt-4">
                                {isPaid ? 'Nenhuma fatura paga' : 'Tudo em dia!'}
                            </Text>
                            <Text className="text-white/70 text-center mt-2">
                                {isPaid
                                    ? 'Seu histórico de pagamentos aparecerá aqui.'
                                    : `Você não possui faturas ${activeTab === 'abertas' ? 'abertas' : 'vencidas'}.`
                                }
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </View>

            {/* Bottom Actions Section */}
            <View className="flex-1 -mt-12 px-6 pb-6">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    {/* Show action buttons only for non-paid invoices */}
                    {!isPaid && selectedInvoice && (
                        <>
                            {/* Copy Barcode Button */}
                            <TouchableOpacity
                                className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex-row items-center active:bg-slate-50 border border-slate-100"
                                onPress={handleCopyBarcode}
                                disabled={!selectedInvoice}
                            >
                                <View className="w-12 h-12 bg-slate-100 rounded-xl items-center justify-center mr-4">
                                    <Ionicons name="barcode-outline" size={24} color="#64748b" />
                                </View>
                                <Text className="text-slate-700 font-bold text-lg flex-1">Copiar Código de Barras</Text>
                            </TouchableOpacity>

                            {/* Second Copy Button */}
                            <TouchableOpacity
                                className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex-row items-center active:bg-slate-50 border border-slate-100"
                                onPress={handleBoletoAction}
                                disabled={!selectedInvoice || loadingBoleto}
                            >
                                <View className="w-12 h-12 bg-slate-100 rounded-xl items-center justify-center mr-4">
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

                            {/* Pix Button */}
                            <TouchableOpacity
                                className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex-row items-center active:bg-slate-50 border border-slate-100"
                                onPress={handlePix}
                                disabled={!selectedInvoice || loadingPix}
                            >
                                <View className="w-12 h-12 bg-slate-100 rounded-xl items-center justify-center mr-4">
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

                    {/* For paid invoices, show download receipt option */}
                    {isPaid && selectedInvoice && (
                        <TouchableOpacity
                            className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex-row items-center active:bg-slate-50 border border-slate-100"
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

                    {/* Empty state hint */}
                    {!selectedInvoice && !loading && (
                        <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 items-center">
                            <Ionicons
                                name={activeTab === 'pagas' ? 'wallet-outline' : 'checkmark-done-circle-outline'}
                                size={48}
                                color="#94a3b8"
                            />
                            <Text className="text-slate-500 text-center mt-4">
                                {activeTab === 'pagas'
                                    ? 'Quando você pagar suas faturas, elas aparecerão aqui.'
                                    : 'Parabéns! Você está em dia com todos os pagamentos.'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Picker Modal */}
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

            {/* PDF Modal */}
            <Modal
                animationType="slide"
                presentationStyle="pageSheet"
                visible={showBoletoModal}
                onRequestClose={() => setShowBoletoModal(false)}
            >
                <View className="flex-1 bg-slate-50">
                    <SafeAreaView className="flex-1" edges={['top']}>
                        {/* Modal Header */}
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

                        {/* WebView for PDF */}
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
        </View>
    );
}
