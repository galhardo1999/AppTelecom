
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface PromotionalModalProps {
    visible: boolean;
    onClose: () => void;
}

export function PromotionalModal({ visible, onClose }: PromotionalModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(visible);
    }, [visible]);

    const handleClose = () => {
        setIsVisible(false);
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
        >
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="bg-white w-full rounded-3xl overflow-hidden shadow-2xl relative">

                    {/* Close Button */}
                    <TouchableOpacity
                        onPress={handleClose}
                        className="absolute top-4 right-4 z-10 bg-black/20 rounded-full p-1"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Image / Header Area */}
                    <View className="h-48 w-full relative">
                        <LinearGradient
                            colors={['#7e22ce', '#db2777']}
                            className="absolute w-full h-full"
                        />
                        <View className="flex-1 justify-center items-center">
                            <Ionicons name="gift-outline" size={64} color="white" />
                            <Text className="text-white font-bold text-2xl mt-2">Oferta Especial!</Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="p-6 items-center">
                        <Text className="text-slate-800 text-xl font-bold text-center mb-2">
                            Aumente sua Internet
                        </Text>
                        <Text className="text-slate-500 text-center mb-6 leading-5">
                            Dobro de velocidade por apenas + R$ 10,00 na sua mensalidade. Aproveite por tempo limitado!
                        </Text>

                        <TouchableOpacity
                            className="bg-purple-600 w-full py-4 rounded-xl items-center mb-3 shadow-lg shadow-purple-200"
                            onPress={handleClose}
                        >
                            <Text className="text-white font-bold text-lg">EU QUERO!</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="w-full py-3 rounded-xl items-center"
                            onPress={handleClose}
                        >
                            <Text className="text-slate-400 font-medium">Agora não</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
