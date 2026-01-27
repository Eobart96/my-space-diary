import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreateDiaryRequest, DiaryEntry } from '../types';
import { diaryAPI } from '../lib/api';

export const useDiary = () => {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
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
            const data = await diaryAPI.getEntries(date);
            setEntries(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load diary entries');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const addEntry = useCallback(async (entry: CreateDiaryRequest) => {
        try {
            setLoading(true);
            setError(null);
            const newEntry = await diaryAPI.createEntry(entry);
            setEntries(prev => [...prev, newEntry]);
            return newEntry;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add diary entry';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEntry = useCallback(async (id: number, updates: Partial<DiaryEntry>) => {
        try {
            setLoading(true);
            setError(null);
            const updatedEntry = await diaryAPI.updateEntry(id, updates);
            setEntries(prev =>
                prev.map(entry =>
                    entry.id === id ? updatedEntry : entry
                )
            );
            return updatedEntry;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update diary entry';
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
            await diaryAPI.deleteEntry(id);
            setEntries(prev => prev.filter(entry => entry.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete diary entry';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const getEntries = useCallback(
        (date?: string) => {
            let filtered = entries;
            if (date) {
                const d = normalizeDate(date);
                filtered = filtered.filter((entry) => normalizeDate(entry.date) === d);
            }

            return [...filtered].sort((a, b) => {
                const dateCompare = normalizeDate(b.date).localeCompare(normalizeDate(a.date));
                if (dateCompare !== 0) return dateCompare;
                const timeCompare = (b.time || '').localeCompare(a.time || '');
                if (timeCompare !== 0) return timeCompare;
                return b.created_at.localeCompare(a.created_at);
            });
        },
        [entries]
    );

    return useMemo(
        () => ({
            entries,
            loading,
            error,
            addEntry,
            updateEntry,
            deleteEntry,
            getEntries,
            refreshEntries: loadEntries
        }),
        [entries, loading, error, addEntry, updateEntry, deleteEntry, getEntries]
    );
};
