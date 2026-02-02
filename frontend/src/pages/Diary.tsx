import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Calendar, ArrowLeft, Search, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { DiaryEntry, CreateDiaryRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useDiary } from '../hooks/useDiary';
import { uploadsAPI } from '../lib/api';
import { getCurrentTime, getTimeOfDayIcon, getTimeOfDayLabel } from '../utils/timeUtils';

const moodEmojis = {
    1: '😢',
    2: '😐',
    3: '😊',
    4: '😍',
    5: '🤩'
};

const moodColors = {
    1: 'from-red-500 to-orange-500',
    2: 'from-yellow-500 to-orange-500',
    3: 'from-green-500 to-teal-500',
    4: 'from-blue-500 to-purple-500',
    5: 'from-purple-500 to-pink-500'
};

const Diary: React.FC = () => {
    const { t, language } = useLanguage();
    const { settings, updateSettings } = useSettings();

    const { entries, loading, error, addEntry, updateEntry, deleteEntry, getEntries, refreshEntries } = useDiary();
    const [isCreating, setIsCreating] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
    const rawApiBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
    const normalizedApiBaseUrl = rawApiBaseUrl ? rawApiBaseUrl.replace(/\/$/, '') : '';
    const uploadsBaseUrl = normalizedApiBaseUrl
        ? (normalizedApiBaseUrl.endsWith('/api') ? normalizedApiBaseUrl.slice(0, -4) : normalizedApiBaseUrl)
        : '';
    const apiBaseUrl = normalizedApiBaseUrl
        ? (normalizedApiBaseUrl.endsWith('/api') ? normalizedApiBaseUrl : `${normalizedApiBaseUrl}/api`)
        : '/api';
    const getLocalDateString = (date: Date = new Date()) => {
        const tzOffsetMs = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffsetMs).toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMood, setSelectedMood] = useState<number>(3);
    const [photoUploading, setPhotoUploading] = useState(false);

    useEffect(() => {
        refreshEntries();
    }, [refreshEntries]);

    const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<CreateDiaryRequest>({
        defaultValues: {
            date: getLocalDateString(),
            time: getCurrentTime(settings.timeFormat),
            text: '',
            mood: 3
        }
    });

    useEffect(() => {
        if (isCreating && !editingEntry) {
            const now = new Date();
            const dateValue = selectedDate || getLocalDateString(now);
            const timeValue = getCurrentTime(settings.timeFormat);
            setValue('date', dateValue, { shouldValidate: true });
            setValue('time', timeValue, { shouldValidate: true });
            setSelectedMood(3);
        }
    }, [isCreating, editingEntry, selectedDate, settings.timeFormat, setValue]);

    const filteredEntries = useMemo(() => {
        const entriesForDate = getEntries(selectedDate || undefined);
        if (!searchTerm) return entriesForDate;
        const q = searchTerm.toLowerCase();
        return entriesForDate.filter((entry: DiaryEntry) =>
            entry.text.toLowerCase().includes(q) ||
            entry.date.includes(searchTerm)
        );
    }, [getEntries, selectedDate, searchTerm]);

    const timeOfDayKeys = new Set(['morning', 'afternoon', 'evening', 'night']);

    const isTimeOfDay = (value?: string) => {
        return Boolean(value && timeOfDayKeys.has(value));
    };

    const getTimeDisplay = (time?: string) => {
        if (!time) return '12:00';
        return isTimeOfDay(time) ? getTimeOfDayLabel(time, language) : time;
    };

    const getTimeIcon = (time?: string) => {
        return isTimeOfDay(time) ? getTimeOfDayIcon(time!) : '🕐';
    };

    const normalizePhotoUrl = (url?: string | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/uploads')) {
            return uploadsBaseUrl ? `${uploadsBaseUrl}${url}` : url;
        }
        if (url.startsWith('uploads/')) {
            return uploadsBaseUrl ? `${uploadsBaseUrl}/${url}` : `/${url}`;
        }
        return `${apiBaseUrl}/telegram-files?file_id=${encodeURIComponent(url)}`;
    };

    const getEntryPhotoUrls = (entry: DiaryEntry) => {
        const rawUrls = Array.isArray(entry.photo_urls) && entry.photo_urls.length
            ? entry.photo_urls
            : entry.photo_url
                ? [entry.photo_url]
                : [];
        return rawUrls
            .map((url) => normalizePhotoUrl(url))
            .filter((url): url is string => Boolean(url))
            .slice(0, 3);
    };

    const onSubmit = async (data: CreateDiaryRequest) => {
        const submitData = { ...data };
        if (editingEntry) {
            await updateEntry(editingEntry.id, submitData);
        } else {
            submitData.date = submitData.date || getLocalDateString();
            await addEntry(submitData);
        }
        await refreshEntries();
        reset();
        setIsCreating(false);
        setEditingEntry(null);
    };

    const handleEdit = (entry: DiaryEntry) => {
        setEditingEntry(entry);
        reset({
            date: entry.date?.split('T')[0] || getLocalDateString(),
            time: entry.time || new Date(entry.created_at).toTimeString().slice(0, 5),
            text: entry.text,
            mood: entry.mood || undefined,
            photo_url: entry.photo_url || ''
        });
    };

    const handlePhotoUpload = async (file?: File) => {
        if (!file) return;
        try {
            setPhotoUploading(true);
            const result = await uploadsAPI.upload(file);
            setValue('photo_url', result.url, { shouldValidate: false });
        } catch (error) {
            console.error('Photo upload failed:', error);
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(language === 'en' ? 'Are you sure?' : 'Вы уверены?')) {
            await deleteEntry(id);
            await refreshEntries();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            {language === 'en' ? 'Back' : 'Назад'}
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{t('diary')}</h1>
                            <p className="text-white/80">{t('welcome')}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{t('addEntry')}</span>
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="bg-white/10 backdrop-blur-lg border border-white/20 text-white p-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl mb-8">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors rounded-2xl"
                    >
                        <div className="flex items-center space-x-4">
                            <Search className="w-5 h-5 text-white/60" />
                            <span className="text-white/80">{language === 'en' ? 'Filters' : 'Фильтры'}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-white/60 text-sm">
                                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                            </span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>

                    {showFilters && (
                        <div className="p-4 pt-0 space-y-4">
                            {/* Search Bar */}
                            <div className="flex items-center space-x-4">
                                <Search className="w-5 h-5 text-white/60" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={language === 'en' ? 'Search entries...' : 'Поиск записей...'}
                                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                            </div>

                            {/* Date Selector */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Calendar className="w-5 h-5 text-white" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                    {selectedDate && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDate('')}
                                            className="text-white/70 hover:text-white text-sm underline"
                                        >
                                            {language === 'en' ? 'All dates' : 'Все даты'}
                                        </button>
                                    )}
                                </div>
                                <div className="text-white/60 text-sm">
                                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'} {language === 'en' ? 'total' : 'всего'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-md w-full">
                            <h2 className="text-2xl font-bold text-white mb-6">
                                {language === 'en' ? 'Diary Settings' : 'Настройки дневника'}
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-white/80 mb-3 flex items-center">
                                        <span className="text-2xl mr-2">🕐</span>
                                        {language === 'en' ? 'Time Format' : 'Формат времени'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => updateSettings({ timeFormat: 'exact' })}
                                            className={`p-4 rounded-xl border-2 transition-all duration-300 ${settings.timeFormat === 'exact'
                                                ? 'border-white/50 bg-white/10'
                                                : 'border-white/20 bg-white/5 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="text-xl mb-1">🕐</div>
                                            <div className="text-white font-semibold text-sm">
                                                {language === 'en' ? 'Exact' : 'Точное'}
                                            </div>
                                            <div className="text-white/60 text-xs mt-1">14:30</div>
                                        </button>
                                        <button
                                            onClick={() => updateSettings({ timeFormat: 'period' })}
                                            className={`p-4 rounded-xl border-2 transition-all duration-300 ${settings.timeFormat === 'period'
                                                ? 'border-white/50 bg-white/10'
                                                : 'border-white/20 bg-white/5 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="text-xl mb-1">🌅</div>
                                            <div className="text-white font-semibold text-sm">
                                                {language === 'en' ? 'Period' : 'Время суток'}
                                            </div>
                                            <div className="text-white/60 text-xs mt-1">
                                                {language === 'en' ? 'Morning, Evening' : 'Утро, Вечер'}
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2">
                                        {language === 'en' ? 'Date Format' : 'Формат даты'}
                                    </label>
                                    <select
                                        value={settings.dateFormat}
                                        onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                    >
                                        <option value="YYYY-MM-DD" className="bg-white text-black">YYYY-MM-DD</option>
                                        <option value="DD/MM/YYYY" className="bg-white text-black">DD/MM/YYYY</option>
                                        <option value="MM/DD/YYYY" className="bg-white text-black">MM/DD/YYYY</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2">
                                        {language === 'en' ? 'Sort By' : 'Сортировка'}
                                    </label>
                                    <select
                                        value={settings.sortBy}
                                        onChange={(e) => updateSettings({ sortBy: e.target.value as 'date' | 'created' })}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                    >
                                        <option value="date" className="bg-white text-black">{language === 'en' ? 'Date' : 'Дата'}</option>
                                        <option value="created" className="bg-white text-black">{language === 'en' ? 'Created' : 'Создано'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2">
                                        {language === 'en' ? 'Order' : 'Порядок'}
                                    </label>
                                    <select
                                        value={settings.order}
                                        onChange={(e) => updateSettings({ order: e.target.value as 'asc' | 'desc' })}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                    >
                                        <option value="desc" className="bg-white text-black">{language === 'en' ? 'Newest First' : 'Сначала новые'}</option>
                                        <option value="asc" className="bg-white text-black">{language === 'en' ? 'Oldest First' : 'Сначала старые'}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Form */}
                {(isCreating || editingEntry) && (
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingEntry ? t('edit') : t('addEntry')}
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/80 mb-2">{t('date')}</label>
                                    <input
                                        {...register('date', { required: true })}
                                        type="date"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                    {errors.date && <p className="text-red-400 text-sm mt-1">Date is required</p>}
                                </div>
                                <div>
                                    <label className="block text-white/80 mb-2">{t('time')}</label>
                                    {settings.timeFormat === 'exact' ? (
                                        <input
                                            {...register('time', { required: true })}
                                            type="time"
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                        />
                                    ) : (
                                        <select
                                            {...register('time', { required: true })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                        >
                                            <option value="morning" className="bg-white text-black">{t('morning')}</option>
                                            <option value="afternoon" className="bg-white text-black">{t('afternoon')}</option>
                                            <option value="evening" className="bg-white text-black">{t('evening')}</option>
                                            <option value="night" className="bg-white text-black">{t('night')}</option>
                                        </select>
                                    )}
                                    {errors.time && <p className="text-red-400 text-sm mt-1">Time is required</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">{t('text')}</label>
                                <textarea
                                    {...register('text', { required: true })}
                                    rows={4}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder={t('writeSomething')}
                                />
                                {errors.text && <p className="text-red-400 text-sm mt-1">Text is required</p>}
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">
                                    {language === 'en' ? 'Photo URL (optional)' : 'Ссылка на фото (необязательно)'}
                                </label>
                                <input
                                    {...register('photo_url')}
                                    type="url"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder={language === 'en' ? 'https://...' : 'https://...'}
                                />
                                <div className="mt-3">
                                    <label className="block text-white/60 text-sm mb-2">
                                        {language === 'en' ? 'Or upload from device' : 'Или загрузить с устройства'}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                                        className="block w-full text-white/70 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    />
                                    {photoUploading && (
                                        <p className="text-white/60 text-sm mt-2">
                                            {language === 'en' ? 'Uploading...' : 'Загрузка...'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">{t('mood')}</label>
                                <div className="flex space-x-4">
                                    {[1, 2, 3, 4, 5].map((mood) => {
                                        const emoji = moodEmojis[mood as keyof typeof moodEmojis];
                                        return (
                                            <button
                                                key={mood}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMood(mood);
                                                    setValue('mood', mood);
                                                }}
                                                className={`p-3 rounded-lg border-2 transition-all duration-300 ${selectedMood === mood || (editingEntry?.mood === mood)
                                                    ? 'border-white/50 bg-white/10'
                                                    : 'border-white/20 bg-white/5 hover:border-white/30'
                                                    }`}
                                            >
                                                <span className="text-2xl">{emoji}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <input
                                    {...register('mood')}
                                    type="hidden"
                                />
                            </div>

                            <div className="flex justify-between space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        reset();
                                        setIsCreating(false);
                                        setEditingEntry(null);
                                    }}
                                    className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    {editingEntry ? t('save') : t('addEntry')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                        <p className="text-white/60">{language === 'en' ? 'Loading...' : 'Загрузка...'}</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-200">{error}</p>
                        <button
                            onClick={() => refreshEntries()}
                            className="mt-2 text-red-200 hover:text-white underline"
                        >
                            {language === 'en' ? 'Try again' : 'Попробовать снова'}
                        </button>
                    </div>
                )}

                {/* Entries */}
                <div className="space-y-6">
                    {filteredEntries.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
                                <Calendar className="w-10 h-10 text-white/60" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('noEntries')}</h3>
                            <p className="text-white/60 mb-6">{t('createFirst')}</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                {t('addEntry')}
                            </button>
                        </div>
                    ) : (
                        filteredEntries.map((entry: DiaryEntry) => {
                            const emoji = entry.mood && moodEmojis[entry.mood as keyof typeof moodEmojis]
                                ? moodEmojis[entry.mood as keyof typeof moodEmojis]
                                : null;
                            return (
                                <div
                                    key={entry.id}
                                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4 mb-3">
                                                <span className="text-white/60">{entry.date?.split('T')[0]}</span>
                                                <div className="flex items-center text-white/60">
                                                    <span className="mr-2">{getTimeIcon(entry.time) || '🕐'}</span>
                                                    <span>{getTimeDisplay(entry.time || new Date(entry.created_at).toTimeString().slice(0, 5))}</span>
                                                </div>
                                                {emoji && (
                                                    <div className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r ${(moodColors as any)[entry.mood!]} rounded-full`}>
                                                        <span className="text-lg">{emoji}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-white leading-relaxed">{entry.text}</p>
                                            {getEntryPhotoUrls(entry).length > 0 && (
                                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                    {getEntryPhotoUrls(entry).map((url, index) => (
                                                        <img
                                                            key={`${url}-${index}`}
                                                            src={url}
                                                            alt={language === 'en' ? 'Diary photo' : 'Фото записи'}
                                                            className="max-w-full rounded-xl border border-white/20"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Diary;
