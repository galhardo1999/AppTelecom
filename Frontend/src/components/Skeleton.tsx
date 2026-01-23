import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, View, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

/**
 * Componente base de Skeleton com animação pulse
 */
export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#e2e8f0',
                    opacity,
                },
                style,
            ]}
        />
    );
}

/**
 * Skeleton para linha de texto
 */
export function SkeletonLine({ width = '100%', height = 16 }: { width?: DimensionValue; height?: number }) {
    return <Skeleton width={width} height={height} borderRadius={4} />;
}

/**
 * Skeleton para círculo/avatar
 */
export function SkeletonCircle({ size = 48 }: { size?: number }) {
    return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

/**
 * Skeleton para card de fatura
 */
export function SkeletonInvoiceCard() {
    return (
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                    <SkeletonCircle size={48} />
                    <View className="ml-3">
                        <SkeletonLine width={120} height={18} />
                        <View className="mt-2">
                            <SkeletonLine width={80} height={14} />
                        </View>
                    </View>
                </View>
                <SkeletonLine width={60} height={24} />
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 my-3" />

            {/* Details */}
            <View className="flex-row justify-between">
                <SkeletonLine width={100} height={14} />
                <SkeletonLine width={80} height={14} />
            </View>
        </View>
    );
}

/**
 * Skeleton para card de consumo
 */
export function SkeletonConsumptionCard() {
    return (
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                    <SkeletonCircle size={48} />
                    <View className="ml-3">
                        <SkeletonLine width={140} height={18} />
                        <View className="mt-2">
                            <SkeletonLine width={60} height={14} />
                        </View>
                    </View>
                </View>
                <View className="items-end">
                    <SkeletonLine width={80} height={12} />
                    <View className="mt-1">
                        <SkeletonLine width={50} height={14} />
                    </View>
                </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 my-3" />

            {/* Traffic boxes */}
            <View className="flex-row mb-4">
                <View className="flex-1 bg-slate-50 rounded-xl p-4 mr-2">
                    <SkeletonLine width={80} height={14} />
                    <View className="mt-2">
                        <SkeletonLine width={60} height={20} />
                    </View>
                </View>
                <View className="flex-1 bg-slate-50 rounded-xl p-4 ml-2">
                    <SkeletonLine width={80} height={14} />
                    <View className="mt-2">
                        <SkeletonLine width={60} height={20} />
                    </View>
                </View>
            </View>

            {/* Connection details */}
            <View className="bg-slate-50 rounded-xl p-4">
                <SkeletonLine width={140} height={16} />
                <View className="flex-row mt-3">
                    <View className="flex-1">
                        <SkeletonLine width={80} height={12} />
                        <View className="mt-1">
                            <SkeletonLine width={100} height={14} />
                        </View>
                    </View>
                    <View className="flex-1">
                        <SkeletonLine width={80} height={12} />
                        <View className="mt-1">
                            <SkeletonLine width={120} height={14} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

/**
 * Skeleton para a tela de faturas (área do header com valor)
 */
export function SkeletonInvoiceHeader() {
    return (
        <View className="flex-1">
            {/* Selector skeleton */}
            <SkeletonLine width={100} height={14} />
            <View className="mt-2 mb-4">
                <Skeleton width="100%" height={48} borderRadius={12} />
            </View>

            {/* Address skeleton */}
            <View className="flex-row items-center mb-2">
                <SkeletonCircle size={16} />
                <View className="ml-2">
                    <SkeletonLine width={150} height={12} />
                </View>
            </View>

            {/* Value skeleton */}
            <View className="mt-2">
                <SkeletonLine width={200} height={48} />
                <View className="flex-row justify-between mt-2">
                    <SkeletonLine width={100} height={16} />
                    <SkeletonLine width={120} height={14} />
                </View>
            </View>
        </View>
    );
}

/**
 * Skeleton para botões de ação
 */
export function SkeletonActionButton() {
    return (
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex-row items-center border border-slate-100">
            <SkeletonCircle size={48} />
            <View className="ml-4 flex-1">
                <SkeletonLine width="70%" height={20} />
            </View>
        </View>
    );
}

/**
 * Lista de skeletons para ações
 */
export function SkeletonActionList({ count = 3 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonActionButton key={i} />
            ))}
        </View>
    );
}
