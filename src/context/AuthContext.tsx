import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, setAccessToken } from '../services/api';

// Define User Type
type User = {
    id: string;
    razao: string; // Name
    hotsite_email: string;
    endereco?: string;
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
        // Check for persisted session
        const loadSession = async () => {
            try {
                const [storedToken, storedUser] = await Promise.all([
                    SecureStore.getItemAsync('access_token'),
                    SecureStore.getItemAsync('user_session'),
                ]);

                if (storedToken && storedUser) {
                    // Set token in API client
                    setAccessToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to load session', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
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
