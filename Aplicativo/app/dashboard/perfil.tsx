import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { formatFullName } from '../../src/utils/formatters';

interface MenuItem {
    title: string;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    bgColor: string;
    onPress: () => void;
    isDestructive?: boolean;
}

export default function PerfilScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const fullName = formatFullName(user?.razao);

    const handleLogout = () => {
        Alert.alert(
            "Sair",
            "Tem certeza que deseja sair da sua conta?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Sair", style: "destructive", onPress: signOut }
            ]
        );
    };

    const accountItems: MenuItem[] = [
        {
            title: 'Meu Contrato',
            subtitle: 'Visualizar detalhes do contrato',
            icon: 'document-text-outline',
            iconColor: '#7c3aed',
            bgColor: 'bg-purple-100',
            onPress: () => router.push('/dashboard/contract'),
        },
        {
            title: 'Meu Plano',
            subtitle: 'Gerenciar planos contratados',
            icon: 'wifi-outline',
            iconColor: '#0891b2',
            bgColor: 'bg-cyan-100',
            onPress: () => router.push('/dashboard/planos'),
        },
    ];

    const supportItems: MenuItem[] = [
        {
            title: 'Central de Ajuda',
            subtitle: 'Tire suas dúvidas',
            icon: 'help-circle-outline',
            iconColor: '#16a34a',
            bgColor: 'bg-green-100',
            onPress: () => router.push('/dashboard/suporte'),
        },
    ];

    const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => (
        <React.Fragment key={item.title}>
            <TouchableOpacity
                className="flex-row items-center justify-between p-4 active:bg-slate-50"
                onPress={item.onPress}
            >
                <View className="flex-row items-center flex-1">
                    <View className={`w-11 h-11 ${item.bgColor} rounded-xl items-center justify-center mr-4`}>
                        <Ionicons name={item.icon} size={22} color={item.iconColor} />
                    </View>
                    <View className="flex-1">
                        <Text className={`text-base font-semibold ${item.isDestructive ? 'text-red-500' : 'text-slate-800'}`}>
                            {item.title}
                        </Text>
                        {item.subtitle && (
                            <Text className="text-slate-500 text-sm mt-0.5">{item.subtitle}</Text>
                        )}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
            {!isLast && <View className="h-px bg-slate-100 mx-4" />}
        </React.Fragment>
    );

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header com Gradiente */}
            <View className="h-[28%] w-full">
                <LinearGradient
                    colors={['#a855f7', '#7e22ce', '#3b0764']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />
                <SafeAreaView edges={['top']} className="flex-1 px-6">
                    {/* Logo e Título */}
                    <View className="flex-row justify-between items-center py-2">
                        <View className="bg-white/20 p-2 rounded-xl">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 80, height: 30 }}
                                resizeMode="contain"
                                tintColor="white"
                            />
                        </View>
                    </View>

                    {/* Info do Usuário */}
                    <View className="mt-4">
                        <Text className="text-white/80 text-sm">Bem-vindo(a),</Text>
                        <Text className="text-white text-2xl font-bold mt-1">{fullName}</Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* Conteúdo */}
            <ScrollView
                className="flex-1 -mt-8 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
            >
                {/* Card de Perfil */}
                <View className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
                    <View className="flex-row items-center">
                        <View className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full items-center justify-center">
                            <Text className="text-white text-xl font-bold">
                                {fullName?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-slate-800 font-bold text-lg">{user?.razao}</Text>
                            <Text className="text-slate-500 text-sm">{user?.hotsite_email}</Text>
                        </View>
                    </View>
                </View>

                {/* Seção Conta */}
                <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                    Minha Conta
                </Text>
                <View className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4">
                    {accountItems.map((item, index) => renderMenuItem(item, index, index === accountItems.length - 1))}
                </View>

                {/* Seção Suporte */}
                <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                    Suporte
                </Text>
                <View className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4">
                    {supportItems.map((item, index) => renderMenuItem(item, index, index === supportItems.length - 1))}
                </View>

                {/* Botão Sair */}
                <View className="bg-white rounded-2xl shadow-sm border border-slate-100">
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4 active:bg-red-50"
                        onPress={handleLogout}
                    >
                        <View className="flex-row items-center">
                            <View className="w-11 h-11 bg-red-100 rounded-xl items-center justify-center mr-4">
                                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                            </View>
                            <Text className="text-red-500 text-base font-semibold">Sair do App</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#fca5a5" />
                    </TouchableOpacity>
                </View>

                {/* Versão do App */}
                <Text className="text-center text-slate-400 text-xs mt-6">
                    Versão 1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}
