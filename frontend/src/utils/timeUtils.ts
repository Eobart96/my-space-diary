export const getCurrentTime = (format: 'exact' | 'period'): string => {
    const now = new Date();

    if (format === 'exact') {
        return now.toTimeString().slice(0, 5); // HH:MM
    }

    // Time of day
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
};

export const getTimeOfDayLabel = (timeOfDay: string, language: 'en' | 'ru'): string => {
    const labels = {
        en: {
            morning: 'Morning',
            afternoon: 'Afternoon',
            evening: 'Evening',
            night: 'Night'
        },
        ru: {
            morning: 'Утро',
            afternoon: 'День',
            evening: 'Вечер',
            night: 'Ночь'
        }
    };

    return (labels[language] as any)[timeOfDay] || timeOfDay;
};

export const getTimeOfDayIcon = (timeOfDay: string): string => {
    const icons = {
        morning: '🌅',
        afternoon: '☀️',
        evening: '🌆',
        night: '🌙'
    };

    return (icons as any)[timeOfDay] || '🕐';
};
