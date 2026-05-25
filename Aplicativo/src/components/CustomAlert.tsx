import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
    visible: boolean;
    type?: AlertType;
    title: string;
    message: string;
    onClose: () => void;
    actionLabel?: string;
    onAction?: () => void;
    showSupportButton?: boolean; // Specific for blocked users
}

export function CustomAlert({
    visible,
    type = 'info',
    title,
    message,
    onClose,
    actionLabel = 'OK',
    onAction,
    showSupportButton = false,
}: CustomAlertProps) {

    if (!visible) return null;

    // Defines colors and icons based on type
    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'checkmark-circle',
                    color: '#22c55e', // green-500
                    bg: '#f0fdf4', // green-50
                    borderColor: '#bbf7d0', // green-200
                };
            case 'error':
                return {
                    icon: 'alert-circle',
                    color: '#ef4444', // red-500
                    bg: '#fef2f2', // red-50
                    borderColor: '#fecaca', // red-200
                };
            case 'warning':
                return {
                    icon: 'warning',
                    color: '#f59e0b', // amber-500
                    bg: '#fffbeb', // amber-50
                    borderColor: '#fde68a', // amber-200
                };
            default:
                return {
                    icon: 'information-circle',
                    color: '#3b82f6', // blue-500
                    bg: '#eff6ff', // blue-50
                    borderColor: '#bfdbfe', // blue-200
                };
        }
    };

    const config = getConfig();

    const handleSupportCall = () => {
        Linking.openURL('tel:08008710606');
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            {/* Backdrop with explicit RGBA color for better compatibility */}
            {/* Backdrop with explicit RGBA color for better compatibility */}
            <View
                className="flex-1 justify-center items-center px-4 z-50"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            >
                <Animated.View
                    entering={ZoomIn.duration(300).springify()}
                    className="bg-white overflow-hidden"
                    style={{
                        width: '90%',
                        maxWidth: 380,
                        borderRadius: 32,
                        paddingBottom: 8,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 10,
                        },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10, // Android shadow
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Header with Icon */}
                    <View className="items-center pt-8 pb-4">
                        <View
                            className="w-24 h-24 rounded-full items-center justify-center mb-6"
                            style={{ backgroundColor: config.bg }}
                        >
                            <Ionicons name={config.icon as any} size={48} color={config.color} />
                        </View>

                        <Text className="text-2xl font-bold text-slate-900 text-center px-6 mb-2">
                            {title}
                        </Text>
                    </View>

                    {/* Content */}
                    <View className="px-6 pb-4">
                        <Text className="text-slate-500 text-center leading-relaxed text-base">
                            {message}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View className="p-6 gap-4">
                        {showSupportButton && (
                            <TouchableOpacity
                                className="w-full bg-green-500 rounded-2xl py-4 flex-row items-center justify-center shadow-sm active:bg-green-600"
                                onPress={handleSupportCall}
                            >
                                <Ionicons name="call" size={22} color="white" style={{ marginRight: 10 }} />
                                <Text className="text-white font-bold text-lg">Ligar Agora (0800 871 0606)</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            className={`w-full rounded-2xl py-4 items-center justify-center ${showSupportButton ? 'bg-slate-100 active:bg-slate-200' : 'bg-purple-600 active:bg-purple-700 shadow-purple-200 shadow-lg'}`}
                            onPress={onAction || onClose}
                        >
                            <Text className={`font-bold text-lg ${showSupportButton ? 'text-slate-700' : 'text-white'}`}>
                                {actionLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
