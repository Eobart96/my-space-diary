import React from 'react';

function SyncStatus({ status, onSync }) {
    const getStatusIcon = () => {
        if (!status) return '🔄';

        switch (status.mode) {
            case 'server':
                return status.synced ? '☁️' : '⚠️';
            case 'local':
                return '📱';
            default:
                return '❓';
        }
    };

    const getStatusText = () => {
        if (!status) return 'Проверка статуса...';

        switch (status.mode) {
            case 'server':
                return status.synced ? 'Синхронизировано с сервером' : 'Ошибка синхронизации';
            case 'local':
                return 'Локальное хранилище';
            default:
                return 'Неизвестный статус';
        }
    };

    const getStatusColor = () => {
        if (!status) return 'text-yellow-300';

        switch (status.mode) {
            case 'server':
                return status.synced ? 'text-green-300' : 'text-red-300';
            case 'local':
                return 'text-blue-300';
            default:
                return 'text-gray-300';
        }
    };

    return (
        <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getStatusIcon()}</span>
                        <div>
                            <div className={`text-sm font-medium ${getStatusColor()}`}>
                                {getStatusText()}
                            </div>
                            {status && (
                                <div className="text-xs text-blue-200">
                                    {status.mode === 'server' && status.synced ? 'Данные сохранены в облаке' : 'Данные сохранены локально'}
                                </div>
                            )}
                        </div>
                    </div>

                    {status && status.mode === 'server' && !status.synced && (
                        <button
                            onClick={onSync}
                            className="px-4 py-2 bg-blue-600/50 text-white rounded-lg hover:bg-blue-600/70 transition-all duration-200 backdrop-blur-sm border border-white/20 text-sm"
                        >
                            🔄 Синхронизировать
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SyncStatus;
