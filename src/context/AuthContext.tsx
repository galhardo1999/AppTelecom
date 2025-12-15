import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ixcApi } from '../services/api';
import CryptoJS from 'crypto-js';

// Define User Type based on generic IXC fields we expect
type User = {
    id: string;
    razao: string; // Name
    hotsite_email: string;
    senha?: string; // MD5 hash usually
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
        // Check for persisted user
        const loadUser = async () => {
            try {
                const storedUser = await SecureStore.getItemAsync('user_session');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to load user session', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const signIn = async (email: string, pass: string) => {
        try {
            // 1. Fetch user from IXC
            const client = await ixcApi.findClientByEmail(email);

            if (!client) {
                throw new Error('Email não encontrado.');
            }

            // 2. Validate Password
            // IXC usually stores MD5. We compare MD5(pass) with client.senha
            const inputHash = CryptoJS.MD5(pass).toString();

            // NOTE: Adjust this logic if your IXC instance uses plain text or different hash.
            // Assuming MD5 based on standard IXC behavior and prompt hint.
            if (client.senha !== inputHash) {
                // Fallback check: sometimes (rarely) it might be plain text in older systems?
                // But for security we default to checking hash validity.
                // If client.senha is empty, user might not have a password set.
                if (client.senha && client.senha !== pass) {
                    throw new Error('Senha incorreta.');
                }
                if (!client.senha) {
                    // Decision: If no password on file, do we allow? 
                    // Usually ISP requires password.
                    // For now, fail safe.
                    throw new Error('Cadastro sem senha. Contate o suporte.');
                }
            }

            // 3. User Validated - Store Session
            // Remove sensitive data before storing if possible, but we keep generic user info
            const userSession = { ...client };
            delete userSession.senha; // Don't store hash in memory if not needed

            await SecureStore.setItemAsync('user_session', JSON.stringify(userSession));
            setUser(userSession);

        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Falha na autenticação');
        }
    };

    const signOut = async () => {
        await SecureStore.deleteItemAsync('user_session');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
