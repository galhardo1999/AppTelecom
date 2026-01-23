import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';

/**
 * Hook para prevenir capturas de tela em telas sensíveis
 * 
 * @param enabled - Se true, previne screenshots. Se false, permite.
 * 
 * Uso:
 * ```tsx
 * function SensitiveScreen() {
 *     useScreenSecurity(true);
 *     return <View>...</View>;
 * }
 * ```
 */
export function useScreenSecurity(enabled: boolean = true) {
    useEffect(() => {
        const toggleScreenCapture = async () => {
            try {
                if (enabled) {
                    await ScreenCapture.preventScreenCaptureAsync();
                } else {
                    await ScreenCapture.allowScreenCaptureAsync();
                }
            } catch (error) {
                // Screen capture pode não estar disponível em todos os dispositivos
                console.warn('Screen capture control not available:', error);
            }
        };

        toggleScreenCapture();

        // Cleanup: allow screen capture when unmounting
        return () => {
            ScreenCapture.allowScreenCaptureAsync().catch(() => {
                // Ignore cleanup errors
            });
        };
    }, [enabled]);
}

/**
 * Hook para adicionar listener de tentativas de screenshot
 * Útil para logging/analytics
 * 
 * @param onCapture - Callback chamado quando usuário tenta capturar tela
 */
export function useScreenCaptureListener(onCapture?: () => void) {
    useEffect(() => {
        if (!onCapture) return;

        const subscription = ScreenCapture.addScreenshotListener(() => {
            console.log('Screenshot attempt detected');
            onCapture();
        });

        return () => {
            subscription.remove();
        };
    }, [onCapture]);
}
