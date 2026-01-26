import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Utensils, Star, Sparkles, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AppLauncher: React.FC = () => {
    const { t, language } = useLanguage();

    const apps = [
        {
            id: 'diary',
            title: t('diary'),
            description: language === 'en'
                ? 'Track your daily thoughts and emotions'
                : 'Отслеживайте ежедневные мысли и эмоции',
            icon: Calendar,
            color: 'from-purple-500 to-pink-500',
            route: '/diary',
            features: language === 'en'
                ? ['Daily entries', 'Mood tracking', 'Private & secure']
                : ['Ежедневные записи', 'Отслеживание настроения', 'Приватно и безопасно']
        },
        {
            id: 'nutrition',
            title: t('nutrition'),
            description: language === 'en'
                ? 'Monitor your meals and nutrition'
                : 'Контролируйте приемы пищи и питание',
            icon: Utensils,
            color: 'from-green-500 to-teal-500',
            route: '/nutrition',
            features: language === 'en'
                ? ['Meal tracking', 'Calorie counter', 'Nutrition insights']
                : ['Отслеживание приемов', 'Счетчик калорий', 'Анализ питания']
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4">
                        {t('mySpace')}
                    </h1>
                    <p className="text-xl text-white/80">
                        {language === 'en'
                            ? 'Choose your productivity tool'
                            : 'Выберите ваш инструмент для продуктивности'}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {apps.map((app) => (
                        <Link
                            key={app.id}
                            to={app.route}
                            className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105 block"
                        >
                            <div className="relative z-10">
                                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${app.color} rounded-full mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <app.icon className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3">{app.title}</h2>
                                <p className="text-lg text-white/80 mb-6">{app.description}</p>

                                <div className="space-y-2">
                                    {app.features.map((feature, index) => (
                                        <div key={index} className="flex items-center text-white/70">
                                            <Star className="w-4 h-4 mr-2" />
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 inline-flex items-center text-white hover:text-white/80 transition-colors">
                                    <span className="mr-2">
                                        {language === 'en' ? 'Launch App' : 'Запустить приложение'}
                                    </span>
                                    <div className="w-2 h-2 bg-white rounded-full group-hover:translate-x-1 transition-transform duration-300"></div>
                                </div>
                            </div>

                            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${app.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>

                            <div className="absolute top-4 right-4">
                                <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Settings Button */}
                <div className="text-center">
                    <Link
                        to="/settings"
                        className="inline-flex items-center text-white/80 hover:text-white transition-colors text-sm"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'Settings' : 'Настройки'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AppLauncher;
