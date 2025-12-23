import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

interface MenuItem {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    bgColor: string;
    onPress: () => void;
    isDestructive?: boolean;
}

export default function SettingsScreen() {
    const router = useRouter();
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

    const menuItems: MenuItem[] = [
        {
            title: 'Meu Contrato',
            icon: 'document-text-outline',
            iconColor: '#7c3aed',
            bgColor: 'bg-purple-100',
            onPress: () => router.push('/dashboard/contract'),
        },
        {
            title: 'Consumo de Internet',
            icon: 'speedometer-outline',
            iconColor: '#0891b2',
            bgColor: 'bg-cyan-100',
            onPress: () => router.push('/dashboard/consumption'),
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-slate-50 p-6">
            <Text className="text-2xl font-bold text-slate-800 mb-6">Configurações</Text>

            {/* Menu Items */}
            <View className="bg-white rounded-xl shadow-sm mb-4">
                {menuItems.map((item, index) => (
                    <React.Fragment key={item.title}>
                        <TouchableOpacity
                            className="flex-row items-center justify-between p-4"
                            onPress={item.onPress}
                        >
                            <View className="flex-row items-center">
                                <View className={`w-10 h-10 ${item.bgColor} rounded-full items-center justify-center mr-3`}>
                                    <Ionicons name={item.icon} size={24} color={item.iconColor} />
                                </View>
                                <Text className="text-slate-700 text-lg font-medium">{item.title}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                        {index < menuItems.length - 1 && (
                            <View className="h-px bg-slate-100 mx-4" />
                        )}
                    </React.Fragment>
                ))}
            </View>

            {/* Logout Button - Separate */}
            <View className="bg-white rounded-xl shadow-sm">
                <TouchableOpacity
                    className="flex-row items-center justify-between p-4"
                    onPress={handleLogout}
                >
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                        </View>
                        <Text className="text-red-500 text-lg font-medium">Sair do App</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
