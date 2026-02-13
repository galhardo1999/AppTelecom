import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
const BIOMETRICS_CREDENTIALS_KEY = 'biometrics_credentials';

interface BiometricsState {
    isSupported: boolean;
    biometryType: LocalAuthentication.AuthenticationType | null;
    isEnabled: boolean;
    isLoading: boolean;
    storedEmail: string | null;
}

interface UseBiometricsReturn extends BiometricsState {
    /**
     * Enables biometric authentication for the current user
     * Must be called after a successful login to save credentials
     */
    enableBiometrics: (email: string, password: string) => Promise<boolean>;

    /**
     * Disables biometric authentication
     */
    disableBiometrics: () => Promise<void>;

    /**
     * Authenticates the user using biometrics and returns saved credentials
     */
    authenticateWithBiometrics: () => Promise<{ email: string; password: string } | null>;

    /**
     * Checks if biometrics can be used (device supports + user enabled)
     */
    canUseBiometrics: boolean;
}

/**
 * Hook para gerenciar autenticação biométrica
 */
export function useBiometrics(): UseBiometricsReturn {
    const [state, setState] = useState<BiometricsState>({
        isSupported: false,
        biometryType: null,
        isEnabled: false,
        isLoading: true,
        storedEmail: null,
    });

    // Check device support on mount
    useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            // Check if hardware is available
            const compatible = await LocalAuthentication.hasHardwareAsync();

            if (!compatible) {
                setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
                return;
            }

            // Check if biometrics are enrolled
            const enrolled = await LocalAuthentication.isEnrolledAsync();

            if (!enrolled) {
                setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
                return;
            }

            // Get biometry type (Face ID, Touch ID, Fingerprint)
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            const primaryType = types.length > 0 ? types[0] : null;

            // Check if user has enabled biometrics in the app
            const enabledValue = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
            const isEnabled = enabledValue === 'true';

            // Get stored email if enabled
            let storedEmail = null;
            if (isEnabled) {
                const credentialsJson = await SecureStore.getItemAsync(BIOMETRICS_CREDENTIALS_KEY);
                if (credentialsJson) {
                    const { email } = JSON.parse(credentialsJson);
                    storedEmail = email;
                }
            }

            setState({
                isSupported: true,
                biometryType: primaryType,
                isEnabled,
                isLoading: false,
                storedEmail,
            });
        } catch (error) {
            console.error('Error checking biometric support:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const enableBiometrics = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            // First, verify the user with biometrics
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirme sua identidade para ativar a biometria',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });

            if (!result.success) {
                return false;
            }

            // Save credentials securely
            await SecureStore.setItemAsync(
                BIOMETRICS_CREDENTIALS_KEY,
                JSON.stringify({ email, password })
            );

            // Mark as enabled
            await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');

            setState(prev => ({ ...prev, isEnabled: true, storedEmail: email }));
            return true;
        } catch (error) {
            console.error('Error enabling biometrics:', error);
            return false;
        }
    }, []);

    const disableBiometrics = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync(BIOMETRICS_CREDENTIALS_KEY);
            await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
            setState(prev => ({ ...prev, isEnabled: false, storedEmail: null }));
        } catch (error) {
            console.error('Error disabling biometrics:', error);
        }
    }, []);

    const authenticateWithBiometrics = useCallback(async (): Promise<{ email: string; password: string } | null> => {
        try {
            // Check if enabled first
            const enabledValue = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
            if (enabledValue !== 'true') {
                return null;
            }

            // Authenticate
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Entre com sua biometria',
                cancelLabel: 'Usar senha',
                disableDeviceFallback: false,
            });

            if (!result.success) {
                return null;
            }

            // Retrieve credentials
            const credentialsJson = await SecureStore.getItemAsync(BIOMETRICS_CREDENTIALS_KEY);
            if (!credentialsJson) {
                return null;
            }

            return JSON.parse(credentialsJson);
        } catch (error) {
            console.error('Error authenticating with biometrics:', error);
            return null;
        }
    }, []);

    return {
        ...state,
        enableBiometrics,
        disableBiometrics,
        authenticateWithBiometrics,
        canUseBiometrics: state.isSupported && state.isEnabled && !state.isLoading,
    };
}

/**
 * Returns the label for the biometry type
 */
export function getBiometryLabel(type: LocalAuthentication.AuthenticationType | null): string {
    if (!type) return 'Biometria';

    switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Digital';
        case LocalAuthentication.AuthenticationType.IRIS:
            return 'Íris';
        default:
            return 'Biometria';
    }
}

/**
 * Returns the icon name for the biometry type
 */
export function getBiometryIcon(type: LocalAuthentication.AuthenticationType | null): string {
    if (!type) return 'finger-print-outline';

    switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'scan-outline';
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'finger-print-outline';
        default:
            return 'finger-print-outline';
    }
}
