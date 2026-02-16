import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertType, CustomAlert } from '../src/components/CustomAlert';
import { useAuth } from '../src/context/AuthContext';
import { getBiometryIcon, getBiometryLabel, useBiometrics } from '../src/hooks/useBiometrics';
import { authApi } from '../src/services/api';
import { logger } from '../src/utils/logger';

// Componente de imagem animado
const AnimatedImage = Animated.createAnimatedComponent(Image);

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

    // Variáveis de animação
    const logoScale = useSharedValue(1);
    const contentTranslateY = useSharedValue(0);
    const titleOpacity = useSharedValue(1);
    const titleHeight = useSharedValue(80); // Altura estimada do bloco de título

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const keyboardWillShow = Keyboard.addListener(showEvent, () => {
            // Teclado abriu: Diminuir logo, subir conteúdo, ocultar título
            logoScale.value = withTiming(0.6, { duration: 300 }); // Reduz para 60%
            contentTranslateY.value = withTiming(-120, { duration: 300 }); // Sobe mais para mostrar botão
            titleOpacity.value = withTiming(0, { duration: 200 }); // Oculta título
            titleHeight.value = withTiming(0, { duration: 300 }); // Remove espaço do título
        });

        const keyboardWillHide = Keyboard.addListener(hideEvent, () => {
            // Teclado fechou: Restaurar
            logoScale.value = withSpring(1);
            contentTranslateY.value = withSpring(0);
            titleOpacity.value = withTiming(1, { duration: 300 });
            titleHeight.value = withTiming(80, { duration: 300 });
        });

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    // Estilos animados
    const logoStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: logoScale.value }],
        };
    });

    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: contentTranslateY.value }],
        };
    });

    const titleContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: titleOpacity.value,
            height: titleHeight.value,
            overflow: 'hidden',
            marginBottom: titleOpacity.value === 0 ? 0 : 32 // Anima a margem também indiretamente
        };
    });

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'info' as AlertType,
        showSupport: false,
        actionLabel: 'OK'
    });

    // Hook de biometria
    const {
        isSupported,
        isEnabled,
        biometryType,
        isLoading: biometricsLoading,
        canUseBiometrics,
        enableBiometrics,
        authenticateWithBiometrics,
        storedEmail,
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
            logger.error('Biometric login error:', error);
            // Não mostra erro - usuário ainda pode fazer login com senha
        } finally {
            setBiometricLoading(false);
        }
    };

    const showAlert = (title: string, message: string, type: AlertType = 'info', showSupport = false) => {
        setAlertConfig({
            title,
            message,
            type,
            showSupport,
            actionLabel: showSupport ? 'Fechar' : 'OK'
        });
        setAlertVisible(true);
    };

    const performSignIn = async () => {
        setLoading(true);
        try {
            await signIn(email, password);

            if (rememberEmail) {
                await SecureStore.setItemAsync('saved_email', email);
            } else {
                await SecureStore.deleteItemAsync('saved_email');
            }
        } catch (error: any) {
            const isBlocked = error.message?.toLowerCase().includes('bloqueado');

            if (isBlocked) {
                showAlert(
                    'Falha no Acesso',
                    'No momento, o acesso à sua conta não está disponível. Para sua segurança, pedimos que entre em contato com nosso suporte técnico para regularizar a situação.',
                    'error',
                    true
                );
            } else {
                showAlert('Erro de Acesso', error.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email) {
            showAlert('Atenção', 'Por favor, preencha o campo usuario.', 'warning');
            return;
        }
        if (!password) {
            showAlert('Atenção', 'Por favor, preencha o campo senha.', 'warning');
            return;
        }
        if (!email || !password) {
            showAlert('Atenção', 'Por favor, preencha todos os campos.', 'warning');
            return;
        }

        setLoading(true);
        try {
            // 1. Validar credenciais primeiro (sem logar no contexto ainda)
            await authApi.login(email, password);

            // 2. Se login ok, verificar se pode oferecer biometria
            // Oferece se: não habilitado OU habilitado para outro usuário
            const shouldOfferBiometrics = isSupported && (!isEnabled || (storedEmail && storedEmail !== email));

            if (shouldOfferBiometrics) {
                setLoading(false); // Parar loading para mostrar o modal
                setShowBiometricPrompt(true);
                return; // Interromper fluxo para aguardar interação do usuário
            }

            // 3. Se não precisa de biometria, seguir para login (que redireciona)
            await performSignIn();

        } catch (error: any) {
            setLoading(false);
            const isBlocked = error.response?.data?.error?.toLowerCase().includes('bloqueado') ||
                error.message?.toLowerCase().includes('bloqueado');

            if (isBlocked) {
                showAlert(
                    'Falha no Acesso',
                    'No momento, o acesso à sua conta não está disponível. Para sua segurança, pedimos que entre em contato com nosso suporte técnico para regularizar a situação.',
                    'error',
                    true
                );
            } else {
                // Tenta extrair mensagem de erro da resposta ou usa genérica
                const message = error.response?.data?.error || error.message || 'Falha na autenticação';
                showAlert('Erro de Acesso', message, 'error');
            }
        }
    };

    const handleEnableBiometrics = async () => {
        const success = await enableBiometrics(email, password);
        if (success) {
            showAlert(
                'Sucesso!',
                `${getBiometryLabel(biometryType)} ativado. No próximo login você poderá usar biometria.`,
                'success'
            );
        }
        setShowBiometricPrompt(false);
        // Prosseguir para o login oficial após ativar (ou falhar)
        await performSignIn();
    };

    const handleSkipBiometrics = async () => {
        setShowBiometricPrompt(false);
        await performSignIn();
    };

    const handlePhoneSupport = () => {
        Linking.openURL('tel:08008710606');
    };

    const handleWhatsappSupport = () => {
        // Formato internacional para WhatsApp: 55 + DDD + Numero
        const message = "Olá! Esqueci meus dados de acesso ao aplicativo e gostaria de ajuda para recuperar.";
        Linking.openURL(`https://wa.me/5508008710606?text=${encodeURIComponent(message)}`);
    };

    const biometryLabel = getBiometryLabel(biometryType);
    const biometryIcon = getBiometryIcon(biometryType) as keyof typeof Ionicons.glyphMap;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" hidden={true} />

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                showSupportButton={alertConfig.showSupport}
                actionLabel={alertConfig.actionLabel}
                onClose={() => setAlertVisible(false)}
            />

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
                        style={containerStyle}
                    >
                        {/* Seção do Logo Animado */}
                        <View className="items-center mb-6">
                            <AnimatedImage
                                source={require('../assets/logo.png')}
                                style={[{ width: 180, height: 80, resizeMode: 'contain' }, logoStyle]}
                            />
                        </View>

                        {/* Seção do Título Animada (Some ao abrir teclado) */}
                        <Animated.View className="items-center" style={titleContainerStyle}>
                            <Text className="text-3xl font-bold text-slate-900 text-center">
                                Bem-vindo de volta
                            </Text>
                            <Text className="text-slate-500 mt-2 text-base text-center">
                                Acesse sua conta para continuar
                            </Text>
                        </Animated.View>



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

                            {/* Opções de Login */}
                            <View className="flex-row justify-between items-center mt-4">
                                <TouchableOpacity
                                    className="flex-row items-center ml-1"
                                    onPress={() => setRememberEmail(!rememberEmail)}
                                >
                                    <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${rememberEmail ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}>
                                        {rememberEmail && <Ionicons name="checkmark" size={14} color="white" />}
                                    </View>
                                    <Text className="text-slate-600 text-sm font-medium">Lembrar email</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setShowForgotPasswordModal(true)}>
                                    <Text className="text-purple-600 text-sm font-semibold">Esqueceu o email/senha?</Text>
                                </TouchableOpacity>
                            </View>

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

                            {/* Divisor (se biometria disponível) */}
                            {canUseBiometrics && (
                                <View className="flex-row items-center mt-8 mb-4">
                                    <View className="flex-1 h-px bg-slate-200" />
                                    <Text className="text-slate-400 text-sm mx-4">ou</Text>
                                    <View className="flex-1 h-px bg-slate-200" />
                                </View>
                            )}

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
                        </View>



                        {/* Rodapé */}
                        <View className="mt-12 items-center">
                            <Text className="text-slate-400 text-xs text-center">
                                © 2026 Apollo Telecom. Todos os direitos reservados.
                            </Text>
                        </View>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal de Ativação de Biometria */}
            <Modal
                visible={showBiometricPrompt && isSupported}
                transparent={true}
                animationType="fade"
                onRequestClose={() => handleSkipBiometrics()} // Fechar = pular
            >
                <View className="flex-1 justify-center items-center bg-black/50 px-6">
                    <View className="bg-white w-full rounded-2xl p-6 items-center shadow-xl">
                        <View className="bg-purple-100 p-4 rounded-full mb-4">
                            <Ionicons name={biometryIcon} size={48} color="#7c3aed" />
                        </View>

                        <Text className="text-xl font-bold text-slate-900 text-center mb-2">
                            Ativar {biometryLabel}?
                        </Text>

                        <Text className="text-slate-600 text-center mb-8 px-4">
                            Habilite o {biometryLabel} para acessar sua conta de forma mais rápida e segura na próxima vez.
                        </Text>

                        <View className="w-full space-y-3">
                            <TouchableOpacity
                                className="w-full bg-purple-600 py-4 rounded-xl items-center shadow-sm shadow-purple-200 active:bg-purple-700"
                                onPress={handleEnableBiometrics}
                            >
                                <Text className="text-white font-bold text-lg">
                                    Ativar {biometryLabel}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="w-full py-4 rounded-xl items-center active:bg-slate-50"
                                onPress={handleSkipBiometrics}
                            >
                                <Text className="text-slate-500 font-medium text-lg">
                                    Agora não
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Recuperação de Senha */}
            <Modal
                visible={showForgotPasswordModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowForgotPasswordModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-2xl p-6 shadow-xl">
                        <View className="items-center mb-4">
                            <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
                                <Ionicons name="key-outline" size={32} color="#7c3aed" />
                            </View>
                            <Text className="text-xl font-bold text-slate-800 text-center">
                                Recuperação de Email/Senha
                            </Text>
                        </View>

                        <Text className="text-slate-600 text-center leading-6 mb-6">
                            Para garantir a segurança dos seus dados, a redefinição de senha deve ser feita através da nossa central de atendimento.
                        </Text>

                        <View className="bg-slate-50 rounded-xl p-4 mb-6">
                            <View className="flex-row items-start mb-3">
                                <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <Text className="text-white font-bold text-xs">1</Text>
                                </View>
                                <Text className="flex-1 text-slate-700 text-sm">
                                    Entre em contato com nossa equipe de suporte.
                                </Text>
                            </View>
                            <View className="flex-row items-start mb-3">
                                <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <Text className="text-white font-bold text-xs">2</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-700 text-sm">Telefone: 0800 871 0606</Text>
                                    <Text className="text-slate-700 text-sm">WhatsApp: 0800 871 0606</Text>
                                </View>
                            </View>
                            <View className="flex-row items-start mb-3">
                                <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <Text className="text-white font-bold text-xs">3</Text>
                                </View>
                                <Text className="flex-1 text-slate-700 text-sm">
                                    Confirme seus dados cadastrais (CPF/CNPJ).
                                </Text>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <Text className="text-white font-bold text-xs">4</Text>
                                </View>
                                <Text className="flex-1 text-slate-700 text-sm">
                                    Os dados de acesso será confirmado pelo atendente.
                                </Text>
                            </View>
                        </View>



                        <TouchableOpacity
                            className="bg-blue-500 rounded-xl py-3.5 mb-3 flex-row justify-center items-center"
                            onPress={handlePhoneSupport}
                        >
                            <Ionicons name="call-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-bold text-center">Ligar Agora</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-green-500 rounded-xl py-3.5 mb-3 flex-row justify-center items-center"
                            onPress={handleWhatsappSupport}
                        >
                            <Ionicons name="logo-whatsapp" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-bold text-center">Chamar no WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-slate-200 rounded-xl py-3.5"
                            onPress={() => setShowForgotPasswordModal(false)}
                        >
                            <Text className="text-slate-700 font-bold text-center">Entendi</Text>
                        </TouchableOpacity>


                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}
