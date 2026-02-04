
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContract } from '../../src/context/ContractContext';

export default function DashboardLayout() {
    const { contracts, hasUserSelectedContract, loading } = useContract();
    const insets = useSafeAreaInsets();

    // Esconder tab bar se usuário tem múltiplos contratos e ainda não escolheu
    const needsContractSelection = contracts.length > 1 && !hasUserSelectedContract;
    const shouldHideTabBar = needsContractSelection || loading;

    // Calcular altura e padding do tab bar baseado no dispositivo
    // Para Android com barra de navegação: usa insets.bottom
    // Para iOS: usa padding fixo de 30
    const bottomPadding = Platform.OS === 'ios' ? 30 : Math.max(insets.bottom, 10);
    const tabBarHeight = Platform.OS === 'ios' ? 90 : 60 + bottomPadding;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#7c3aed',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: shouldHideTabBar ? { display: 'none' } : {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e2e8f0',
                    height: tabBarHeight,
                    paddingBottom: bottomPadding,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontWeight: '500',
                    fontSize: 10,
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="planos"
                options={{
                    title: 'Plano',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="faturas"
                options={{
                    title: 'Faturas',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="barcode-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="suporte"
                options={{
                    title: 'Suporte',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="headset-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Hidden routes */}
            <Tabs.Screen name="contract" options={{ href: null }} />

            {/* If settings still refers to the file name, it is now perfil. 
                If there are any other files, ensure they are hidden if not needed in tabs.
            */}
        </Tabs>
    );
}
