
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, TouchableOpacity, View } from 'react-native';
import { getCityImageUrls } from '../utils/cityImages';

interface PromotionalModalProps {
    visible: boolean;
    onClose: () => void;
    cityName?: string; // ID da cidade do usuário (campo 'cidade' do IXC)
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PromotionalModal({ visible, onClose, cityName }: PromotionalModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setIsVisible(visible);
        if (visible) {
            setImageLoading(true);
            setCurrentIndex(0);
            // Obter URLs das imagens para a cidade
            const imageUrls = getCityImageUrls(cityName);
            setImages(imageUrls);
            setImageLoading(false);
        }
    }, [visible, cityName]);

    const handleClose = () => {
        setIsVisible(false);
        onClose();
    };

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const renderImage = ({ item }: { item: string }) => (
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <Image
                source={{ uri: item }}
                className="w-full h-full"
                style={{ resizeMode: 'contain' }}
            />
        </View>
    );

    const renderDots = () => {
        if (images.length <= 1) return null;

        return (
            <View className="absolute bottom-12 left-0 right-0 flex-row justify-center items-center">
                {images.map((_, index) => (
                    <View
                        key={index}
                        className={`w-2 h-2 rounded-full mx-1 ${index === currentIndex ? 'bg-white' : 'bg-white/40'
                            }`}
                    />
                ))}
            </View>
        );
    };

    return (
        <Modal
            animationType="fade"
            transparent={false}
            visible={isVisible}
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View className="flex-1 bg-black">
                {/* Image Area - Full Screen */}
                <View className="flex-1">
                    {imageLoading ? (
                        <View className="flex-1 items-center justify-center bg-black">
                            <ActivityIndicator size="large" color="#7c3aed" />
                        </View>
                    ) : images.length === 1 ? (
                        // Single image
                        <Image
                            source={{ uri: images[0] }}
                            className="w-full h-full"
                            style={{ resizeMode: 'contain' }}
                        />
                    ) : (
                        // Multiple images - Carousel
                        <>
                            <FlatList
                                data={images}
                                renderItem={renderImage}
                                keyExtractor={(item, index) => `${item}-${index}`}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onViewableItemsChanged={onViewableItemsChanged}
                                viewabilityConfig={viewabilityConfig}
                                snapToInterval={SCREEN_WIDTH}
                                decelerationRate="fast"
                            />
                            {renderDots()}
                        </>
                    )}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                    onPress={handleClose}
                    className="absolute z-50 bg-black/50 rounded-full p-3"
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={{ top: 50, right: 16 }}
                >
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

