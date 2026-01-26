import { useCallback } from 'react';
import { NutritionEntry, CreateNutritionRequest, DailyNutritionSummary } from '../types';

interface NutritionData {
    entries: NutritionEntry[];
}

const storage = {
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
    }
};

export const useNutrition = () => {
    const getData = (): NutritionData => {
        const data = storage.get('nutrition-data');
        return data || { entries: [] };
    };

    const setData = (data: NutritionData) => {
        storage.set('nutrition-data', data);
    };

    const addEntry = useCallback((entry: CreateNutritionRequest) => {
        const data = getData();
        const newEntry: NutritionEntry = {
            id: Date.now(),
            user_id: 1, // Temporary for local storage
            ...entry,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updatedData = {
            ...data,
            entries: [...data.entries, newEntry]
        };

        setData(updatedData);
    }, []);

    const updateEntry = useCallback((id: number, updates: Partial<NutritionEntry>) => {
        const data = getData();
        const updatedData = {
            ...data,
            entries: data.entries.map((entry: any) =>
                entry.id === id
                    ? { ...entry, ...updates, updated_at: new Date().toISOString() }
                    : entry
            )
        };

        setData(updatedData);
    }, []);

    const deleteEntry = useCallback((id: number) => {
        const data = getData();
        const updatedData = {
            ...data,
            entries: data.entries.filter((entry: any) => entry.id !== id)
        };

        setData(updatedData);
    }, []);

    const getEntries = useCallback((date?: string) => {
        const data = getData();
        let filtered = data.entries;

        if (date) {
            filtered = filtered.filter((entry: any) => entry.date === date);
        }

        // Sort by date and time
        filtered.sort((a: any, b: any) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.time.localeCompare(a.time);
        });

        return filtered;
    }, []);

    const getDailySummary = useCallback((date: string): DailyNutritionSummary => {
        const dayEntries = getEntries(date);

        const totalCalories = dayEntries.reduce((sum: number, entry: any) => sum + (entry.calories || 0), 0);
        const totalProteins = dayEntries.reduce((sum: number, entry: any) => sum + (entry.proteins || 0), 0);
        const totalFats = dayEntries.reduce((sum: number, entry: any) => sum + (entry.fats || 0), 0);
        const totalCarbs = dayEntries.reduce((sum: number, entry: any) => sum + (entry.carbs || 0), 0);

        return {
            date,
            totalCalories,
            totalProteins,
            totalFats,
            totalCarbs,
            entries: dayEntries
        };
    }, []);

    return {
        entries: getData().entries,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntries,
        getDailySummary
    };
};
