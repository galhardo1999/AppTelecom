
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { ContractPickerModal } from '../../src/components/ContractPickerModal';
import { PromotionalModal } from '../../src/components/PromotionalModal';
import { useAuth } from '../../src/context/AuthContext';
import { useContract } from '../../src/context/ContractContext';
import { useInvoiceHistory } from '../../src/hooks/useQueries';
import { Contract } from '../../src/types/ixc';
import { formatCurrency, formatDateShort, formatFullName } from '../../src/utils/formatters';

export default function HomeScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);

    // Estado para controlar visibilidade das setas
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [dimensions, setDimensions] = useState({ contentWidth: 0, containerWidth: 0 });

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const { contentWidth, containerWidth } = dimensions;

        // Se o conteúdo for menor que a tela, esconde tudo
        if (contentWidth <= containerWidth) {
            setShowLeftArrow(false);
            setShowRightArrow(false);
            return;
        }

        setShowLeftArrow(offsetX > 5); // Margem de tolerância
        setShowRightArrow(offsetX + containerWidth < contentWidth - 5);
    };
    const {
        contracts,
        selectedContract,
        setSelectedContract,
        loading: contractsLoading,
        hasUserSelectedContract,
        setHasUserSelectedContract
    } = useContract();
    const fullName = formatFullName(user?.razao);

    // Estados para controlar o fluxo: seleção de contrato -> promo modal -> dashboard
    const [showPromo, setShowPromo] = useState(false); const [showContractPicker, setShowContractPicker] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false); // Estado de transição

    // Mostrar tela de seleção quando: contratos carregaram, tem mais de 1, e usuário não escolheu ainda
    const needsContractSelection = !contractsLoading && contracts.length > 1 && !hasUserSelectedContract;

    // Bloquear botão de voltar na tela de seleção de contrato
    useEffect(() => {
        if (needsContractSelection) {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                // Retorna true para bloquear o comportamento padrão
                return true;
            });
            return () => backHandler.remove();
        }
    }, [needsContractSelection]);

    // Quando contratos carregarem, verificar se precisa de seleção
    useEffect(() => {
        if (!contractsLoading && contracts.length > 0) {
            if (contracts.length === 1) {
                // Apenas 1 contrato, ir direto para promo modal
                setHasUserSelectedContract(true);
                setShowPromo(true);
            }
            // Se mais de 1 contrato, needsContractSelection será true e mostrará a tela de seleção
        }
    }, [contractsLoading, contracts.length]);

    // Função para selecionar contrato da tela inicial
    const handleInitialContractSelect = (contract: Contract) => {
        setSelectedContract(contract);
        setIsTransitioning(true); // Ativar transição

        // Delay para transição suave
        setTimeout(() => {
            setHasUserSelectedContract(true);
            setShowPromo(true);
            setIsTransitioning(false);
        }, 500);
    };

    // Buscar faturas para mostrar alertas
    const { data: invoiceData } = useInvoiceHistory();

    const quickActions = [
        { title: 'Faturas', icon: 'receipt-outline' as const, color: '#a855f7', route: '/dashboard/faturas' },
        { title: 'Teste de Velocidade', icon: 'speedometer-outline' as const, color: '#a855f7', route: '/dashboard/velocidade' },
        { title: 'Recorrência', icon: 'card-outline' as const, color: '#a855f7', route: '/recorrencia' },
        { title: 'Suporte', icon: 'headset-outline' as const, color: '#a855f7', route: '/dashboard/suporte' },
        { title: 'Meus Dados', icon: 'person-outline' as const, color: '#a855f7', route: '/dashboard/perfil' },
    ];

    // Verificar se há faturas vencidas para o contrato selecionado
    const overdueInvoicesForContract = invoiceData?.vencidas?.filter(
        (inv: { id_contrato?: string }) => !selectedContract || inv.id_contrato === selectedContract.id
    ) || [];
    const hasOverdue = overdueInvoicesForContract.length > 0;
    const overdueInvoice = hasOverdue ? overdueInvoicesForContract[0] : null;

    // Verificar se o contrato tem pendências (pré-contrato aguardando assinatura)
    const hasPendencias = selectedContract?.status === 'P' && selectedContract?.status_internet === 'AA';

    const handleSelectContract = (contract: Contract) => {
        setSelectedContract(contract);
        setShowContractPicker(false);
    };

    // Loading inicial ou transição
    if (contractsLoading || isTransitioning) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text className="text-slate-500 mt-4">{isTransitioning ? '' : 'Carregando...'}</Text>
            </View>
        );
    }

    // Tela de seleção de contrato - aparece primeiro se há múltiplos contratos
    if (needsContractSelection) {
        return (
            <View className="flex-1 bg-white">
                <SafeAreaView className="flex-1 px-6">
                    {/* Header com botão de logout */}
                    <Animated.View
                        className="flex-row justify-between items-center mt-4 mb-6"
                        entering={FadeInDown.delay(50).duration(600).springify()}
                    >
                        <Image
                            source={require('../../assets/logo.png')}
                            style={{ width: 180, height: 100 }}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            onPress={signOut}
                            className="flex-row items-center bg-red-50 px-3 py-2 rounded-xl"
                        >
                            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                            <Text className="text-red-600 font-medium ml-2">Sair</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                        {/* Título com animação */}
                        <Animated.Text
                            className="text-3xl font-bold text-slate-900 mb-8"
                            entering={FadeInDown.delay(200).duration(600).springify()}
                        >
                            Olá, selecione o contrato para continuar
                        </Animated.Text>

                        {/* Seção Meus Contratos com animação */}
                        <Animated.View
                            className="flex-row items-center mb-4"
                            entering={FadeInDown.delay(300).duration(600).springify()}
                        >
                            <Ionicons name="document-text-outline" size={24} color="#7c3aed" />
                            <Text className="text-lg font-bold text-slate-800 ml-2">Meus Contratos</Text>
                        </Animated.View>

                        {/* Cards de Contrato com animação */}
                        {contracts.map((contract, index) => (
                            <Animated.View
                                key={contract.id}
                                entering={FadeInDown.delay(400 + (index * 100)).duration(600).springify()}
                            >
                                <TouchableOpacity
                                    onPress={() => handleInitialContractSelect(contract)}
                                    className="bg-white border border-slate-200 rounded-xl p-4 mb-3 flex-row items-center shadow-sm active:bg-slate-50"
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-1">
                                        <Text className="text-purple-600 font-semibold text-sm mb-1">
                                            {contract.contrato || contract.id}
                                        </Text>
                                        <Text className="text-slate-800 font-medium text-base" numberOfLines={2}>
                                            {contract.endereco ? `${contract.endereco}, ${contract.numero || 'S/N'}` : 'Endereço não disponível'}
                                        </Text>
                                        <Text className="text-slate-500 text-sm mt-1">
                                            Internet
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    // Dashboard normal
    return (
        <View className="flex-1 bg-slate-50">
            <PromotionalModal visible={showPromo} onClose={() => setShowPromo(false)} cityName={selectedContract?.cidadeId} />

            {/* Header com Gradiente */}
            <View className="h-[32%] w-full relative">
                <LinearGradient
                    colors={['#a855f7', '#7e22ce', '#3b0764']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />
                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6">
                    {/* Top Bar */}
                    <View className="flex-row justify-between items-center py-2">
                        <View className=" p-2 rounded-xl">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 120, height: 50 }}
                                resizeMode="contain"
                                tintColor="white"
                            />
                        </View>

                        <TouchableOpacity onPress={() => router.push('/dashboard/perfil')}>
                            <View className="w-10 h-10 bg-white/30 rounded-full items-center justify-center">
                                <Ionicons name="person" size={20} color="white" />
                            </View>
                        </TouchableOpacity>

                    </View>

                    {/* Saudação */}
                    <View className="mt-4">
                        <Text className="text-white/95 text-base">Olá, seja bem-vindo(a)</Text>
                        <Text className="text-white text-2xl font-bold">{fullName}</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView className="flex-1 -mt-16 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>



                {/* Card Principal do Contrato */}
                {selectedContract && (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => contracts.length > 1 ? setShowContractPicker(true) : router.push('/dashboard/planos')}
                        className="bg-white rounded-3xl p-5 shadow-sm mb-6 border border-slate-100"
                        style={{ shadowColor: '#581c87', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }}
                    >
                        <View className="flex-row justify-between items-center">
                            <View className="flex-1 mr-4">
                                {/* Status Badge */}
                                <View className="flex-row items-center mb-2">
                                    <View className={`w-2 h-2 rounded-full mr-2 ${selectedContract.status === 'A' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <Text className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                                        Contrato #{selectedContract.id}
                                    </Text>
                                </View>

                                {/* Nome do Plano */}
                                <Text className="text-slate-800 text-xl font-bold mb-1 leading-tight">
                                    {selectedContract.contrato || 'Plano de Internet'}
                                </Text>

                                {/* Endereço */}
                                <Text className="text-slate-500 text-sm leading-5" numberOfLines={2}>
                                    {selectedContract.endereco}, {selectedContract.numero}
                                    {selectedContract.bairro ? ` - ${selectedContract.bairro}` : ''}
                                </Text>
                            </View>

                            {/* Ícone de Ação */}
                            <View className="bg-purple-50 p-3 rounded-2xl">
                                <Ionicons
                                    name={contracts.length > 1 ? "swap-horizontal" : "wifi"}
                                    size={24}
                                    color="#7c3aed"
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Alerta de Fatura Vencida */}
                {hasOverdue && overdueInvoice && (
                    <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-red-100 rounded-xl items-center justify-center mr-3">
                                <Ionicons name="alert-circle" size={22} color="#dc2626" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-red-700 font-bold text-sm">Fatura Vencida</Text>
                                <Text className="text-red-600 text-xs">
                                    {formatCurrency(overdueInvoice.valor)} • Venceu em {formatDateShort(overdueInvoice.data_vencimento)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/dashboard/faturas')}
                                className="bg-red-600 px-3 py-2 rounded-lg"
                            >
                                <Text className="text-white font-bold text-xs">PAGAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Alerta de Pendências - Pré-contrato aguardando assinatura */}
                {hasPendencias && (
                    <View className="bg-amber-50 rounded-2xl p-4 mb-4 border border-amber-200">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mr-3">
                                <Ionicons name="alert-circle" size={22} color="#d97706" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-amber-700 font-bold text-sm">Pendências</Text>
                                <Text className="text-amber-600 text-xs">
                                    Você tem documentos pendentes para assinar
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/dashboard/perfil')}
                                className="bg-amber-600 px-3 py-2 rounded-lg"
                            >
                                <Text className="text-white font-bold text-xs">VER</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Ações Rápidas - Círculos em linha */}
                <Text className="text-slate-800 text-lg font-bold mb-4">Acesso Rápido</Text>
                <View className="flex-row items-center justify-between mb-6">
                    {/* Seta Esquerda */}
                    <View className="w-6 items-center justify-center">
                        {showLeftArrow && (
                            <TouchableOpacity
                                onPress={() => scrollViewRef.current?.scrollTo({ x: 0, animated: true })}
                                className="p-1 -ml-1"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="chevron-back" size={16} color="#64748b" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-1 mx-2"
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        onContentSizeChange={(w) => setDimensions(prev => {
                            const newDims = { ...prev, contentWidth: w };
                            setShowRightArrow(w > prev.containerWidth);
                            return newDims;
                        })}
                        onLayout={(e) => {
                            const width = e.nativeEvent.layout.width;
                            setDimensions(prev => {
                                const newDims = { ...prev, containerWidth: width };
                                setShowRightArrow(prev.contentWidth > width);
                                return newDims;
                            });
                        }}
                    >
                        {quickActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                className={`items-center ${index === quickActions.length - 1 ? '' : 'mr-5'}`}
                                onPress={() => router.push(action.route as any)}
                            >
                                <View
                                    className="w-[60px] h-[60px] rounded-2xl items-center justify-center mb-2 shadow-sm"
                                    style={{ backgroundColor: action.color || '#a855f7' }}
                                >
                                    <Ionicons name={action.icon} size={28} color="white" />
                                </View>
                                <Text className="text-slate-700 font-medium text-xs text-center" style={{ maxWidth: 70 }}>
                                    {action.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Seta Direita */}
                    <View className="w-6 items-center justify-center">
                        {showRightArrow && (
                            <TouchableOpacity
                                onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                                className="p-1 -mr-1"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="chevron-forward" size={16} color="#64748b" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Seção Novidades */}
                <Text className="text-slate-800 text-lg font-bold mb-3">Novidades</Text>
                <AdBanner cityId={selectedContract?.cidadeId !== '0' ? selectedContract?.cidadeId : selectedContract?.cidade} />
            </ScrollView>

            {/* Modal de Seleção de Contrato */}
            <ContractPickerModal
                visible={showContractPicker}
                contracts={contracts}
                selectedContractId={selectedContract?.id || null}
                onSelect={handleSelectContract}
                onClose={() => setShowContractPicker(false)}
            />
        </View>
    );
}
