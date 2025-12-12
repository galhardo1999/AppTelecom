import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const firstName = user?.razao ? user.razao.split(' ')[0] : 'Cliente';

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header Area */}
            <View className="relative overflow-hidden pb-6 rounded-b-[40px] shadow-xl z-20">
                <LinearGradient
                    colors={['#4c1d95', '#7c3aed']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full"
                />
                <SafeAreaView edges={['top', 'left', 'right']}>
                    <View className="px-6 py-4 flex-row justify-between items-center">
                        <View className="flex-row items-center space-x-3">
                            <View className="bg-white/10 border border-white/20 w-12 h-12 rounded-full items-center justify-center p-2">
                                <Image source={require('../../assets/logo.png')} className="w-full h-full" resizeMode="contain" />
                            </View>
                            <View>
                                <Text className="text-slate-300 text-xs font-medium uppercase tracking-wider">Bem-vindo(a),</Text>
                                <Text className="text-2xl font-bold text-white capitalize">
                                    {firstName}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 active:bg-white/20"
                            onPress={signOut}
                        >
                            <Ionicons name="log-out-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Status Highlight */}
                    <View className="px-6 mt-4">
                        <View className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex-row items-center justify-between">
                            <View>
                                <Text className="text-emerald-400 font-bold tracking-wide text-xs uppercase mb-1">Status da Conexão</Text>
                                <Text className="text-white text-3xl font-extrabold">Online</Text>
                            </View>
                            <View className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView className="flex-1 -mt-4 pt-10 px-6" showsVerticalScrollIndicator={false}>

                <Text className="text-slate-800 font-bold text-lg mb-4">Visão Geral</Text>

                <View className="flex-row flex-wrap justify-between pb-10">
                    {/* Card Info 1 */}
                    <View className="w-[48%] bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4 h-40 justify-between">
                        <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center">
                            <Ionicons name="qr-code-outline" size={24} color="#3b82f6" />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-xs font-semibold uppercase">Código Cliente</Text>
                            <Text className="text-slate-800 font-bold text-xl">{user?.id}</Text>
                        </View>
                    </View>

                    {/* Card Info 2 */}
                    <View className="w-[48%] bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4 h-40 justify-between">
                        <View className="bg-indigo-50 w-12 h-12 rounded-2xl items-center justify-center">
                            <Ionicons name="speedometer-outline" size={24} color="#6366f1" />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-xs font-semibold uppercase">Plano</Text>
                            <Text className="text-slate-800 font-bold text-lg leading-6 mt-1" numberOfLines={2}>
                                FIBRA
                            </Text>
                        </View>
                    </View>

                    {/* Card Info 3 */}
                    <View className="w-[48%] bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4 h-40 justify-between">
                        <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center">
                            <Ionicons name="receipt-outline" size={24} color="#10b981" />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-xs font-semibold uppercase">Faturas</Text>
                            <Text className="text-slate-800 font-bold text-xl">Em dia</Text>
                        </View>
                    </View>

                    {/* Card Info 4 */}
                    <View className="w-[48%] bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4 h-40 justify-between">
                        <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center">
                            <Ionicons name="headset-outline" size={24} color="#f97316" />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-xs font-semibold uppercase">Suporte</Text>
                            <TouchableOpacity>
                                <Text className="text-blue-600 font-bold text-base">Abrir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
