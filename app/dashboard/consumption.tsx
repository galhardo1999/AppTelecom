import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { ixcApi } from '../../src/services/api';

interface RadUsuario {
    id: string;
    id_cliente: string;
    login: string;
    senha: string;
    ip: string;
    mac: string;
    online: string;
    rx: string;
    tx: string;
    onu_rx: string;
    onu_tx: string;
    olt_rx: string;
    olt_tx: string;
    tempo_online: string;
    ultima_conexao: string;
    id_conexao: string;
    status: string;
}

export default function ConsumptionScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [usage, setUsage] = useState<RadUsuario[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsage();
    }, []);

    const loadUsage = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await ixcApi.getInternetUsage(user.id);
            setUsage(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os dados de consumo.');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes: string) => {
        if (!bytes) return '0 B';
        const b = parseFloat(bytes);
        if (b === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusInfo = (online: string, status: string) => {
        if (online === 'S' || status?.toUpperCase() === 'ONLINE') {
            return { color: '#22c55e', label: 'Online', icon: 'wifi' as const };
        }
        return { color: '#ef4444', label: 'Offline', icon: 'wifi-outline' as const };
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header with Gradient */}
            <View className="h-[180px] w-full relative">
                <LinearGradient
                    colors={['#2e1065', '#9333ea', '#f97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />

                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6">
                    {/* Header Row */}
                    <View className="flex-row items-center py-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-2xl font-bold">Consumo de Internet</Text>
                    </View>

                    {/* Subtitle */}
                    <Text className="text-white/80 text-base mt-2">
                        Status da sua conexão
                    </Text>
                </SafeAreaView>
            </View>

            {/* Content */}
            <View className="flex-1 -mt-8 px-6">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#7c3aed" size="large" />
                    </View>
                ) : usage.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <View className="w-20 h-20 bg-slate-200 rounded-full items-center justify-center mb-4">
                            <Ionicons name="speedometer-outline" size={40} color="#94a3b8" />
                        </View>
                        <Text className="text-slate-500 text-lg font-medium">Sem dados de consumo</Text>
                        <Text className="text-slate-400 text-center mt-2 px-8">
                            Não foi possível encontrar informações de consumo para sua conexão.
                        </Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {usage.map((item) => {
                            const statusInfo = getStatusInfo(item.online, item.status);
                            return (
                                <View
                                    key={item.id}
                                    className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100"
                                >
                                    {/* Connection Status Header */}
                                    <View className="flex-row justify-between items-center mb-4">
                                        <View className="flex-row items-center">
                                            <View
                                                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                                                style={{ backgroundColor: statusInfo.color + '20' }}
                                            >
                                                <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
                                            </View>
                                            <View>
                                                <Text className="text-slate-800 text-lg font-bold">
                                                    {item.login || 'Conexão'}
                                                </Text>
                                                <Text style={{ color: statusInfo.color }} className="font-semibold">
                                                    {statusInfo.label}
                                                </Text>
                                            </View>
                                        </View>
                                        {item.tempo_online && (
                                            <View className="bg-slate-100 px-3 py-2 rounded-xl">
                                                <Text className="text-slate-500 text-xs">Tempo Online</Text>
                                                <Text className="text-slate-800 font-medium text-sm">
                                                    {item.tempo_online}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Divider */}
                                    <View className="h-px bg-slate-100 my-3" />

                                    {/* Traffic Info */}
                                    <View className="flex-row mb-4">
                                        <View className="flex-1 bg-green-50 rounded-xl p-4 mr-2">
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="arrow-down" size={18} color="#22c55e" />
                                                <Text className="text-green-700 font-medium ml-1">Download</Text>
                                            </View>
                                            <Text className="text-slate-800 text-xl font-bold">
                                                {formatBytes(item.rx)}
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-blue-50 rounded-xl p-4 ml-2">
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="arrow-up" size={18} color="#3b82f6" />
                                                <Text className="text-blue-700 font-medium ml-1">Upload</Text>
                                            </View>
                                            <Text className="text-slate-800 text-xl font-bold">
                                                {formatBytes(item.tx)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Connection Details */}
                                    <View className="bg-slate-50 rounded-xl p-4">
                                        <Text className="text-slate-600 font-semibold mb-3">Detalhes da Conexão</Text>

                                        <View className="flex-row mb-3">
                                            <View className="flex-1">
                                                <Text className="text-slate-500 text-xs mb-1">Endereço IP</Text>
                                                <Text className="text-slate-800 font-mono font-medium">
                                                    {item.ip || '-'}
                                                </Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-slate-500 text-xs mb-1">MAC Address</Text>
                                                <Text className="text-slate-800 font-mono font-medium text-xs">
                                                    {item.mac || '-'}
                                                </Text>
                                            </View>
                                        </View>

                                        {(item.onu_rx || item.onu_tx) && (
                                            <View className="flex-row mb-3">
                                                <View className="flex-1">
                                                    <Text className="text-slate-500 text-xs mb-1">ONU RX</Text>
                                                    <Text className="text-slate-800 font-medium">
                                                        {item.onu_rx || '-'} dBm
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-slate-500 text-xs mb-1">ONU TX</Text>
                                                    <Text className="text-slate-800 font-medium">
                                                        {item.onu_tx || '-'} dBm
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        {item.ultima_conexao && (
                                            <View>
                                                <Text className="text-slate-500 text-xs mb-1">Última Conexão</Text>
                                                <Text className="text-slate-800 font-medium">
                                                    {item.ultima_conexao}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
