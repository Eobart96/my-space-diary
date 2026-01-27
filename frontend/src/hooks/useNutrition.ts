import { useCallback, useEffect, useMemo, useState } from 'react';
import { NutritionEntry, CreateNutritionRequest, DailyNutritionSummary } from '../types';
import { nutritionAPI } from '../lib/api';

export const useNutrition = () => {
    const [entries, setEntries] = useState<NutritionEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizeDate = (value?: string) => {
        if (!value) return '';
        return value.split('T')[0];
    };

    const loadEntries = useCallback(async (date?: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await nutritionAPI.getEntries(date);
            setEntries(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load nutrition entries');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const addEntry = useCallback(async (entry: CreateNutritionRequest) => {
        try {
            setLoading(true);
            setError(null);
            const newEntry = await nutritionAPI.createEntry(entry);
            setEntries(prev => [...prev, newEntry]);
            return newEntry;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add nutrition entry';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEntry = useCallback(async (id: number, updates: Partial<NutritionEntry>) => {
        try {
            setLoading(true);
            setError(null);
            const updatedEntry = await nutritionAPI.updateEntry(id, updates);
            setEntries(prev =>
                prev.map(entry =>
                    entry.id === id ? updatedEntry : entry
                )
            );
            return updatedEntry;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update nutrition entry';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteEntry = useCallback(async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            await nutritionAPI.deleteEntry(id);
            setEntries(prev => prev.filter(entry => entry.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete nutrition entry';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const getEntries = useCallback((date?: string) => {
        let filtered = entries;
        if (date) {
            const d = normalizeDate(date);
            filtered = filtered.filter((entry) => normalizeDate(entry.date) === d);
        }

        // Sort by date and time
        return [...filtered].sort((a, b) => {
            const dateCompare = normalizeDate(b.date).localeCompare(normalizeDate(a.date));
            if (dateCompare !== 0) return dateCompare;
            return b.time.localeCompare(a.time);
        });
    }, [entries]);

    const getDailySummary = useCallback((date: string): DailyNutritionSummary => {
        const dayEntries = getEntries(date);

        const totalCalories = dayEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
        const totalProteins = dayEntries.reduce((sum, entry) => sum + (entry.proteins || 0), 0);
        const totalFats = dayEntries.reduce((sum, entry) => sum + (entry.fats || 0), 0);
        const totalCarbs = dayEntries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);

        return {
            date,
            totalCalories,
            totalProteins,
            totalFats,
            totalCarbs,
            entries: dayEntries
        };
    }, [getEntries]);

    const getDailySummaryFromAPI = useCallback(async (date: string): Promise<DailyNutritionSummary> => {
        try {
            setLoading(true);
            setError(null);
            return await nutritionAPI.getDailySummary(date);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get daily summary';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    return useMemo(
        () => ({
            entries,
            loading,
            error,
            addEntry,
            updateEntry,
            deleteEntry,
            getEntries,
            getDailySummary,
            getDailySummaryFromAPI,
            refreshEntries: loadEntries
        }),
        [entries, loading, error, addEntry, updateEntry, deleteEntry, getEntries, getDailySummary, getDailySummaryFromAPI, loadEntries]
    );
};
