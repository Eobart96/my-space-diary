export const storage = {
    get: (key: string) => {
        try {
            if (typeof window !== 'undefined') {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            }
            return null;
        } catch (error) {
            console.error(`Error getting localStorage key "${key}":`, error);
            return null;
        }
    },

    set: (key: string, value: any) => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(value));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
            return false;
        }
    },

    remove: (key: string) => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
            return false;
        }
    }
};
