import React, { useState, useEffect } from 'react';
import UniversalDB from './database/universalDB';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import EntryDetail from './components/EntryDetail';

function App() {
    const [entries, setEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [db] = useState(new UniversalDB());

    // Загрузка записей при монтировании компонента
    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const data = await db.getAllEntries();
            setEntries(data);
        } catch (error) {
            console.error('Failed to load entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const addEntry = async (newEntry) => {
        try {
            const createdEntry = await db.createEntry(newEntry.title, newEntry.content, newEntry.date);
            setEntries([createdEntry, ...entries]);
        } catch (error) {
            console.error('Failed to add entry:', error);
        }
    };

    const deleteEntryById = async (id) => {
        try {
            await db.deleteEntry(id);
            setEntries(entries.filter(entry => entry.id !== id));
        } catch (error) {
            console.error('Failed to delete entry:', error);
        }
    };

    const viewEntry = (entry) => {
        setSelectedEntry(entry);
    };

    const closeEntryDetail = () => {
        setSelectedEntry(null);
    };

    const clearFilter = () => {
        setFilterDate('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <div className="text-white text-xl font-light">Загрузка космоса...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Анимированный фон с звездами */}
            <div className="absolute inset-0">
                <div className="stars"></div>
                <div className="stars2"></div>
                <div className="stars3"></div>
            </div>

            {/* Основной контент */}
            <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-wider">
                        🌌 MY SPACE
                    </h1>
                    <p className="text-blue-200 text-sm md:text-base font-light">
                        Ваша космическая вселенная мыслей
                    </p>
                </header>

                {/* Фильтр по дате */}
                <div className="mb-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex-1">
                                <label htmlFor="dateFilter" className="block text-sm font-medium text-blue-200 mb-1">
                                    📅 Фильтр по дате
                                </label>
                                <input
                                    type="date"
                                    id="dateFilter"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                {filterDate && (
                                    <button
                                        onClick={clearFilter}
                                        className="px-4 py-2 bg-purple-600/50 text-white rounded-lg hover:bg-purple-600/70 transition-all duration-200 backdrop-blur-sm border border-white/20"
                                    >
                                        ✨ Сбросить
                                    </button>
                                )}
                                <div className="text-sm text-blue-200 flex items-center">
                                    📝 Всего записей: {entries.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Форма добавления записи */}
                <EntryForm onAddEntry={addEntry} />

                {/* Список записей */}
                <EntryList
                    entries={entries}
                    onDelete={deleteEntryById}
                    onView={viewEntry}
                    filterDate={filterDate}
                />

                {/* Детальный просмотр записи */}
                <EntryDetail
                    entry={selectedEntry}
                    onClose={closeEntryDetail}
                />
            </div>
        </div>
    );
}

export default App;
