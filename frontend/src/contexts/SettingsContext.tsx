import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Settings {
    language: 'en' | 'ru';
    timeFormat: 'exact' | 'period'; // exact - точное время, period - время суток
    dateFormat: string;
    sortBy: 'date' | 'created';
    order: 'asc' | 'desc';
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (settings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
    language: 'en',
    timeFormat: 'period',
    dateFormat: 'YYYY-MM-DD',
    sortBy: 'date',
    order: 'desc'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('myspace-settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('myspace-settings', JSON.stringify(updated));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
