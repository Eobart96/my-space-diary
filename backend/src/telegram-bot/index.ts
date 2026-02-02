import dotenv from 'dotenv';
import { TelegramBotManager } from './services/botManager';

dotenv.config();

const manager = new TelegramBotManager();

manager.start().catch((error) => {
    console.error('Failed to start Telegram bot:', error);
});
