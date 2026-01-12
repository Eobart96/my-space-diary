const API_BASE_URL = 'http://localhost:3001/api';

// Получить все записи
export const getAllEntries = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/entries`);
        if (!response.ok) throw new Error('Failed to fetch entries');
        return await response.json();
    } catch (error) {
        console.error('Error fetching entries:', error);
        throw error;
    }
};

// Создать новую запись
export const createEntry = async (entry) => {
    try {
        const response = await fetch(`${API_BASE_URL}/entries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        });
        if (!response.ok) throw new Error('Failed to create entry');
        return await response.json();
    } catch (error) {
        console.error('Error creating entry:', error);
        throw error;
    }
};

// Удалить запись
export const deleteEntry = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/entries/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete entry');
        return await response.json();
    } catch (error) {
        console.error('Error deleting entry:', error);
        throw error;
    }
};

// Обновить запись
export const updateEntry = async (id, entry) => {
    try {
        const response = await fetch(`${API_BASE_URL}/entries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        });
        if (!response.ok) throw new Error('Failed to update entry');
        return await response.json();
    } catch (error) {
        console.error('Error updating entry:', error);
        throw error;
    }
};
