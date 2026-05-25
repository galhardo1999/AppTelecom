import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, bffApi, setAccessToken, setOnUnauthorized } from '../services/api';
import { logger } from '../utils/logger';

// Define User Type
export type User = {
    id: string;
    razao: string; // Name
    hotsite_email: string;
    endereco?: string;
    cidadeNome?: string; // Nome da cidade do usuário
    cnpj_cpf?: string;
    telefone_celular?: string;
    cidade?: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signInWithSession: (token: string, userData: User) => Promise<void>;
    signInWithToken: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Limpar sessão ao iniciar o app - força login a cada abertura
        // (sessão só persiste enquanto app está em segundo plano/minimizado)
        const clearSessionOnStart = async () => {
            try {
                // Limpar tokens e sessão armazenados
                await Promise.all([
                    SecureStore.deleteItemAsync('access_token'),
                    SecureStore.deleteItemAsync('user_session'),
                ]);
                setAccessToken(null);
                setUser(null);
            } catch (error) {
                logger.error('Failed to clear session', error);
            } finally {
                setIsLoading(false);
            }
        };
        clearSessionOnStart();
    }, []);

    // Listen for 401 unauthorized events from API
    useEffect(() => {
        const handleUnauthorized = () => {
            logger.info('Session expired, signing out...');
            setAccessToken(null);
            setUser(null);
        };

        setOnUnauthorized(handleUnauthorized);
        return () => {
            setOnUnauthorized(null);
        };
    }, []);

    const persistSession = async (token: string, userData: User) => {
        if (!token || !userData) {
            throw new Error('Resposta inválida do servidor');
        }

        await Promise.all([
            SecureStore.setItemAsync('access_token', token),
            SecureStore.setItemAsync('user_session', JSON.stringify(userData)),
        ]);

        setAccessToken(token);
        setUser(userData);
    };

    const signInWithSession = async (token: string, userData: User) => {
        await persistSession(token, userData);
    };

    const signInWithToken = async (token: string) => {
        try {
            setAccessToken(token);
            await SecureStore.setItemAsync('access_token', token);
            const userData = await bffApi.getUser();
            await SecureStore.setItemAsync('user_session', JSON.stringify(userData));
            setUser(userData);
        } catch (error: any) {
            setAccessToken(null);
            await Promise.all([
                SecureStore.deleteItemAsync('access_token'),
                SecureStore.deleteItemAsync('user_session'),
            ]);
            logger.error('Token login error:', error);
            throw new Error(error.response?.data?.error || 'Sessão expirada');
        }
    };

    const signIn = async (email: string, pass: string) => {
        try {
            // Call BFF login endpoint
            const response = await authApi.login(email, pass);

            const { token, user: userData } = response;
            await persistSession(token, userData);

        } catch (error: any) {
            logger.error('Login error:', error);

            // Extract error message from response or use generic
            const message = error.response?.data?.error
                || error.message
                || 'Falha na autenticação';

            throw new Error(message);
        }
    };

    const signOut = async () => {
        // Clear stored data
        await Promise.all([
            SecureStore.deleteItemAsync('access_token'),
            SecureStore.deleteItemAsync('user_session'),
        ]);

        // Clear token from API client
        setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signInWithSession, signInWithToken, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
