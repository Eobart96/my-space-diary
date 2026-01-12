import React from 'react';

function DiaryEntry({ entry, onDelete, onView }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateContent = (content, maxLength = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{entry.title}</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onView(entry)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Подробнее
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                        Удалить
                    </button>
                </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">{formatDate(entry.date)}</p>
            <p className="text-gray-700">{truncateContent(entry.content)}</p>
        </div>
    );
}

export default DiaryEntry;
