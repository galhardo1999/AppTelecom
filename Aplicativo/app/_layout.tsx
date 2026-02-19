import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, LogBox, View } from 'react-native';
import '../global.css'; // Importar estilos globais do NativeWind
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ContractProvider } from '../src/context/ContractContext';
import { queryClient } from '../src/lib/queryClient';

// Ignorar aviso de depreciação do SafeAreaView (vem de bibliotecas terceiras)
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Componente separado para lidar com lógica de navegação dentro do Provider
function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'dashboard' || segments[0] === 'recorrencia' || segments[0] === 'contrato' || segments[0] === 'velocidade';

    if (user && !inAuthGroup) {
      // Se usuário está logado e não está no dashboard, ir para dashboard
      router.replace('/dashboard');
    } else if (!user && inAuthGroup) {
      // Se usuário não está logado e acessa dashboard, ir para login
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  useEffect(() => {
    // Garantir que a splash screen fique visível por pelo menos 2.5 segundos
    const timer = setTimeout(() => {
      setIsSplashAnimationFinished(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isSplashAnimationFinished && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isSplashAnimationFinished, isLoading]);

  if (isLoading || !isSplashAnimationFinished) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <View className="flex-1 justify-center items-center">
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 200, height: 100 }}
            resizeMode="contain"
          />
        </View>
        <View className="mb-10">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="recorrencia" />
      <Stack.Screen
        name="velocidade"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="contrato"
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
    </Stack >
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ContractProvider>
            <RootNavigator />
          </ContractProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}


