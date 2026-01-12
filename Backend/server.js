const express = require('express');
const cors = require('cors');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/entries', async (req, res) => {
    try {
        const entries = await db.getAllEntries();
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const { title, content, date } = req.body;
        const entry = await db.createEntry({ title, content, date, userId: 'default_user' });
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

app.delete('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.deleteEntry(id);
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

app.put('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, date } = req.body;
        const entry = await db.updateEntry(id, title, content, date);
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Сервер останавливается...');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log('API endpoints:');
    console.log('  GET    /api/entries       - Get all entries');
    console.log('  POST   /api/entries       - Create new entry');
    console.log('  DELETE /api/entries/:id   - Delete entry');
    console.log('  PUT    /api/entries/:id   - Update entry');
});
