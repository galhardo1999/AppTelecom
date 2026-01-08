
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function DashboardLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#7c3aed',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e2e8f0',
                    height: Platform.OS === 'ios' ? 90 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
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
                    title: 'Planos',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-outline" size={size} color={color} />
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
            <Tabs.Screen name="consumption" options={{ href: null }} />

            {/* If settings still refers to the file name, it is now perfil. 
                If there are any other files, ensure they are hidden if not needed in tabs.
            */}
        </Tabs>
    );
}
