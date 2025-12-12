import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InvoicesScreen() {
    return (
        <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
            <Text className="text-2xl font-bold text-slate-800">Faturas</Text>
            <Text className="text-slate-500 mt-2">Suas faturas aparecerão aqui.</Text>
        </SafeAreaView>
    );
}
