/**
 * Toast utility for showing feedback messages
 */
import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * Show a toast notification
 * Uses ToastAndroid on Android, Alert on iOS
 */
export const showToast = (message: string): void => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
        Alert.alert('', message);
    }
};
