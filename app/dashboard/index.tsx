import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { ixcApi } from '../../src/services/api';
import { Invoice } from '../../src/types/ixc';

export default function InvoicesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    // Get first name for greeting
    const firstName = user?.razao ? user.razao.split(' ')[0] : 'Cliente';

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await ixcApi.getOpenInvoices(user.id);
            setInvoices(data);
            // Default to the OLDEST invoice (first in the list if sorted by asc date, which API does)
            if (data.length > 0) {
                setSelectedInvoice(data[0]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar as faturas.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyBarcode = () => {
        if (selectedInvoice?.linha_digitavel) {
            // In a real app, use Clipboard.setStringAsync(selectedInvoice.linha_digitavel);
            Alert.alert('Código de Barras', selectedInvoice.linha_digitavel);
        } else {
            Alert.alert('Indisponível', 'Linha digitável não encontrada para esta fatura.');
        }
    };

    const handlePix = () => {
        Alert.alert('PIX', 'Funcionalidade em breve.');
    };

    const formatCurrency = (val: string) => {
        const num = parseFloat(val);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}`; // DD/MM
    };

    const getMonthName = (dateString: string) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return months[parseInt(month) - 1];
    };

    const getMonthYear = (dateString: string) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        const monthName = getMonthName(dateString);
        return `${monthName}/${year}`;
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Top Section with Gradient - VERO Style */}
            <View className="h-[60%] w-full relative">
                <LinearGradient
                    colors={['#2e1065', '#9333ea', '#f97316']} // Deep Purple -> Violet -> Orange
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
                    <View className="mt-6 mb-4">
                        <Text className="text-white text-lg font-medium">Olá, {firstName}</Text>
                    </View>

                    {/* Main Content Area */}
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator color="white" size="large" />
                        </View>
                    ) : selectedInvoice ? (
                        <View className="flex-1 relative">
                            {/* Selector */}
                            <Text className="text-white/80 text-sm mb-2">Selecionar Fatura:</Text>
                            <TouchableOpacity
                                onPress={() => setShowPicker(true)}
                                className="bg-white rounded-xl flex-row items-center justify-between px-4 py-3 mb-6 shadow-lg"
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
                                    <Text className="text-white/90 text-base font-medium">Fatura Aberta</Text>
                                    <Text className="text-white/80 text-sm">
                                        Vencimento: {formatDate(selectedInvoice.data_vencimento)}
                                    </Text>
                                </View>
                            </View>

                            {/* Watermark Month Name */}
                            <View className="absolute bottom-10 right-0 w-[150%] opacity-10 pointer-events-none z-0">
                                <Text className="text-white text-6xl font-bold uppercase text-right pr-6" numberOfLines={1}>
                                    {getMonthName(selectedInvoice.data_vencimento)}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View className="flex-1 justify-center items-center">
                            <Ionicons name="checkmark-circle-outline" size={64} color="white" />
                            <Text className="text-white text-lg font-bold mt-4">Tudo em dia!</Text>
                            <Text className="text-white/70 text-center mt-2">Você não possui faturas abertas.</Text>
                        </View>
                    )}
                </SafeAreaView>
            </View>

            {/* Bottom Actions Section */}
            <View className="flex-1 -mt-16 px-6 pb-6">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
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
                        onPress={() => Alert.alert('PDF', 'Download do PDF iniciado...')}
                        disabled={!selectedInvoice}
                    >
                        <View className="w-12 h-12 bg-slate-100 rounded-xl items-center justify-center mr-4">
                            <Ionicons name="document-text-outline" size={24} color="#64748b" />
                        </View>
                        <Text className="text-slate-700 font-bold text-lg flex-1">Segunda via de Fatura</Text>
                    </TouchableOpacity>

                    {/* Pix Button */}
                    <TouchableOpacity
                        className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex-row items-center active:bg-slate-50 border border-slate-100"
                        onPress={handlePix}
                        disabled={!selectedInvoice}
                    >
                        <View className="w-12 h-12 bg-slate-100 rounded-xl items-center justify-center mr-4">
                            <Ionicons name="qr-code-outline" size={24} color="#64748b" />
                        </View>
                        <Text className="text-slate-700 font-bold text-lg flex-1">Copiar Código PIX</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Custom Modal for Invoice Selection */}
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
                            {invoices.map((inv) => (
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
                                            Vence em {formatDate(inv.data_vencimento)}
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
        </View>
    );
}
