import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import '../global.css'; // Import NativeWind global styles
import { AuthProvider, useAuth } from '../src/context/AuthContext';

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
