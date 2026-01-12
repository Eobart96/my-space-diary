import React, { useState } from 'react';

function EntryForm({ onAddEntry }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim() && content.trim()) {
            const newEntry = {
                title: title.trim(),
                content: content.trim(),
                date: selectedDate,
            };
            onAddEntry(newEntry);
            setTitle('');
            setContent('');
            setSelectedDate(new Date().toISOString().split('T')[0]);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                ✨ Новая запись
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        📅 Дата записи
                    </label>
                    <input
                        type="date"
                        id="entryDate"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        🌟 Заголовок
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Введите заголовок записи..."
                        required
                    />
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                        🌌 Текст записи
                    </label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                        placeholder="Напишите о своем дне..."
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium"
                >
                    🚀 Добавить запись
                </button>
            </form>
        </div>
    );
}

export default EntryForm;
