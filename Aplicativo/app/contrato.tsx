import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { bffApi } from '../src/services/api';
import { logger } from '../src/utils/logger';

export default function ContratoScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [contractPdf, setContractPdf] = useState<string | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadContract();
    }, []);

    const loadContract = async () => {
        try {
            setLoading(true);
            const contracts = await bffApi.getClientContracts();

            if (contracts && contracts.length > 0) {
                const contract = contracts[0];
                setContractId(contract.id);

                // Fetch PDF
                const pdfData = await bffApi.getContractPdf(contract.id);
                if (pdfData) {
                    setContractPdf(pdfData);
                } else {
                    setError('Não foi possível carregar o documento do contrato.');
                }
            } else {
                setError('Nenhum contrato encontrado.');
            }
        } catch (err: any) {
            logger.error('Error loading contract:', err);
            setError('Erro ao carregar contrato. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!accepted) {
            Alert.alert('Atenção', 'Você precisa ler e concordar com os termos antes de assinar.');
            return;
        }

        if (!contractId) return;

        try {
            setSubmitting(true);

            // Coletar dados do dispositivo (simulado/básico para React Native)
            const timestamp = new Date().toISOString();
            const userAgent = `${Platform.OS.toUpperCase()} App Apollo Telecom`;

            // Tenta obter IP (opcional, backend pode pegar o IP da request)

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

        } catch (err: any) {
            logger.error('Error accepting contract:', err);
            Alert.alert('Erro', 'Não foi possível registrar o aceite. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async () => {
        if (!contractPdf) return;

        try {
            await Share.share({
                url: `data:application/pdf;base64,${contractPdf}`,
                title: 'Contrato Apollo Telecom'
            });
        } catch (error) {
            console.error(error);
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
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-800">Assinatura de Contrato</Text>
                <TouchableOpacity onPress={handleDownload} className="p-2 -mr-2">
                    <Ionicons name="share-outline" size={24} color="#7c3aed" />
                </TouchableOpacity>
            </View>

            {/* Conteúdo PDF */}
            <View className="flex-1 bg-slate-200 m-4 rounded-xl overflow-hidden shadow-sm">
                {contractPdf ? (
                    Platform.OS === 'ios' ? (
                        <WebView
                            originWhitelist={['*']}
                            source={{ uri: `data:application/pdf;base64,${contractPdf}` }}
                            style={{ flex: 1 }}
                        />
                    ) : (
                        <WebView
                            originWhitelist={['*']}
                            source={{
                                html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <style>
                                        body { margin: 0; display: flex; justify-content: center; align-items: center; background: #525252; height: 100vh; }
                                        embed, object, iframe { width: 100%; height: 100%; border: none; }
                                    </style>
                                </head>
                                <body>
                                    <embed src="data:application/pdf;base64,${contractPdf}" type="application/pdf" width="100%" height="100%">
                                        <p>Seu dispositivo não suporta visualização de PDF integrada. <br> Por favor, utilize o botão de compartilhamento acima.</p>
                                    </embed>
                                </body>
                                </html>
                            `}}
                            style={{ flex: 1 }}
                        />
                    )
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-slate-400">Visualização indisponível</Text>
                    </View>
                )}
            </View>

            {/* Footer de Aceite */}
            <View className="bg-white p-6 border-t border-slate-100 shadow-lg pb-8">
                <TouchableOpacity
                    className="flex-row items-start mb-6"
                    onPress={() => setAccepted(!accepted)}
                >
                    <View className={`w-6 h-6 rounded border mr-3 items-center justify-center mt-0.5 ${accepted ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}>
                        {accepted && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="flex-1 text-slate-600 leading-5">
                        Declaro que li e concordo com os termos e condições do contrato acima, e aceito realizá-lo digitalmente.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`rounded-xl py-4 items-center ${accepted ? 'bg-purple-600 shadow-purple-200 shadow-md' : 'bg-slate-300'}`}
                    onPress={handleAccept}
                    disabled={!accepted || submitting}
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
        </SafeAreaView>
    );
}
