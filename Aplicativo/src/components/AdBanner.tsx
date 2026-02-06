import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, View, Text, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Altura calculada para imagens 16:9 considerando padding lateral de 48px
const BANNER_WIDTH = SCREEN_WIDTH - 48;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH / (16 / 9)); // Proporção 16:9
const AUTO_SCROLL_INTERVAL = 5000; // 5 segundos

interface AdBannerProps {
    cityId?: string;
}

interface BannerResponse {
    cityId: string;
    folder: string | null;
    banners: string[];
}

export function AdBanner({ cityId }: AdBannerProps) {
    const [banners, setBanners] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Buscar banners do servidor
    useEffect(() => {
        console.log('AdBanner: cityId recebido:', cityId);

        if (!cityId) {
            console.log('AdBanner: cityId está vazio, não buscar banners');
            setLoading(false);
            return;
        }

        const fetchBanners = async () => {
            try {
                console.log('AdBanner: Buscando banners para cidade:', cityId);
                const response = await api.get<BannerResponse>(`/city-banners/${cityId}`);
                console.log('AdBanner: Resposta da API:', response.data);
                setBanners(response.data.banners || []);
            } catch (error) {
                console.error('Erro ao buscar banners:', error);
                setBanners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, [cityId]);

    // Auto-scroll
    useEffect(() => {
        if (banners.length <= 1) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                const nextIndex = (prev + 1) % banners.length;
                scrollViewRef.current?.scrollTo({
                    x: nextIndex * SCREEN_WIDTH,
                    animated: true,
                });
                return nextIndex;
            });
        }, AUTO_SCROLL_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [banners.length]);

    // Atualizar índice no scroll manual
    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    // Não renderizar se não houver banners
    if (!loading && banners.length === 0) {
        return null;
    }

    // Loading state
    if (loading) {
        return (
            <View
                className="bg-white rounded-2xl shadow-sm border border-slate-100 items-center justify-center"
                style={{ height: BANNER_HEIGHT }}
            >
                <ActivityIndicator size="small" color="#7c3aed" />
            </View>
        );
    }

    return (
        <Animated.View
            entering={FadeIn.duration(500)}
            className="bg-white rounded-3xl shadow-md overflow-hidden mb-4"
            style={{ height: BANNER_HEIGHT }}
        >
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
            >
                {banners.map((banner, index) => (
                    <View key={index} style={{ width: BANNER_WIDTH }}>
                        <Image
                            source={{ uri: api.defaults.baseURL + banner }}
                            style={{ width: '100%', height: BANNER_HEIGHT, borderRadius: 24 }}
                            contentFit="cover"
                            transition={300}
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Indicadores de página */}
            {banners.length > 1 && (
                <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                    {banners.map((_, index) => (
                        <View
                            key={index}
                            className={`w-2 h-2 rounded-full mx-1 ${index === currentIndex ? 'bg-purple-600' : 'bg-white/60'
                                }`}
                        />
                    ))}
                </View>
            )}
        </Animated.View>
    );
}
