import React, { useState, useEffect } from 'react';

const TelegramAuth = ({ onAuthSuccess, onAuthError }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [authData, setAuthData] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, pending, success, error

    // Запрос на авторизацию
    const requestAuth = async () => {
        setIsLoading(true);
        setStatus('pending');

        try {
            const response = await fetch('/api/auth/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setAuthData(data);
                // Открываем Telegram в новом окне
                const authWindow = window.open(data.authUrl, '_blank', 'width=600,height=600');

                // Начинаем проверку статуса авторизации
                pollAuthStatus(data.token);

                // Отслеживаем закрытие окна
                const checkClosed = setInterval(() => {
                    if (authWindow.closed) {
                        clearInterval(checkClosed);
                        setStatus('error');
                        setIsLoading(false);
                        onAuthError(new Error('Авторизация отменена'));
                    }
                }, 1000);

                // Останавливаем проверку при успешной авторизации
                setTimeout(() => {
                    clearInterval(checkClosed);
                }, 300000); // 5 минут таймаут

            } else {
                throw new Error(data.error || 'Failed to create auth request');
            }
        } catch (error) {
            setStatus('error');
            setIsLoading(false);
            onAuthError(error);
        }
    };

    // Проверка статуса авторизации
    const pollAuthStatus = async (token) => {
        const maxAttempts = 60; // 60 попыток по 5 секунд = 5 минут
        let attempts = 0;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/auth/status/${token}`);
                const data = await response.json();

                if (data.status === 'linked') {
                    setStatus('success');
                    setIsLoading(false);
                    onAuthSuccess({
                        user: data.telegramUser,
                        sessionToken: data.sessionToken || 'mock_token', // В реальном приложении будет получен от API
                    });
                    return;
                }

                if (data.status === 'expired') {
                    setStatus('error');
                    setIsLoading(false);
                    onAuthError(new Error('Срок действия ссылки истек'));
                    return;
                }

                attempts++;
                if (attempts < maxAttempts && data.status === 'pending') {
                    setTimeout(checkStatus, 5000); // Проверяем каждые 5 секунд
                } else if (attempts >= maxAttempts) {
                    setStatus('error');
                    setIsLoading(false);
                    onAuthError(new Error('Время ожидания истекло'));
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkStatus, 5000);
                } else {
                    setStatus('error');
                    setIsLoading(false);
                    onAuthError(error);
                }
            }
        };

        checkStatus();
    };

    // Отмена авторизации
    const cancelAuth = () => {
        setStatus('idle');
        setIsLoading(false);
        setAuthData(null);
    };

    return (
        <div className="telegram-auth">
            <div className="auth-container">
                <h3 className="text-lg font-semibold mb-4 text-center">
                    Войти через Telegram
                </h3>

                {status === 'idle' && (
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            Используйте ваш Telegram аккаунт для безопасного входа
                        </p>
                        <button
                            onClick={requestAuth}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 mx-auto"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4-4z" />
                            </svg>
                            Войти через Telegram
                        </button>
                    </div>
                )}

                {status === 'pending' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 mb-2">
                            Ожидание авторизации...
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Перейдите в Telegram и нажмите "Start"
                        </p>
                        {authData && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Ссылка активна до:
                                </p>
                                <p className="text-sm font-medium">
                                    {new Date(authData.expiresAt).toLocaleTimeString()}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={cancelAuth}
                            className="text-gray-500 hover:text-gray-700 text-sm underline"
                        >
                            Отменить
                        </button>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="text-green-500 text-4xl mb-4">✓</div>
                        <p className="text-gray-700 font-medium">
                            Авторизация успешна!
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="text-red-500 text-4xl mb-4">✕</div>
                        <p className="text-gray-700 font-medium mb-4">
                            Ошибка авторизации
                        </p>
                        <button
                            onClick={requestAuth}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
                        >
                            Попробовать снова
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    Ваши данные защищены и не будут переданы третьим лицам
                </p>
            </div>
        </div>
    );
};

export default TelegramAuth;
