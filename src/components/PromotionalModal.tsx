
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Modal, TouchableOpacity, View } from 'react-native';

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
                <View className="relative w-full h-[70vh] items-center justify-center">

                    {/* Image Area */}
                    <View className="w-full h-full rounded-2xl overflow-hidden pointer-events-none">
                        <Image
                            source={require('../../assets/imagem.jpg')}
                            className="w-full h-full"
                            style={{ resizeMode: 'contain' }}
                        />
                    </View>

                    {/* Close Button - After image, high index/elevation */}
                    <TouchableOpacity
                        onPress={handleClose}
                        className="absolute top-0 right-0 z-50 bg-white rounded-full p-2 shadow-xl elevation-10"
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        style={{ elevation: 10 }} // Explicit style for Android safety
                    >
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
