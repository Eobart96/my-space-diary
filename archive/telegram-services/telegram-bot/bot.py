import os
import asyncio
import logging
import sys
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, Filters, CallbackContext
import requests
from dotenv import load_dotenv
from user_database import UserDatabase
from datetime import datetime

# Добавляем родительскую директорию в путь для импорта
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sync_manager import SyncManager

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Получение токена и URL API
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
API_URL = os.getenv('API_URL', 'http://localhost:3001')

# Инициализация баз данных
db = UserDatabase()
sync_manager = SyncManager()

# Состояния пользователей
user_states = {}

async def start(update: Update, context: CallbackContext) -> None:
    """Обработчик команды /start"""
    user = update.effective_user
    telegram_id = user.id
    
    # Регистрируем пользователя
    db.register_user(
        telegram_id=telegram_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name
    )
    
    # Получаем статистику пользователя
    stats = db.get_user_stats(telegram_id)
    
    await update.message.reply_html(
        f"Привет, {user.mention_html()}! 👋\n\n"
        f"Добро пожаловать в ваш личный дневник My Space!\n\n"
        f"📊 Ваша статистика:\n"
        f"• Всего записей: {stats['total_entries']}\n"
        f"• Первая запись: {stats['first_entry'] or 'пока нет'}\n"
        f"• Последняя запись: {stats['last_entry'] or 'пока нет'}\n\n"
        "Доступные команды:\n"
        "/help - помощь\n"
        "/entries - показать ваши записи\n"
        "/add - добавить новую запись\n"
        "/search - поиск по записям\n"
        "/stats - ваша статистика"
    )

async def help_command(update: Update, context: CallbackContext) -> None:
    """Обработчик команды /help"""
    help_text = """
📖 Справка бота My Space:

🔹 **Основные команды:**
/start - начать работу с ботом
/help - показать эту справку
/entries - показать ваши записи (последние 10)
/entries_all - показать все записи
/add - добавить новую запись
/search <текст> - поиск по записям
/stats - подробная статистика

🔹 **Синхронизация с веб-приложением:**
/sync_status - статус синхронизации
/sync_enable - включить синхронизацию
/sync_disable - отключить синхронизацию
/sync_now - синхронизировать сейчас

🔹 **Как добавить запись:**
1. Нажмите /add
2. Отправьте сообщение в формате:
   `Название | Текст записи`
Или просто отправьте текст после команды /add

🔹 **Особенности:**
• Каждая запись привязана к вашему аккаунту
• Полная конфиденциальность данных
• Быстрый поиск по записям
• Статистика вашего дневника

💡 Просто отправьте мне текст, и я помогу вам работать с дневником!
    """
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def get_entries(update: Update, context: CallbackContext) -> None:
    """Получить записи пользователя"""
    telegram_id = update.effective_user.id
    entries = db.get_user_entries(telegram_id, limit=10)
    
    if entries:
        message = "📝 Ваши последние записи:\n\n"
        
        for entry in entries:
            entry_date = entry[3]
            title = entry[1]
            content = entry[2][:150] + "..." if len(entry[2]) > 150 else entry[2]
            
            message += f"📅 {entry_date}\n"
            message += f"📌 {title}\n"
            message += f"{content}\n"
            message += f"ID: #{entry[0]}\n\n"
        
        await update.message.reply_text(message)
    else:
        await update.message.reply_text(
            "У вас пока нет записей. Используйте /add для создания первой записи! 📝"
        )

async def get_all_entries(update: Update, context: CallbackContext) -> None:
    """Получить все записи пользователя"""
    telegram_id = update.effective_user.id
    entries = db.get_user_entries(telegram_id, limit=50)
    
    if entries:
        message = "� Все ваши записи:\n\n"
        
        for entry in entries:
            entry_date = entry[3]
            title = entry[1]
            content = entry[2][:100] + "..." if len(entry[2]) > 100 else entry[2]
            
            message += f"📅 {entry_date} - {title}\n"
            message += f"{content}\n"
            message += f"ID: #{entry[0]}\n\n"
        
        # Разделяем длинные сообщения
        if len(message) > 4000:
            parts = [message[i:i+4000] for i in range(0, len(message), 4000)]
            for part in parts:
                await update.message.reply_text(part)
        else:
            await update.message.reply_text(message)
    else:
        await update.message.reply_text("У вас пока нет записей.")

async def add_entry_start(update: Update, context: CallbackContext) -> None:
    """Начать добавление новой записи"""
    telegram_id = update.effective_user.id
    user_states[telegram_id] = 'adding_entry'
    
    await update.message.reply_text(
        "📝 Создание новой записи:\n\n"
        "Отправьте сообщение в формате:\n"
        "`Название | Текст записи`\n\n"
        "Пример: `Мой день | Сегодня был отличный день!`\n\n"
        "Или просто отправьте текст, и я создам запись автоматически.",
        parse_mode='Markdown'
    )

async def search_entries(update: Update, context: CallbackContext) -> None:
    """Поиск записей"""
    telegram_id = update.effective_user.id
    
    if not context.args:
        await update.message.reply_text(
            "🔍 Пожалуйста, введите текст для поиска:\n"
            "`/search ваш текст`",
            parse_mode='Markdown'
        )
        return
    
    query = ' '.join(context.args)
    entries = db.search_entries(telegram_id, query)
    
    if entries:
        message = f"🔍 Результаты поиска по '{query}':\n\n"
        
        for entry in entries:
            entry_date = entry[3]
            title = entry[1]
            content = entry[2][:100] + "..." if len(entry[2]) > 100 else entry[2]
            
            message += f"📅 {entry_date}\n"
            message += f"📌 {title}\n"
            message += f"{content}\n"
            message += f"ID: #{entry[0]}\n\n"
        
        await update.message.reply_text(message)
    else:
        await update.message.reply_text(f"По запросу '{query}' ничего не найдено.")

async def get_stats(update: Update, context: CallbackContext) -> None:
    """Показать статистику пользователя"""
    telegram_id = update.effective_user.id
    stats = db.get_user_stats(telegram_id)
    
    message = f"📊 Ваша статистика:\n\n"
    message += f"📝 Всего записей: {stats['total_entries']}\n"
    
    if stats['first_entry']:
        message += f"📅 Первая запись: {stats['first_entry']}\n"
    else:
        message += f"📅 Первая запись: пока нет\n"
    
    if stats['last_entry']:
        message += f"📅 Последняя запись: {stats['last_entry']}\n"
    else:
        message += f"📅 Последняя запись: пока нет\n"
    
    # Получаем последние записи для дополнительной статистики
    entries = db.get_user_entries(telegram_id, limit=5)
    if entries:
        message += f"\n📚 Последние записи:\n"
        for entry in entries:
            message += f"• {entry[1]} ({entry[3]})\n"
    
    await update.message.reply_text(message)

async def handle_message(update: Update, context: CallbackContext) -> None:
    """Обработчик текстовых сообщений"""
    telegram_id = update.effective_user.id
    text = update.message.text
    
    # Если пользователь в процессе добавления записи
    if user_states.get(telegram_id) == 'adding_entry':
        try:
            # Пытаемся разделить на название и содержимое
            if '|' in text:
                parts = text.split('|', 1)
                title = parts[0].strip()
                content = parts[1].strip()
            else:
                # Если нет разделителя, используем первые 30 символов как название
                title = text[:30] + "..." if len(text) > 30 else text
                content = text
            
            # Добавляем запись в базу данных
            entry_id = db.add_entry(telegram_id, title, content)
            
            if entry_id:
                await update.message.reply_text(
                    f"✅ Запись успешно добавлена!\n\n"
                    f"📌 {title}\n"
                    f"📅 {datetime.now().strftime('%Y-%m-%d')}\n"
                    f"ID: #{entry_id}"
                )
            else:
                await update.message.reply_text("❌ Не удалось добавить запись.")
            
            # Сбрасываем состояние
            user_states[telegram_id] = None
            
        except Exception as e:
            logger.error(f"Error adding entry: {e}")
            await update.message.reply_text("❌ Ошибка при добавлении записи.")
            user_states[telegram_id] = None
    else:
        # Обычное сообщение - предлагаем добавить запись
        await update.message.reply_text(
            f"💬 Получено сообщение: {text[:50]}{'...' if len(text) > 50 else ''}\n\n"
            "Хотите добавить это как запись в дневник?\n"
            "Используйте /add или отправьте команду /help для помощи."
        )

async def sync_status(update: Update, context: CallbackContext) -> None:
    """Показать статус синхронизации"""
    telegram_id = update.effective_user.id
    status = sync_manager.get_user_sync_status(telegram_id)
    
    message = f"🔄 Статус синхронизации:\n\n"
    message += f"📝 Записей в Telegram: {status['telegram_entries']}\n"
    message += f"🌐 Записей в веб-приложении: {status['web_entries']}\n"
    message += f"🔗 Синхронизация: {'✅ Включена' if status['is_linked'] else '❌ Отключена'}\n"
    
    if status['last_sync']:
        message += f"⏰ Последняя проверка: {status['last_sync']}\n"
    
    if not status['is_linked']:
        message += f"\n💡 Используйте /sync_enable для включения синхронизации"
    
    await update.message.reply_text(message)

async def sync_enable(update: Update, context: CallbackContext) -> None:
    """Включить синхронизацию"""
    telegram_id = update.effective_user.id
    
    if sync_manager.enable_sync(telegram_id):
        await update.message.reply_text(
            "✅ Синхронизация включена!\n\n"
            "Теперь ваши записи будут доступны и в веб-приложении.\n"
            "Используйте /sync_now для немедленной синхронизации."
        )
    else:
        await update.message.reply_text("❌ Не удалось включить синхронизацию")

async def sync_disable(update: Update, context: CallbackContext) -> None:
    """Отключить синхронизацию"""
    telegram_id = update.effective_user.id
    
    if sync_manager.disable_sync(telegram_id):
        await update.message.reply_text(
            "❌ Синхронизация отключена.\n"
            "Ваши записи больше не будут синхронизироваться с веб-приложением."
        )
    else:
        await update.message.reply_text("❌ Не удалось отключить синхронизацию")

async def sync_now(update: Update, context: CallbackContext) -> None:
    """Выполнить синхронизацию сейчас"""
    telegram_id = update.effective_user.id
    
    await update.message.reply_text("🔄 Начинаю синхронизацию...")
    
    # Синхронизируем записи в веб-приложение
    synced_to_web = sync_manager.sync_user_to_web(telegram_id)
    
    if synced_to_web > 0:
        await update.message.reply_text(
            f"✅ Синхронизация завершена!\n\n"
            f"📝 Синхронизировано записей: {synced_to_web}\n"
            f"🌐 Теперь они доступны в веб-приложении"
        )
    else:
        await update.message.reply_text(
            "ℹ️ Нет новых записей для синхронизации\n"
            "или синхронизация не включена. Используйте /sync_enable"
        )

async def error_handler(update: object, context: CallbackContext) -> None:
    """Обработчик ошибок"""
    logger.error('Exception while handling an update:', exc_info=context.error)

def main() -> None:
    """Основная функция бота"""
    if not BOT_TOKEN or BOT_TOKEN == 'your_bot_token_here':
        logger.error("Пожалуйста, установите TELEGRAM_BOT_TOKEN в файле .env")
        return
    
    # Создание приложения
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Добавление обработчиков
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("entries", get_entries))
    application.add_handler(CommandHandler("entries_all", get_all_entries))
    application.add_handler(CommandHandler("add", add_entry_start))
    application.add_handler(CommandHandler("search", search_entries))
    application.add_handler(CommandHandler("stats", get_stats))
    application.add_handler(CommandHandler("sync_status", sync_status))
    application.add_handler(CommandHandler("sync_enable", sync_enable))
    application.add_handler(CommandHandler("sync_disable", sync_disable))
    application.add_handler(CommandHandler("sync_now", sync_now))
    application.add_handler(MessageHandler(Filters.text & ~Filters.command, handle_message))
    
    # Обработчик ошибок
    application.add_error_handler(error_handler)
    
    # Запуск бота
    logger.info("Запуск Telegram бота с поддержкой пользователей...")
    application.run_polling()

if __name__ == '__main__':
    main()