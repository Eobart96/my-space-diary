import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

const Settings: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const { language } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <Link
                        to="/"
                        className="inline-flex items-center text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {language === 'en' ? 'Back' : 'Назад'}
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {language === 'en' ? 'Settings' : 'Настройки'}
                        </h1>
                        <p className="text-white/80">
                            {language === 'en' ? 'Customize your experience' : 'Настройте свой опыт'}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Language Settings */}
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                            <Globe className="w-6 h-6 text-white mr-3" />
                            <h2 className="text-2xl font-bold text-white">
                                {language === 'en' ? 'Language' : 'Язык'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => updateSettings({ language: 'en' })}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${settings.language === 'en'
                                    ? 'border-white/50 bg-white/10'
                                    : 'border-white/20 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="text-3xl mb-2 font-bold text-white">US</div>
                                <div className="text-white font-semibold">English</div>
                            </button>
                            <button
                                onClick={() => updateSettings({ language: 'ru' })}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${settings.language === 'ru'
                                    ? 'border-white/50 bg-white/10'
                                    : 'border-white/20 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="text-3xl mb-2 font-bold text-white">RU</div>
                                <div className="text-white font-semibold">Русский</div>
                            </button>
                        </div>
                    </div>

                    {/* Diary Settings */}
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center mb-6">
                            <div className="text-3xl mr-3">📖</div>
                            <h2 className="text-2xl font-bold text-white">
                                {language === 'en' ? 'Diary Settings' : 'Настройки дневника'}
                            </h2>
                        </div>
                        <div className="space-y-4">
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
                    </div>

                    {/* Current Settings Summary */}
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {language === 'en' ? 'Current Settings' : 'Текущие настройки'}
                        </h3>
                        <div className="space-y-2 text-white/80">
                            <div className="flex justify-between">
                                <span>{language === 'en' ? 'Language' : 'Язык'}:</span>
                                <span>{settings.language === 'en' ? 'English' : 'Русский'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{language === 'en' ? 'Time Format' : 'Формат времени'}:</span>
                                <span>
                                    {settings.timeFormat === 'exact'
                                        ? (language === 'en' ? 'Exact Time' : 'Точное время')
                                        : (language === 'en' ? 'Time of Day' : 'Время суток')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>{language === 'en' ? 'Date Format' : 'Формат даты'}:</span>
                                <span>{settings.dateFormat}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{language === 'en' ? 'Sort By' : 'Сортировка'}:</span>
                                <span>
                                    {settings.sortBy === 'date'
                                        ? (language === 'en' ? 'Date' : 'Дата')
                                        : (language === 'en' ? 'Created' : 'Создано')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>{language === 'en' ? 'Order' : 'Порядок'}:</span>
                                <span>
                                    {settings.order === 'desc'
                                        ? (language === 'en' ? 'Newest First' : 'Сначала новые')
                                        : (language === 'en' ? 'Oldest First' : 'Сначала старые')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
