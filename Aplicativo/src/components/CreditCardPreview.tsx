import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';
import { getBrandInfo } from '../utils/cardUtils';

interface CreditCardPreviewProps {
    /** Card brand slug (visa, mastercard, elo, amex, etc.) */
    brand: string;
    /** Last 4 digits of card or full formatted number */
    displayNumber?: string;
    /** Cardholder name */
    holder: string;
    /** Expiry date (MM/AA) */
    expiry: string;
}

/**
 * Premium visual credit card preview component
 * Extracted from recorrencia/index.tsx and recorrencia/cadastro.tsx
 */
export function CreditCardPreview({
    brand,
    displayNumber = '••••',
    holder,
    expiry,
}: CreditCardPreviewProps) {
    const brandInfo = getBrandInfo(brand);

    return (
        <LinearGradient
            colors={brandInfo.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-56 rounded-2xl p-6 justify-between shadow-2xl"
            style={{
                shadowColor: brandInfo.gradient[0],
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
            }}
        >
            <View className="flex-row justify-between items-start">
                <View>
                    <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.8)" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
                <Text className="text-white font-bold text-lg italic opacity-90">
                    {brandInfo.label}
                </Text>
            </View>

            <View>
                <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-12 h-9 bg-yellow-400/20 rounded-md border border-yellow-200/30" />
                </View>
                <Text className="text-white text-2xl font-mono tracking-widest shadow-sm">
                    {displayNumber.includes('••••') ? displayNumber : `•••• •••• •••• ${displayNumber}`}
                </Text>
            </View>

            <View className="flex-row justify-between items-end">
                <View>
                    <Text className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Titular</Text>
                    <Text className="text-white font-medium tracking-wide uppercase shadow-sm">
                        {holder || 'NOME DO TITULAR'}
                    </Text>
                </View>
                <View>
                    <Text className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Validade</Text>
                    <Text className="text-white font-medium tracking-wide shadow-sm">
                        {expiry || 'MM/AA'}
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
}
