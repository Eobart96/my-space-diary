import os
import sqlite3
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
API_URL = os.getenv('API_URL', 'http://localhost:3001')

class SimpleBot:
    def __init__(self):
        self.token = BOT_TOKEN
        self.base_url = f"https://api.telegram.org/bot{self.token}"
        self.db = UserDatabase()
        self.sync_manager = SyncManager()
        self.user_states = {}
    
    def get_updates(self, offset=None):
        """Получить обновления от Telegram"""
        url = f"{self.base_url}/getUpdates"
        params = {"timeout": 30}
        if offset:
            params["offset"] = offset
        
        try:
            response = requests.get(url, params=params, timeout=35)
            return response.json()
        except Exception as e:
            print(f"Error getting updates: {e}")
            return {"result": []}
    
    def send_message(self, chat_id, text, parse_mode=None):
        """Отправить сообщение"""
        url = f"{self.base_url}/sendMessage"
        data = {"chat_id": chat_id, "text": text}
        if parse_mode:
            data["parse_mode"] = parse_mode
        
        try:
            response = requests.post(url, json=data)
            return response.json()
        except Exception as e:
            print(f"Error sending message: {e}")
            return None
    
    def register_user(self, user):
        """Регистрация пользователя"""
        telegram_id = user["id"]
        username = user.get("username")
        first_name = user.get("first_name")
        last_name = user.get("last_name")
        
        self.db.register_user(telegram_id, username, first_name, last_name)
        return self.db.get_user_stats(telegram_id)
    
    def handle_start(self, chat_id, user):
        """Обработка команды /start"""
        stats = self.register_user(user)
        
        message = f"Привет, {user.get('first_name', 'пользователь')}! 👋\n\n"
        message += f"Добро пожаловать в ваш личный дневник My Space!\n\n"
        message += f"📊 Ваша статистика:\n"
        message += f"• Всего записей: {stats['total_entries']}\n"
        message += f"• Первая запись: {stats['first_entry'] or 'пока нет'}\n"
        message += f"• Последняя запись: {stats['last_entry'] or 'пока нет'}\n\n"
        message += "Доступные команды:\n"
        message += "/help - помощь\n"
        message += "/entries - показать ваши записи\n"
        message += "/add - добавить новую запись\n"
        message += "/search <текст> - поиск по записям\n"
        message += "/stats - ваша статистика\n"
        message += "/sync_status - статус синхронизации"
        
        self.send_message(chat_id, message, parse_mode="HTML")
    
    def handle_help(self, chat_id):
        """Обработка команды /help"""
        message = """📖 Справка бота My Space:

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

💡 Просто отправьте мне текст, и я помогу вам работать с дневником!"""
        
        self.send_message(chat_id, message, parse_mode="Markdown")
    
    def handle_entries(self, chat_id, user_id):
        """Показать записи пользователя"""
        entries = self.db.get_user_entries(user_id, limit=10)
        
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
            
            self.send_message(chat_id, message)
        else:
            self.send_message(chat_id, "У вас пока нет записей. Используйте /add для создания первой записи! 📝")
    
    def handle_add(self, chat_id, user_id):
        """Начать добавление записи"""
        self.user_states[user_id] = 'adding_entry'
        
        message = "📝 Создание новой записи:\n\n"
        message += "Отправьте сообщение в формате:\n"
        message += "`Название | Текст записи`\n\n"
        message += "Пример: `Мой день | Сегодня был отличный день!`\n\n"
        message += "Или просто отправьте текст, и я создам запись автоматически."
        
        self.send_message(chat_id, message, parse_mode="Markdown")
    
    def handle_stats(self, chat_id, user_id):
        """Показать статистику"""
        stats = self.db.get_user_stats(user_id)
        
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
        
        entries = self.db.get_user_entries(user_id, limit=5)
        if entries:
            message += f"\n📚 Последние записи:\n"
            for entry in entries:
                message += f"• {entry[1]} ({entry[3]})\n"
        
        self.send_message(chat_id, message)
    
    def handle_sync_status(self, chat_id, user_id):
        """Показать статус синхронизации"""
        status = self.sync_manager.get_user_sync_status(user_id)
        
        message = f"🔄 Статус синхронизации:\n\n"
        message += f"📝 Записей в Telegram: {status['telegram_entries']}\n"
        message += f"🌐 Записей в веб-приложении: {status['web_entries']}\n"
        message += f"🔗 Синхронизация: {'✅ Включена' if status['is_linked'] else '❌ Отключена'}\n"
        
        if status['last_sync']:
            message += f"⏰ Последняя проверка: {status['last_sync']}\n"
        
        if not status['is_linked']:
            message += f"\n💡 Используйте /sync_enable для включения синхронизации"
        
        self.send_message(chat_id, message)
    
    def handle_text_message(self, chat_id, user_id, text):
        """Обработка текстового сообщения"""
        if self.user_states.get(user_id) == 'adding_entry':
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
            entry_id = self.db.add_entry(user_id, title, content)
            
            if entry_id:
                message = f"✅ Запись успешно добавлена!\n\n"
                message += f"📌 {title}\n"
                message += f"📅 {datetime.now().strftime('%Y-%m-%d')}\n"
                message += f"ID: #{entry_id}"
                self.send_message(chat_id, message)
            else:
                self.send_message(chat_id, "❌ Не удалось добавить запись.")
            
            # Сбрасываем состояние
            self.user_states[user_id] = None
        else:
            # Обычное сообщение - предлагаем добавить запись
            message = f"💬 Получено сообщение: {text[:50]}{'...' if len(text) > 50 else ''}\n\n"
            message += "Хотите добавить это как запись в дневник?\n"
            message += "Используйте /add или отправьте команду /help для помощи."
            self.send_message(chat_id, message)
    
    def handle_message(self, message):
        """Обработать входящее сообщение"""
        if "message" not in message:
            return
        
        msg = message["message"]
        chat_id = msg["chat"]["id"]
        user = msg.get("from", {})
        user_id = user["id"]
        
        if "text" in msg:
            text = msg["text"]
            
            if text.startswith("/"):
                command = text[1:].split()[0].lower()
                
                if command == "start":
                    self.handle_start(chat_id, user)
                elif command == "help":
                    self.handle_help(chat_id)
                elif command == "entries":
                    self.handle_entries(chat_id, user_id)
                elif command == "add":
                    self.handle_add(chat_id, user_id)
                elif command == "stats":
                    self.handle_stats(chat_id, user_id)
                elif command == "sync_status":
                    self.handle_sync_status(chat_id, user_id)
                else:
                    self.send_message(chat_id, "Неизвестная команда. Используйте /help для справки.")
            else:
                self.handle_text_message(chat_id, user_id, text)
    
    def run(self):
        """Запуск бота"""
        print("🤖 Запуск простого Telegram бота My Space...")
        
        if not self.token or self.token == 'your_bot_token_here':
            print("❌ Пожалуйста, установите TELEGRAM_BOT_TOKEN в файле .env")
            return
        
        offset = None
        while True:
            try:
                updates = self.get_updates(offset)
                
                if updates.get("ok"):
                    for update in updates["result"]:
                        self.handle_message(update)
                        offset = update["update_id"] + 1
                
            except KeyboardInterrupt:
                print("\n👋 Бот остановлен")
                break
            except Exception as e:
                print(f"❌ Ошибка: {e}")
                import time
                time.sleep(5)

# Импортируем классы из других файлов
try:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from user_database import UserDatabase
    from sync_manager import SyncManager
except ImportError as e:
    print(f"❌ Не удалось импортировать модули: {e}")
    print("Создаем простую базу данных...")
    
    # Простая реализация базы данных на случай проблем с импортом
    import sqlite3
    from datetime import datetime
    
    class UserDatabase:
        def __init__(self, db_path="users.db"):
            self.db_path = os.path.join(os.path.dirname(__file__), db_path)
            self.init_database()
        
        def init_database(self):
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id INTEGER UNIQUE NOT NULL,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    date TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
        
        def register_user(self, telegram_id, username=None, first_name=None, last_name=None):
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO users (telegram_id, username, first_name, last_name)
                    VALUES (?, ?, ?, ?)
                ''', (telegram_id, username, first_name, last_name))
                
                cursor.execute('''
                    UPDATE users SET last_active = CURRENT_TIMESTAMP 
                    WHERE telegram_id = ?
                ''', (telegram_id,))
                
                conn.commit()
                return True
            except sqlite3.Error as e:
                print(f"Error registering user: {e}")
                return False
            finally:
                conn.close()
        
        def get_user_entries(self, telegram_id, limit=10):
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    SELECT id, title, content, date, created_at, updated_at
                    FROM user_entries 
                    WHERE user_id = ?
                    ORDER BY date DESC, created_at DESC
                    LIMIT ?
                ''', (telegram_id, limit))
                
                entries = cursor.fetchall()
                return entries
            except sqlite3.Error as e:
                print(f"Error getting entries: {e}")
                return []
            finally:
                conn.close()
        
        def add_entry(self, telegram_id, title, content, date=None):
            if date is None:
                date = datetime.now().strftime('%Y-%m-%d')
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                self.register_user(telegram_id)
                
                cursor.execute('''
                    INSERT INTO user_entries (user_id, title, content, date)
                    VALUES (?, ?, ?, ?)
                ''', (telegram_id, title, content, date))
                
                entry_id = cursor.lastrowid
                conn.commit()
                return entry_id
            except sqlite3.Error as e:
                print(f"Error adding entry: {e}")
                return None
            finally:
                conn.close()
        
        def get_user_stats(self, telegram_id):
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    SELECT COUNT(*) as total_entries,
                           MIN(date) as first_entry,
                           MAX(date) as last_entry
                    FROM user_entries 
                    WHERE user_id = ?
                ''', (telegram_id,))
                
                stats = cursor.fetchone()
                return {
                    'total_entries': stats[0] or 0,
                    'first_entry': stats[1],
                    'last_entry': stats[2]
                }
            except sqlite3.Error as e:
                print(f"Error getting stats: {e}")
                return {'total_entries': 0, 'first_entry': None, 'last_entry': None}
            finally:
                conn.close()
        
        def search_entries(self, telegram_id, query):
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    SELECT id, title, content, date, created_at
                    FROM user_entries 
                    WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
                    ORDER BY date DESC
                ''', (telegram_id, f'%{query}%', f'%{query}%'))
                
                entries = cursor.fetchall()
                return entries
            except sqlite3.Error as e:
                print(f"Error searching entries: {e}")
                return []
            finally:
                conn.close()
    
    class SyncManager:
        def __init__(self, api_url="http://localhost:3001"):
            self.api_url = api_url
        
        def get_user_sync_status(self, telegram_id):
            return {
                'telegram_entries': 0,
                'web_entries': 0,
                'is_linked': False,
                'last_sync': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        
        def enable_sync(self, telegram_id):
            return True
        
        def disable_sync(self, telegram_id):
            return True
        
        def sync_user_to_web(self, telegram_id):
            return 0

if __name__ == "__main__":
    bot = SimpleBot()
    bot.run()
