import { Ionicons } from '@expo/vector-icons';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContract } from '../context/ContractContext';

export function DashboardTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
    const insets = useSafeAreaInsets();
    const { contracts, hasUserSelectedContract, loading } = useContract();

    // Logic from original _layout.tsx to hide tab bar
    const needsContractSelection = contracts.length > 1 && !hasUserSelectedContract;
    const shouldHideTabBar = needsContractSelection || loading;

    if (shouldHideTabBar) {
        return null;
    }

    const bottomPadding = Platform.OS === 'ios' ? 30 : Math.max(insets.bottom, 10);

    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
        planos: 'document-text-outline',
        faturas: 'barcode-outline',
        index: 'home',
        suporte: 'headset-outline',
        perfil: 'person-outline',
    };

    const labels: Record<string, string> = {
        planos: 'Plano',
        faturas: 'Faturas',
        index: 'Início',
        suporte: 'Suporte',
        perfil: 'Perfil',
    };

    return (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: '#ffffff',
                borderTopWidth: 1,
                borderTopColor: '#e2e8f0',
                paddingBottom: bottomPadding,
                paddingTop: 10,
                elevation: 8, // Shadow for Android
                shadowColor: '#000', // Shadow for iOS
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            }}
        >
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];

                // Skip hidden routes (like 'contract')
                // Note: MaterialTopTabs doesn't strictly support href: null in the same way,
                // so we check if the route name is in our allowed list or check options specifically.
                // In this case, we only want to show the main 5 tabs.
                if (!icons[route.name]) return null;

                const isFocused = state.index === index;
                const label = labels[route.name] || route.name;
                const color = isFocused ? '#7c3aed' : '#94a3b8';

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Ionicons name={icons[route.name]} size={24} color={color} />
                        <Text style={{ color: color, fontSize: 10, marginTop: 2, fontWeight: '500' }}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
