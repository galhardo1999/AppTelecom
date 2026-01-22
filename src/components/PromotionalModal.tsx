
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
                <View className="relative w-full" style={{ aspectRatio: 0.65 }}>

                    {/* Image Area */}
                    <View className="w-full h-full rounded-2xl overflow-hidden">
                        <Image
                            source={require('../../assets/imagem.jpg')}
                            className="w-full h-full"
                            style={{ resizeMode: 'cover' }}
                        />
                    </View>

                    {/* Close Button - positioned at top-right corner of image (AFTER image so it's on top) */}
                    <TouchableOpacity
                        onPress={handleClose}
                        className="absolute z-50 bg-white rounded-full p-2 shadow-xl"
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        style={{ elevation: 10, top: 8, right: 8 }}
                    >
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
