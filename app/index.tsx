import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { getBiometryIcon, getBiometryLabel, useBiometrics } from '../src/hooks/useBiometrics';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const { signIn } = useAuth();

    const [activeField, setActiveField] = useState<string | null>(null);
    const [rememberEmail, setRememberEmail] = useState(false);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

    // Hook de biometria
    const {
        isSupported,
        isEnabled,
        biometryType,
        isLoading: biometricsLoading,
        canUseBiometrics,
        enableBiometrics,
        authenticateWithBiometrics,
    } = useBiometrics();

    // Carregar email salvo
    useEffect(() => {
        SecureStore.getItemAsync('saved_email').then(savedEmail => {
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberEmail(true);
            }
        });
    }, []);

    // Tentar login biométrico ao montar se disponível
    useEffect(() => {
        if (canUseBiometrics && !biometricsLoading) {
            handleBiometricLogin();
        }
    }, [canUseBiometrics, biometricsLoading]);

    const handleBiometricLogin = async () => {
        if (!canUseBiometrics) return;

        setBiometricLoading(true);
        try {
            const credentials = await authenticateWithBiometrics();

            if (credentials) {
                await signIn(credentials.email, credentials.password);
            }
        } catch (error: any) {
            console.error('Biometric login error:', error);
            // Não mostra erro - usuário ainda pode fazer login com senha
        } finally {
            setBiometricLoading(false);
        }
    };

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

            // Após login bem-sucedido, sugerir ativar biometria se suportado mas não ativado
            if (isSupported && !isEnabled) {
                setShowBiometricPrompt(true);
            }

        } catch (error: any) {
            Alert.alert('Erro de Acesso', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnableBiometrics = async () => {
        const success = await enableBiometrics(email, password);
        if (success) {
            Alert.alert(
                'Sucesso!',
                `${getBiometryLabel(biometryType)} ativado. No próximo login você poderá usar biometria.`
            );
        }
        setShowBiometricPrompt(false);
    };

    const biometryLabel = getBiometryLabel(biometryType);
    const biometryIcon = getBiometryIcon(biometryType) as keyof typeof Ionicons.glyphMap;

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

                    {/* Container para manter conteúdo junto */}
                    <Animated.View
                        className="w-full"
                        entering={FadeInDown.delay(200).duration(1000).springify()}
                    >
                        {/* Seção do Logo */}
                        <View className="items-center mb-10">
                            <Image
                                source={require('../assets/logo.png')}
                                style={{ width: 180, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Seção do Título */}
                        <View className="items-center mb-8">
                            <Text className="text-3xl font-bold text-slate-900 text-center">
                                Bem-vindo de volta
                            </Text>
                            <Text className="text-slate-500 mt-2 text-base text-center">
                                Acesse sua conta para continuar
                            </Text>
                        </View>

                        {/* Botão de Login Biométrico (se disponível) */}
                        {canUseBiometrics && (
                            <TouchableOpacity
                                className="bg-purple-50 border-2 border-purple-200 rounded-xl py-4 px-6 mb-6 flex-row items-center justify-center active:bg-purple-100"
                                onPress={handleBiometricLogin}
                                disabled={biometricLoading || loading}
                            >
                                {biometricLoading ? (
                                    <ActivityIndicator color="#7c3aed" />
                                ) : (
                                    <>
                                        <Ionicons name={biometryIcon} size={24} color="#7c3aed" />
                                        <Text className="text-purple-700 font-semibold text-base ml-3">
                                            Entrar com {biometryLabel}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Divisor (se biometria disponível) */}
                        {canUseBiometrics && (
                            <View className="flex-row items-center mb-6">
                                <View className="flex-1 h-px bg-slate-200" />
                                <Text className="text-slate-400 text-sm mx-4">ou</Text>
                                <View className="flex-1 h-px bg-slate-200" />
                            </View>
                        )}

                        {/* Seção do Formulário */}
                        <View className="space-y-6">

                            {/* Campo de Usuário */}
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

                            {/* Campo de Senha */}
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

                            {/* Checkbox Lembrar Email */}
                            <TouchableOpacity
                                className="flex-row items-center ml-1 mt-4"
                                onPress={() => setRememberEmail(!rememberEmail)}
                            >
                                <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${rememberEmail ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}>
                                    {rememberEmail && <Ionicons name="checkmark" size={14} color="white" />}
                                </View>
                                <Text className="text-slate-600 text-sm font-medium">Lembrar email</Text>
                            </TouchableOpacity>

                            {/* Botão de Enviar */}
                            <TouchableOpacity
                                className="bg-purple-600 rounded-xl py-4 items-center mt-6 shadow-md shadow-purple-200 active:bg-purple-800"
                                onPress={handleLogin}
                                disabled={loading || biometricLoading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Entrar</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Prompt de Biometria (exibido após login bem-sucedido se suportado mas não ativado) */}
                        {showBiometricPrompt && isSupported && !isEnabled && (
                            <View className="mt-6 bg-purple-50 rounded-xl p-4 border border-purple-200">
                                <Text className="text-purple-900 font-semibold text-center mb-2">
                                    Ativar {biometryLabel}?
                                </Text>
                                <Text className="text-purple-700 text-center text-sm mb-4">
                                    Use {biometryLabel} para entrar mais rápido na próxima vez.
                                </Text>
                                <View className="flex-row space-x-3">
                                    <TouchableOpacity
                                        className="flex-1 bg-white rounded-lg py-2 border border-purple-300"
                                        onPress={() => setShowBiometricPrompt(false)}
                                    >
                                        <Text className="text-purple-600 text-center font-medium">Depois</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 bg-purple-600 rounded-lg py-2"
                                        onPress={handleEnableBiometrics}
                                    >
                                        <Text className="text-white text-center font-medium">Ativar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Rodapé */}
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
