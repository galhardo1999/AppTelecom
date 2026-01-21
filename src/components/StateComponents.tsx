import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function ErrorState({
    title = 'Algo deu errado',
    message = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
    onRetry,
    icon = 'cloud-offline-outline'
}: ErrorStateProps) {
    return (
        <View className="flex-1 justify-center items-center p-6">
            <View className="bg-slate-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                <Ionicons name={icon} size={40} color="#64748b" />
            </View>

            <Text className="text-slate-700 text-lg font-bold text-center">
                {title}
            </Text>

            <Text className="text-slate-500 text-center mt-2 px-4">
                {message}
            </Text>

            {onRetry && (
                <TouchableOpacity
                    className="bg-purple-600 px-6 py-3 rounded-xl mt-6 flex-row items-center active:bg-purple-700"
                    onPress={onRetry}
                >
                    <Ionicons name="refresh" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Tentar Novamente</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({
    title = 'Nada por aqui',
    message = 'Não há dados para exibir no momento.',
    icon = 'file-tray-outline'
}: EmptyStateProps) {
    return (
        <View className="flex-1 justify-center items-center p-6">
            <View className="bg-slate-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                <Ionicons name={icon} size={40} color="#94a3b8" />
            </View>

            <Text className="text-slate-600 text-lg font-bold text-center">
                {title}
            </Text>

            <Text className="text-slate-400 text-center mt-2 px-4">
                {message}
            </Text>
        </View>
    );
}

interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
    return (
        <View className="flex-1 justify-center items-center p-6">
            <View className="bg-purple-100 w-16 h-16 rounded-full items-center justify-center mb-4">
                <Ionicons name="hourglass-outline" size={32} color="#9333ea" />
            </View>
            <Text className="text-slate-500 text-base">{message}</Text>
        </View>
    );
}
