import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, setAccessToken, setOnUnauthorized } from '../services/api';

// Define User Type
type User = {
    id: string;
    razao: string; // Name
    hotsite_email: string;
    endereco?: string;
    cidadeNome?: string; // Nome da cidade do usuário
    [key: string]: any;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
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
                console.error('Failed to clear session', error);
            } finally {
                setIsLoading(false);
            }
        };
        clearSessionOnStart();
    }, []);

    // Listen for 401 unauthorized events from API
    useEffect(() => {
        const handleUnauthorized = () => {
            console.log('Session expired, signing out...');
            setAccessToken(null);
            setUser(null);
        };

        setOnUnauthorized(handleUnauthorized);
        return () => {
            setOnUnauthorized(null);
        };
    }, []);

    const signIn = async (email: string, pass: string) => {
        try {
            // Call BFF login endpoint
            const response = await authApi.login(email, pass);

            const { token, user: userData } = response;

            if (!token || !userData) {
                throw new Error('Resposta inválida do servidor');
            }

            // Store token and user data
            await Promise.all([
                SecureStore.setItemAsync('access_token', token),
                SecureStore.setItemAsync('user_session', JSON.stringify(userData)),
            ]);

            // Set token in API client for subsequent requests
            setAccessToken(token);
            setUser(userData);

        } catch (error: any) {
            console.error('Login error:', error);

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
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
