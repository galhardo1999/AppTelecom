
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PromotionalModal } from '../../src/components/PromotionalModal';
import { useAuth } from '../../src/context/AuthContext';
import { getFirstName } from '../../src/utils/formatters';

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const firstName = getFirstName(user?.razao);
    const [showPromo, setShowPromo] = useState(false);

    useEffect(() => {
        // Show promo after a short delay to simulate "check" or animation
        const timer = setTimeout(() => {
            setShowPromo(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const quickActions = [
        { title: 'Faturas', icon: 'receipt-outline' as const, color: '#a855f7', route: '/dashboard/faturas' },
        { title: 'Meu Plano', icon: 'list-outline' as const, color: '#3b82f6', route: '/dashboard/planos' },
        { title: 'Suporte', icon: 'headset-outline' as const, color: '#22c55e', route: '/dashboard/suporte' },
        { title: 'Perfil', icon: 'person-outline' as const, color: '#f59e0b', route: '/dashboard/perfil' },
    ];

    return (
        <View className="flex-1 bg-slate-50">
            <PromotionalModal visible={showPromo} onClose={() => setShowPromo(false)} />
            <View className="h-[35%] w-full relative">
                <LinearGradient
                    colors={['#a855f7', '#7e22ce', '#3b0764']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />
                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6">
                    <View className="flex-row justify-between items-center py-2 mt-2">
                        <View className="bg-white/20 p-2 rounded-xl">
                            <Ionicons name="wifi" size={24} color="white" />
                        </View>
                        <TouchableOpacity onPress={() => router.push('/dashboard/perfil')}>
                            <Ionicons name="person-circle-outline" size={32} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="mt-6">
                        <Text className="text-white/80 text-lg">Bem-vindo(a) de volta,</Text>
                        <Text className="text-white text-3xl font-bold">{firstName}</Text>
                    </View>
                </SafeAreaView>
            </View>

            <View className="flex-1 -mt-16 px-6">
                {/* Quick Actions Grid */}
                <View className="flex-row flex-wrap justify-between">
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            className="bg-white w-[48%] p-4 rounded-2xl shadow-sm mb-4 items-center justify-center h-32"
                            onPress={() => router.push(action.route as any)}
                        >
                            <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: action.color + '20' }}>
                                <Ionicons name={action.icon} size={28} color={action.color} />
                            </View>
                            <Text className="text-slate-700 font-bold text-base">{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Banner / Promotion */}
                <View className="mt-4 bg-indigo-900 rounded-2xl p-6 relative overflow-hidden">
                    <LinearGradient
                        colors={['#312e81', '#4338ca']}
                        className="absolute inset-0"
                    />
                    <View className="relative z-10 w-[70%]">
                        <Text className="text-white font-bold text-lg mb-1">Internet Fibra Óptica</Text>
                        <Text className="text-indigo-200 text-sm mb-3">Ultra velocidade para sua casa.</Text>
                        <TouchableOpacity className="bg-white self-start px-4 py-2 rounded-lg">
                            <Text className="text-indigo-900 font-bold text-xs">SAIBA MAIS</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="absolute right-0 bottom-0 opacity-20">
                        <Ionicons name="rocket" size={100} color="white" />
                    </View>
                </View>
            </View>
        </View>
    );
}
