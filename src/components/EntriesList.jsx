import React, { useState } from 'react';

const EntriesList = ({ entries, onDeleteEntry, onUpdateEntry }) => {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const handleEdit = (entry) => {
        setEditingId(entry.id);
        setEditTitle(entry.title);
        setEditContent(entry.content);
    };

    const handleSave = () => {
        if (editingId && editTitle && editContent) {
            onUpdateEntry(editingId, { title: editTitle, content: editContent });
            setEditingId(null);
            setEditTitle('');
            setEditContent('');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditTitle('');
        setEditContent('');
    };

    if (entries.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    У вас пока нет записей
                </h3>
                <p className="text-gray-500">
                    Создайте свою первую запись, чтобы начать вести дневник
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Ваши записи</h2>

            {entries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    {editingId === entry.id ? (
                        // Режим редактирования
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Название записи"
                            />
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                rows="4"
                                placeholder="Текст записи"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg"
                                >
                                    💾 Сохранить
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                                >
                                    ❌ Отмена
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Режим просмотра
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        {entry.title}
                                    </h3>
                                    <p className="text-gray-600 whitespace-pre-wrap">
                                        {entry.content}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        📅 {entry.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        🕐 {new Date(entry.created_at).toLocaleTimeString()}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(entry)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-lg text-sm"
                                    >
                                        ✏️ Редактировать
                                    </button>
                                    <button
                                        onClick={() => onDeleteEntry(entry.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded-lg text-sm"
                                    >
                                        🗑️ Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EntriesList;
