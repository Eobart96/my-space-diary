import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
    onLanguageSelect: (language: 'en' | 'ru') => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
                        <Globe className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4">My Space</h1>
                    <p className="text-xl text-white/80">Choose your language / Выберите язык</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <button
                        onClick={() => onLanguageSelect('en')}
                        className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                    >
                        <div className="text-center">
                            <div className="text-4xl mb-4">🇬🇧</div>
                            <h2 className="text-2xl font-bold text-white mb-2">English</h2>
                            <p className="text-white/80">Diary & Nutrition Tracker</p>
                            <div className="mt-4 text-sm text-white/60">
                                Click to continue →
                            </div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>

                    <button
                        onClick={() => onLanguageSelect('ru')}
                        className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                    >
                        <div className="text-center">
                            <div className="text-4xl mb-4">🇷🇺</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Русский</h2>
                            <p className="text-white/80">Дневник и Трекер Питания</p>
                            <div className="mt-4 text-sm text-white/60">
                                Нажмите чтобы продолжить →
                            </div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                </div>

                <div className="text-center mt-12">
                    <p className="text-white/60 text-sm">
                        Personal productivity tools for modern life
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelector;
