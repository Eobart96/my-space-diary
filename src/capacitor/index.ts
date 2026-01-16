import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isWeb = Capacitor.getPlatform() === 'web';

// Platform-specific initialization
export const initPlatform = () => {
    if (isNative) {
        console.log('Running on native platform:', Capacitor.getPlatform());

        // Initialize platform-specific features
        if (isAndroid) {
            // Android-specific initialization
            document.addEventListener('deviceready', () => {
                console.log('Android device ready');
            });
        }
    } else {
        console.log('Running on web platform');
    }
};

// Platform-specific URL handling
export const getServerUrl = () => {
    if (isNative) {
        return 'http://10.0.2.2:5173'; // Android emulator localhost
    }
    return 'http://localhost:5173';
};

// Export Capacitor instance for global access
export { Capacitor };
