import React from 'react';

function EntryDetail({ entry, onClose }) {
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

    if (!entry) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">{entry.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{formatDate(entry.date)}</p>
                    <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {entry.content}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EntryDetail;
