import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreateDiaryRequest, DiaryEntry } from '../types';

const STORAGE_KEY = 'diary-data';

const readEntries = (): DiaryEntry[] => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.entries)) return parsed.entries;
        return [];
    } catch {
        return [];
    }
};

const writeEntries = (entries: DiaryEntry[]) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const useDiary = () => {
    const [entries, setEntries] = useState<DiaryEntry[]>(() => {
        if (typeof window === 'undefined') return [];
        return readEntries();
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        writeEntries(entries);
    }, [entries]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onStorage = (e: StorageEvent) => {
            if (e.key !== STORAGE_KEY) return;
            setEntries(readEntries());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const addEntry = useCallback((entry: CreateDiaryRequest) => {
        const now = new Date().toISOString();
        const newEntry: DiaryEntry = {
            id: Date.now(),
            user_id: 1,
            ...entry,
            created_at: now,
            updated_at: now
        };

        setEntries((prev) => [...prev, newEntry]);
    }, []);

    const updateEntry = useCallback((id: number, updates: Partial<DiaryEntry>) => {
        setEntries((prev) =>
            prev.map((entry) =>
                entry.id === id
                    ? { ...entry, ...updates, updated_at: new Date().toISOString() }
                    : entry
            )
        );
    }, []);

    const deleteEntry = useCallback((id: number) => {
        console.log('useDiary deleteEntry called with id:', id);
        setEntries((prev) => {
            console.log('Previous entries:', prev);
            const filtered = prev.filter((entry) => entry.id !== id);
            console.log('After delete:', filtered);
            return filtered;
        });
    }, []);

    // Debug log for entries
    useEffect(() => {
        console.log('useDiary entries updated:', entries);
    }, [entries]);

    const getEntries = useCallback(
        (date?: string) => {
            let filtered = entries;
            if (date) {
                filtered = filtered.filter((entry) => entry.date === date);
            }

            return [...filtered].sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare !== 0) return dateCompare;
                return b.created_at.localeCompare(a.created_at);
            });
        },
        [entries]
    );

    return useMemo(
        () => ({
            entries,
            addEntry,
            updateEntry,
            deleteEntry,
            getEntries
        }),
        [entries, addEntry, updateEntry, deleteEntry, getEntries]
    );
};
