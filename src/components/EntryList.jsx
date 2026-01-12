import React from 'react';
import DiaryEntry from './DiaryEntry';

function EntryList({ entries, onDelete, onView, filterDate }) {
    const filteredEntries = filterDate
        ? entries.filter(entry => {
            const entryDate = new Date(entry.date).toDateString();
            const filterDateObj = new Date(filterDate).toDateString();
            return entryDate === filterDateObj;
        })
        : entries;

    const sortedEntries = [...filteredEntries].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    if (sortedEntries.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">
                    {filterDate ? 'Записей на эту дату нет' : 'У вас пока нет записей'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
                {filterDate ? `Записи за ${new Date(filterDate).toLocaleDateString('ru-RU')}` : 'Все записи'}
            </h2>
            {sortedEntries.map(entry => (
                <DiaryEntry
                    key={entry.id}
                    entry={entry}
                    onDelete={onDelete}
                    onView={onView}
                />
            ))}
        </div>
    );
}

export default EntryList;
