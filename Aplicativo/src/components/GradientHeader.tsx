import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GradientHeaderProps {
    /** Main title displayed in the header */
    title?: string;
    /** Subtitle text below the title */
    subtitle?: string;
    /** Whether to show the logo (default: false) */
    showLogo?: boolean;
    /** Custom children rendered below title/subtitle */
    children?: React.ReactNode;
    /** Height percentage (default: '28%') */
    height?: string;
}

/**
 * Standardized gradient header used across dashboard screens
 * Provides consistent purple gradient background with rounded bottom corners
 */
export function GradientHeader({
    title,
    subtitle,
    showLogo = false,
    children,
    height = '28%',
}: GradientHeaderProps) {
    return (
        <View style={{ height: height as any }} className="w-full relative">
            <LinearGradient
                colors={['#a855f7', '#7e22ce', '#3b0764']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute w-full h-full rounded-b-[40px]"
            />
            <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6 pt-4">
                {showLogo && (
                    <View className="flex-row justify-between items-center py-2">
                        <View className="bg-white/20 p-2 rounded-xl">
                            <Image
                                source={require('../../assets/iconeaplicativo.png')}
                                style={{ width: 80, height: 30 }}
                                resizeMode="contain"
                                tintColor="white"
                            />
                        </View>
                    </View>
                )}
                {title && (
                    <Text className="text-white text-2xl font-bold mb-2">{title}</Text>
                )}
                {subtitle && (
                    <Text className="text-white/80 text-base">{subtitle}</Text>
                )}
                {children}
            </SafeAreaView>
        </View>
    );
}
