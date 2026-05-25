import { Ionicons } from '@expo/vector-icons';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { bffApi } from '../src/services/api';
import { Contract } from '../src/types/ixc';
import { logger } from '../src/utils/logger';

function selecionarContratoAssinavel(contracts: Contract[]) {
    return contracts.find((contract) => contract.status === 'P' && contract.status_internet === 'AA')
        || contracts[0];
}

export default function ContratoScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [contractId, setContractId] = useState<string | null>(null);
    const [contratoPdfBase64, setContratoPdfBase64] = useState<string | null>(null);
    const [pdfVisualizado, setPdfVisualizado] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadContract = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const contracts = await bffApi.getClientContracts();

            if (!contracts || contracts.length === 0) {
                setError('Nenhum contrato encontrado.');
                return;
            }

            const contract = selecionarContratoAssinavel(contracts);
            setContractId(contract.id);

            const pdf = await bffApi.getContractPdf(contract.id);
            if (!pdf) {
                setError('Contrato oficial não disponível para leitura. O aceite pelo aplicativo foi bloqueado.');
                return;
            }

            setContratoPdfBase64(pdf);
        } catch (err) {
            logger.error('Error loading contract:', err);
            setError('Erro ao carregar contrato. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContract();
    }, [loadContract]);

    const salvarECompartilharPdf = async (base64Pdf: string) => {
        const fileName = `contrato-${contractId || 'apollo'}.pdf`;
        const file = new ExpoFile(Paths.cache, fileName);
        await file.write(base64Pdf, { encoding: 'base64' });

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('Indisponível', 'Não foi possível abrir o contrato neste dispositivo.');
            return;
        }

        await Sharing.shareAsync(file.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Contrato Apollo Telecom',
            UTI: 'com.adobe.pdf',
        });

        setPdfVisualizado(true);
    };

    const handleVisualizarContrato = async () => {
        if (!contratoPdfBase64) {
            Alert.alert('Indisponível', 'Contrato oficial não carregado.');
            return;
        }

        if (Platform.OS === 'ios') {
            setShowPdfModal(true);
            setPdfVisualizado(true);
            return;
        }

        try {
            await salvarECompartilharPdf(contratoPdfBase64);
        } catch (err) {
            logger.error('Error sharing contract:', err);
            Alert.alert('Erro', 'Não foi possível abrir o contrato. Tente novamente.');
        }
    };

    const handleAccept = async () => {
        if (!contractId || !accepted || !pdfVisualizado) return;

        try {
            setSubmitting(true);

            const timestamp = new Date().toISOString();
            const userAgent = `${Platform.OS.toUpperCase()} App Apollo Telecom`;

            await bffApi.acceptContract(contractId, {
                timestamp,
                userAgent
            });

            Alert.alert(
                'Sucesso!',
                'Contrato assinado com sucesso. Seu acesso foi liberado.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/dashboard')
                    }
                ]
            );

        } catch (err) {
            logger.error('Error accepting contract:', err);
            Alert.alert('Erro', 'Não foi possível registrar o aceite. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text className="text-slate-500 mt-4">Carregando contrato...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text className="text-slate-800 text-lg font-bold mt-4 text-center">Ops!</Text>
                <Text className="text-slate-600 text-center mt-2 mb-6">{error}</Text>
                <TouchableOpacity
                    className="bg-purple-600 px-6 py-3 rounded-xl"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="bg-white px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-800">Assinatura de Contrato</Text>
                <TouchableOpacity onPress={handleVisualizarContrato} className="p-2 -mr-2">
                    <Ionicons name="document-text-outline" size={24} color="#7c3aed" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 bg-white m-4 rounded-xl shadow-sm p-6">
                <View className="items-center mt-8">
                    <View className="w-20 h-20 rounded-full bg-purple-100 items-center justify-center mb-6">
                        <Ionicons name="document-text-outline" size={40} color="#7c3aed" />
                    </View>

                    <Text className="text-slate-900 text-2xl font-bold text-center mb-3">
                        Contrato oficial
                    </Text>
                    <Text className="text-slate-600 text-center leading-6 mb-8">
                        O aceite só fica disponível depois que o contrato oficial gerado pelo IXC é aberto neste dispositivo.
                    </Text>

                    <TouchableOpacity
                        className="bg-purple-600 rounded-xl py-4 px-6 flex-row items-center"
                        onPress={handleVisualizarContrato}
                    >
                        <Ionicons name="open-outline" size={20} color="white" />
                        <Text className="text-white font-bold text-base ml-2">
                            Abrir contrato oficial
                        </Text>
                    </TouchableOpacity>

                    {pdfVisualizado && (
                        <View className="flex-row items-center mt-6 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                            <Text className="text-green-700 font-semibold ml-2">
                                Contrato aberto para leitura
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="bg-white p-6 border-t border-slate-100 shadow-lg pb-8">
                <TouchableOpacity
                    className={`flex-row items-center mb-6 ${pdfVisualizado ? '' : 'opacity-50'}`}
                    onPress={() => pdfVisualizado && setAccepted(!accepted)}
                    disabled={!pdfVisualizado}
                >
                    <View
                        className="w-6 h-6 rounded border items-center justify-center mr-3"
                        style={{
                            backgroundColor: accepted ? '#7c3aed' : 'white',
                            borderColor: accepted ? '#7c3aed' : '#94a3b8'
                        }}
                    >
                        {accepted && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-slate-700 flex-1">
                        Li o contrato oficial e concordo com os termos apresentados.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="rounded-xl py-4 items-center"
                    style={{
                        backgroundColor: accepted && pdfVisualizado ? '#7c3aed' : '#cbd5e1',
                    }}
                    onPress={handleAccept}
                    disabled={!accepted || !pdfVisualizado || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            Assinar e Finalizar
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <Modal
                visible={showPdfModal}
                animationType="slide"
                onRequestClose={() => setShowPdfModal(false)}
            >
                <SafeAreaView className="flex-1 bg-white">
                    <View className="px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-slate-800">Contrato oficial</Text>
                        <TouchableOpacity onPress={() => setShowPdfModal(false)}>
                            <Ionicons name="close" size={24} color="#334155" />
                        </TouchableOpacity>
                    </View>

                    {contratoPdfBase64 && (
                        <WebView
                            originWhitelist={['*']}
                            source={{ uri: `data:application/pdf;base64,${contratoPdfBase64}` }}
                            className="flex-1"
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
