import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const [activeField, setActiveField] = useState<string | null>(null);
    const [rememberEmail, setRememberEmail] = useState(false);

    useEffect(() => {
        SecureStore.getItemAsync('saved_email').then(email => {
            if (email) {
                setEmail(email);
                setRememberEmail(true);
            }
        });
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);

            if (rememberEmail) {
                await SecureStore.setItemAsync('saved_email', email);
            } else {
                await SecureStore.deleteItemAsync('saved_email');
            }

        } catch (error: any) {
            Alert.alert('Erro de Acesso', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" hidden={true} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    className="px-8"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* Wrapper to keep content together */}
                    <Animated.View
                        className="w-full"
                        entering={FadeInDown.delay(200).duration(1000).springify()}
                    >
                        {/* Logo Section */}
                        <View className="items-center mb-10">
                            <Image
                                source={require('../assets/logo.png')}
                                style={{ width: 180, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Title Section */}
                        <View className="items-center mb-8">
                            <Text className="text-3xl font-bold text-slate-900 text-center">
                                Bem-vindo de volta
                            </Text>
                            <Text className="text-slate-500 mt-2 text-base text-center">
                                Acesse sua conta para continuar
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View className="space-y-6">

                            {/* User Input */}
                            <View>
                                <Text className="text-slate-700 mb-2 font-medium ml-1">Usuário</Text>
                                <View className={`w-full bg-white border rounded-xl px-4 py-3.5 flex-row items-center ${activeField === 'email' ? 'border-purple-600' : 'border-slate-200'}`}>
                                    <Ionicons name="person-outline" size={20} color={activeField === 'email' ? "#6d28d9" : "#64748b"} style={{ marginRight: 10 }} />
                                    <TextInput
                                        className="flex-1 text-slate-800 text-base"
                                        placeholder="Digite seu usuário"
                                        placeholderTextColor="#94a3b8"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        onFocus={() => setActiveField('email')}
                                        onBlur={() => setActiveField(null)}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View>
                                <Text className="text-slate-700 mb-2 font-medium ml-1">Senha</Text>
                                <View className={`w-full bg-white border rounded-xl px-4 py-3.5 flex-row items-center ${activeField === 'password' ? 'border-purple-600' : 'border-slate-200'}`}>
                                    <Ionicons name="lock-closed-outline" size={20} color={activeField === 'password' ? "#6d28d9" : "#64748b"} style={{ marginRight: 10 }} />
                                    <TextInput
                                        className="flex-1 text-slate-800 text-base"
                                        placeholder="Digite sua senha"
                                        placeholderTextColor="#94a3b8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        onFocus={() => setActiveField('password')}
                                        onBlur={() => setActiveField(null)}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Remember Email Checkbox */}
                            <TouchableOpacity
                                className="flex-row items-center ml-1 mt-4"
                                onPress={() => setRememberEmail(!rememberEmail)}
                            >
                                <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${rememberEmail ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}>
                                    {rememberEmail && <Ionicons name="checkmark" size={14} color="white" />}
                                </View>
                                <Text className="text-slate-600 text-sm font-medium">Lembrar email</Text>
                            </TouchableOpacity>

                            {/* Submit Button */}
                            <TouchableOpacity
                                className="bg-purple-600 rounded-xl py-4 items-center mt-6 shadow-md shadow-purple-200 active:bg-purple-800"
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Entrar</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View className="mt-12 items-center">
                            <Text className="text-slate-400 text-xs text-center">
                                © 2025 Apollo Telecom. Todos os direitos reservados.
                            </Text>
                        </View>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
