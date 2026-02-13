
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
    const [showPromo, setShowPromo] = useState(false);
    const [showContractPicker, setShowContractPicker] = useState(false);
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
        { title: 'Meu Plano', icon: 'wifi-outline' as const, color: '#3b82f6', route: '/dashboard/planos' },
        { title: 'Suporte', icon: 'headset-outline' as const, color: '#22c55e', route: '/dashboard/suporte' },
        { title: 'Perfil', icon: 'person-outline' as const, color: '#f59e0b', route: '/dashboard/perfil' },
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
                            style={{ width: 120, height: 50 }}
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
                        <View className="bg-white/20 p-2 rounded-xl">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 80, height: 30 }}
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
                        <Text className="text-white/80 text-base">Olá,</Text>
                        <Text className="text-white text-2xl font-bold">{fullName}</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView className="flex-1 -mt-12 px-6" showsVerticalScrollIndicator={false}>
                {/* Card de Status do Plano */}
                {selectedContract && (
                    <TouchableOpacity
                        onPress={() => contracts.length > 1 ? setShowContractPicker(true) : router.push('/dashboard/planos')}
                        className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-slate-100"
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-3">
                                    <Ionicons name="wifi" size={24} color="#7c3aed" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-xs uppercase tracking-wide">
                                        {selectedContract.contrato || selectedContract.id}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                                    <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                                    <Text className="text-green-700 text-xs font-semibold">Ativo</Text>
                                </View>
                                <View className="ml-2">
                                    <Ionicons
                                        name={contracts.length > 1 ? "chevron-down" : "chevron-forward"}
                                        size={20}
                                        color="#cbd5e1"
                                    />
                                </View>
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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-6"
                    contentContainerStyle={{ paddingRight: 16 }}
                >
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            className="items-center mr-5"
                            onPress={() => router.push(action.route as any)}
                        >
                            <View
                                className="w-16 h-16 rounded-2xl items-center justify-center mb-2 shadow-sm"
                                style={{ backgroundColor: '#a855f7' }}
                            >
                                <Ionicons name={action.icon} size={28} color="white" />
                            </View>
                            <Text className="text-slate-700 font-medium text-xs text-center" style={{ maxWidth: 70 }}>
                                {action.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

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
