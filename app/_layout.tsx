import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import '../global.css'; // Import NativeWind global styles
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

// Separate component to handle navigation logic inside Provider
function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'dashboard';

    if (user && !inAuthGroup) {
      // If user is logged in and not in dashboard, go to dashboard
      router.replace('/dashboard');
    } else if (!user && inAuthGroup) {
      // If user is not logged in and checks dashboard, go to login
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
