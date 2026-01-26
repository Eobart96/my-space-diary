import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

type Language = 'en' | 'ru';

interface LanguageContextType {
    language: Language;
    t: (key: string) => string;
}

const translations = {
    en: {
        diary: 'Diary',
        nutrition: 'Nutrition',
        mySpace: 'My Space',
        welcome: 'Welcome back',
        today: 'Today',
        addEntry: 'Add Entry',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        date: 'Date',
        time: 'Time',
        title: 'Title',
        text: 'Text',
        mood: 'Mood',
        calories: 'Calories',
        proteins: 'Proteins',
        fats: 'Fats',
        carbs: 'Carbs',
        dailySummary: 'Daily Summary',
        totalCalories: 'Total Calories',
        totalProteins: 'Total Proteins',
        totalFats: 'Total Fats',
        totalCarbs: 'Total Carbs',
        noEntries: 'No entries yet',
        createFirst: 'Create your first entry',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        night: 'Night'
    },
    ru: {
        diary: 'Дневник',
        nutrition: 'Питание',
        mySpace: 'Мое Пространство',
        welcome: 'Добро пожаловать',
        today: 'Сегодня',
        addEntry: 'Добавить запись',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        edit: 'Редактировать',
        date: 'Дата',
        time: 'Время',
        title: 'Заголовок',
        text: 'Текст',
        mood: 'Настроение',
        calories: 'Калории',
        proteins: 'Белки',
        fats: 'Жиры',
        carbs: 'Углеводы',
        dailySummary: 'Дневная сводка',
        totalCalories: 'Всего калорий',
        totalProteins: 'Всего белков',
        totalFats: 'Всего жиров',
        totalCarbs: 'Всего углеводов',
        noEntries: 'Пока нет записей',
        createFirst: 'Создайте свою первую запись',
        loading: 'Загрузка...',
        error: 'Ошибка',
        success: 'Успешно',
        morning: 'Утро',
        afternoon: 'День',
        evening: 'Вечер',
        night: 'Ночь'
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const { settings } = useSettings();

    const t = (key: string): string => {
        const lang = translations[settings.language];
        return (lang as any)[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language: settings.language, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
