import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const { signOut } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Sair",
            "Tem certeza que deseja sair?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Sair", style: "destructive", onPress: signOut }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 p-6">
            <Text className="text-2xl font-bold text-slate-800 mb-6">Configurações</Text>

            <View className="bg-white rounded-xl p-4 shadow-sm">
                <TouchableOpacity
                    className="flex-row items-center justify-between"
                    onPress={handleLogout}
                >
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                        </View>
                        <Text className="text-slate-700 text-lg font-medium">Sair do App</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
