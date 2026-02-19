import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function SpeedTestScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header com Gradiente */}
            <View className="h-[15%] w-full relative">
                <LinearGradient
                    colors={['#06b6d4', '#0891b2', '#155e75']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[30px]"
                />
                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6">
                    <View className="flex-row items-center justify-between py-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/20 p-2 rounded-xl"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        <Text className="text-white text-xl font-bold">Teste de Velocidade</Text>

                        <View className="w-10" />
                    </View>
                </SafeAreaView>
            </View>

            {/* Conteúdo WebView */}
            <View className="flex-1 -mt-4 mx-4 mb-4 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                {loading && (
                    <View className="absolute z-10 w-full h-full items-center justify-center bg-white">
                        <ActivityIndicator size="large" color="#0891b2" />
                        <Text className="text-slate-500 mt-4 font-medium">Carregando testador...</Text>
                    </View>
                )}

                <WebView
                    source={{ uri: 'https://fast.com/pt/' }}
                    className="flex-1"
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => <View />} // Handled by custom loader above
                />
            </View>
        </View>
    );
}
