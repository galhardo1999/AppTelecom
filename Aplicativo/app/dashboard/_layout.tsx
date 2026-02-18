import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { DashboardTabBar } from '../../src/components/DashboardTabBar';

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

export default function DashboardLayout() {
    return (
        <MaterialTopTabs
            tabBarPosition="bottom"
            tabBar={(props) => <DashboardTabBar {...props} />}
            screenOptions={{
                swipeEnabled: true,
                animationEnabled: true,
                tabBarStyle: { display: 'none' }, // We use custom tab bar
            }}
            initialRouteName="index"
        >
            <MaterialTopTabs.Screen name="planos" />
            <MaterialTopTabs.Screen name="faturas" />
            <MaterialTopTabs.Screen name="index" />
            <MaterialTopTabs.Screen name="suporte" />
            <MaterialTopTabs.Screen
                name="perfil"
                options={{
                    swipeEnabled: true,
                }}
            />
            <MaterialTopTabs.Screen
                name="velocidade"
                options={{
                    swipeEnabled: false,
                    tabBarItemStyle: { display: 'none' },
                    headerShown: false,
                }}
            />
        </MaterialTopTabs>
    );
}
