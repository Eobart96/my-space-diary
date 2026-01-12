import React, { useState, useEffect } from 'react';
import EntriesList from './EntriesList';
import EntryForm from './EntryForm';
import TelegramAuth from './TelegramAuth';
import './App.css';

const App = () => {
    const [user, setUser] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAuth, setShowAuth] = useState(false);

    // Проверяем наличие сохраненной сессии
    useEffect(() => {
        const savedUser = localStorage.getItem('diaryUser');
        const savedToken = localStorage.getItem('diaryToken');

        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
            fetchEntries(savedToken);
        } else {
            setLoading(false);
        }
    }, []);

    // Загрузка записей
    const fetchEntries = async (token) => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/entries', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setEntries(data);
                setError(null);
            } else {
                throw new Error('Failed to fetch entries');
            }
        } catch (error) {
            console.error('Error fetching entries:', error);
            setError('Не удалось загрузить записи');
            // Если ошибка авторизации, показываем форму входа
            if (error.message.includes('401')) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Обработка успешной авторизации
    const handleAuthSuccess = (authData) => {
        const userData = {
            ...authData.user,
            sessionToken: authData.sessionToken
        };

        setUser(userData);
        localStorage.setItem('diaryUser', JSON.stringify(userData));
        localStorage.setItem('diaryToken', authData.sessionToken);
        setShowAuth(false);

        // Загружаем записи пользователя
        fetchEntries(authData.sessionToken);
    };

    // Обработка ошибки авторизации
    const handleAuthError = (error) => {
        console.error('Auth error:', error);
        setError(error.message);
    };

    // Выход из системы
    const handleLogout = () => {
        setUser(null);
        setEntries([]);
        localStorage.removeItem('diaryUser');
        localStorage.removeItem('diaryToken');
        setShowAuth(false);
    };

    // Добавление новой записи
    const handleAddEntry = async (entryData) => {
        try {
            const response = await fetch('/api/user/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.sessionToken}`,
                },
                body: JSON.stringify(entryData),
            });

            if (response.ok) {
                const newEntry = await response.json();
                setEntries([newEntry, ...entries]);
            } else {
                throw new Error('Failed to create entry');
            }
        } catch (error) {
            console.error('Error creating entry:', error);
            setError('Не удалось создать запись');
        }
    };

    // Удаление записи
    const handleDeleteEntry = async (id) => {
        try {
            const response = await fetch(`/api/user/entries/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.sessionToken}`,
                },
            });

            if (response.ok) {
                setEntries(entries.filter(entry => entry.id !== id));
            } else {
                throw new Error('Failed to delete entry');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            setError('Не удалось удалить запись');
        }
    };

    // Обновление записи
    const handleUpdateEntry = async (id, entryData) => {
        try {
            const response = await fetch(`/api/user/entries/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.sessionToken}`,
                },
                body: JSON.stringify(entryData),
            });

            if (response.ok) {
                const updatedEntry = await response.json();
                setEntries(entries.map(entry =>
                    entry.id === id ? updatedEntry : entry
                ));
            } else {
                throw new Error('Failed to update entry');
            }
        } catch (error) {
            console.error('Error updating entry:', error);
            setError('Не удалось обновить запись');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            🌌 My Space
                        </h1>
                        <p className="text-gray-600">
                            Ваш личный дневник
                        </p>
                    </div>

                    {showAuth ? (
                        <TelegramAuth
                            onAuthSuccess={handleAuthSuccess}
                            onAuthError={handleAuthError}
                        />
                    ) : (
                        <div className="text-center">
                            <button
                                onClick={() => setShowAuth(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 mx-auto mb-4"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4-4z" />
                                </svg>
                                Войти через Telegram
                            </button>

                            <button
                                onClick={() => {
                                    // Используем демо-режим без авторизации
                                    setUser({
                                        id: 'demo_user',
                                        username: 'demo',
                                        firstName: 'Demo',
                                        lastName: 'User',
                                        sessionToken: 'demo_token'
                                    });
                                    setShowAuth(false);
                                }}
                                className="text-gray-500 hover:text-gray-700 underline text-sm"
                            >
                                Продолжить без входа (демо-режим)
                            </button>
                        </div>
                    )}

                    <div className="mt-8 text-center text-xs text-gray-500">
                        <p>Нажимая "Войти через Telegram", вы соглашаетесь с условиями использования</p>
                        <p className="mt-1">Ваши данные защищены и не передаются третьим лицам</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                🌌 My Space
                            </h1>
                            <p className="text-gray-600">
                                Добро пожаловать, {user.firstName || user.username}!
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">
                                    @{user.username || 'user'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user.id === 'demo_user' ? 'Демо-режим' : 'Telegram пользователь'}
                                </p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg text-sm"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-2 text-red-500 hover:text-red-700 underline"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <EntryForm onAddEntry={handleAddEntry} />
                        <EntriesList
                            entries={entries}
                            onDeleteEntry={handleDeleteEntry}
                            onUpdateEntry={handleUpdateEntry}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                            <h2 className="text-xl font-semibold mb-4">📊 Статистика</h2>

                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Всего записей</p>
                                    <p className="text-2xl font-bold text-blue-800">{entries.length}</p>
                                </div>

                                {entries.length > 0 && (
                                    <>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-green-600 font-medium">Последняя запись</p>
                                            <p className="text-sm font-medium text-green-800 truncate">
                                                {entries[0].title}
                                            </p>
                                            <p className="text-xs text-green-600">
                                                {entries[0].date}
                                            </p>
                                        </div>

                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <p className="text-sm text-purple-600 font-medium">Первая запись</p>
                                            <p className="text-sm font-medium text-purple-800 truncate">
                                                {entries[entries.length - 1]?.title || 'Нет записей'}
                                            </p>
                                            <p className="text-xs text-purple-600">
                                                {entries[entries.length - 1]?.date || '-'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {user.id === 'demo_user' && (
                                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        💡 Это демо-режим.
                                        <button
                                            onClick={() => setShowAuth(true)}
                                            className="text-blue-600 hover:text-blue-800 underline ml-1"
                                        >
                                            Войдите через Telegram
                                        </button>
                                        {' '}
                                        для сохранения данных.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
