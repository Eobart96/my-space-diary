import os
import sqlite3
import requests
import json
import time
from datetime import datetime
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
if not BOT_TOKEN or BOT_TOKEN == 'your_bot_token_here':
    print("❌ Пожалуйста, установите TELEGRAM_BOT_TOKEN в файле .env")
    exit(1)

class SimpleBot:
    def __init__(self):
        self.token = BOT_TOKEN
        self.base_url = f"https://api.telegram.org/bot{self.token}"
        self.user_states = {}
        self.db_path = os.path.join(os.path.dirname(__file__), "users.db")
        self.init_database()
        print(f"🤖 Бот инициализирован с токеном: {self.token[:10]}...")
    
    def init_database(self):
        """Инициализация базы данных"""
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
        print("✅ База данных инициализирована")
    
    def register_user(self, telegram_id, username=None, first_name=None, last_name=None):
        """Регистрация пользователя"""
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
        """Получить записи пользователя"""
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
        """Добавить запись пользователя"""
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
        """Получить статистику пользователя"""
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
    
    def get_updates(self, offset=None):
        """Получить обновления от Telegram"""
        url = f"{self.base_url}/getUpdates"
        params = {"timeout": 10}
        if offset:
            params["offset"] = offset
        
        try:
            response = requests.get(url, params=params, timeout=15)
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
            response = requests.post(url, json=data, timeout=10)
            result = response.json()
            if not result.get("ok"):
                print(f"Error sending message: {result}")
            return result
        except Exception as e:
            print(f"Error sending message: {e}")
            return None
    
    def handle_start(self, chat_id, user):
        """Обработка команды /start"""
        telegram_id = user["id"]
        
        # Проверяем, есть ли параметр авторизации
        text = user.get("text", "")
        
        if "auth_" in text:
            # Обработка авторизации
            self.handle_auth_link(chat_id, user, text)
        else:
            # Обычный запуск бота
            self.register_user(
                telegram_id=telegram_id,
                username=user.get("username"),
                first_name=user.get("first_name"),
                last_name=user.get("last_name")
            )
            
            stats = self.get_user_stats(telegram_id)
            
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
            message += "/web - привязать к веб-приложению"
            
            self.send_message(chat_id, message)
    
    def handle_auth_link(self, chat_id, user, text):
        """Обработка привязки к веб-приложению"""
        # Извлекаем токен из команды /start auth_<token>
        parts = text.split()
        if len(parts) >= 2 and parts[1].startswith("auth_"):
            token = parts[1][5:]  # Убираем "auth_" префикс
            
            # Отправляем запрос на связывание с веб-приложением
            try:
                webhook_url = f"http://localhost:3001/api/auth/link"
                data = {
                    "token": token,
                    "telegramId": user["id"],
                    "telegramUser": {
                        "id": user["id"],
                        "username": user.get("username"),
                        "first_name": user.get("first_name"),
                        "last_name": user.get("last_name")
                    }
                }
                
                response = requests.post(webhook_url, json=data, timeout=10)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        message = "✅ Аккаунт успешно привязан к веб-приложению!\n\n"
                        message += "Теперь вы можете:\n"
                        message += "• Управлять записями на сайте\n"
                        message += "• Синхронизировать данные\n"
                        message += "• Использовать все функции веб-приложения\n\n"
                        message += "🌐 Откройте http://localhost:5173 для доступа к дневнику"
                        
                        self.send_message(chat_id, message)
                    else:
                        message = f"❌ Ошибка привязки: {result.get('error', 'Unknown error')}"
                        self.send_message(chat_id, message)
                else:
                    message = "❌ Не удалось связать с веб-приложением. Попробуйте позже."
                    self.send_message(chat_id, message)
                    
            except Exception as e:
                print(f"Error linking to web app: {e}")
                message = "❌ Произошла ошибка при связывании с веб-приложением."
                message += f"\n\nДетали: {str(e)[:100]}"
                self.send_message(chat_id, message)
        else:
            message = "❌ Неверная команда авторизации."
            self.send_message(chat_id, message)
    
    def handle_web_auth(self, chat_id, user_id):
        """Обработка команды /web"""
        # Создаем запрос на авторизацию
        try:
            webhook_url = f"http://localhost:3001/api/auth/request"
            response = requests.post(webhook_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = f"🔗 Привязка к веб-приложению:\n\n"
                message += f"1. Перейдите по ссылке:\n{data['authUrl']}\n\n"
                message += f"2. Нажмите 'Start' в боте\n"
                message += f"3. Готово! Ваши данные будут синхронизированы\n\n"
                message += f"⏰ Ссылка действительна до {data['expiresAt']}"
                
                self.send_message(chat_id, message)
            else:
                message = "❌ Не удалось создать ссылку для авторизации"
                self.send_message(chat_id, message)
                
        except Exception as e:
            print(f"Error creating auth request: {e}")
            message = "❌ Произошла ошибка при создании ссылки авторизации."
            self.send_message(chat_id, message)
    
    def handle_help(self, chat_id):
        """Обработка команды /help"""
        message = """📖 Справка бота My Space:

🔹 **Основные команды:**
/start - начать работу с ботом
/help - показать эту справку
/entries - показать ваши записи (последние 10)
/add - добавить новую запись
/search <текст> - поиск по записям
/stats - подробная статистика

🔹 **Веб-приложение:**
/web - привязать к веб-приложению
/auth - создать ссылку для входа на сайт

🔹 **Как добавить запись:**
1. Нажмите /add
2. Отправьте сообщение в формате:
   `Название | Текст записи`

💡 Просто отправьте мне текст, и я помогу вам работать с дневником!

🌐 **Веб-приложение:**
• Полная синхронизация записей
• Управление через удобный интерфейс
• Доступ с любого устройства
• История всех изменений"""
        
        self.send_message(chat_id, message, parse_mode="Markdown")
    
    def handle_entries(self, chat_id, user_id):
        """Показать записи пользователя"""
        entries = self.get_user_entries(user_id, limit=10)
        
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
        stats = self.get_user_stats(user_id)
        
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
        
        entries = self.get_user_entries(user_id, limit=5)
        if entries:
            message += f"\n📚 Последние записи:\n"
            for entry in entries:
                message += f"• {entry[1]} ({entry[3]})\n"
        
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
            entry_id = self.add_entry(user_id, title, content)
            
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
                elif command == "web":
                    self.handle_web_auth(chat_id, user_id)
                elif command == "auth":
                    self.handle_web_auth(chat_id, user_id)
                else:
                    self.send_message(chat_id, "Неизвестная команда. Используйте /help для справки.")
            else:
                self.handle_text_message(chat_id, user_id, text)
    
    def test_connection(self):
        """Тест подключения к Telegram API"""
        try:
            url = f"{self.base_url}/getMe"
            response = requests.get(url, timeout=10)
            result = response.json()
            
            if result.get("ok"):
                bot_info = result["result"]
                print(f"✅ Подключено к боту: @{bot_info['username']}")
                print(f"📝 Имя: {bot_info['first_name']}")
                return True
            else:
                print(f"❌ Ошибка подключения: {result}")
                return False
        except Exception as e:
            print(f"❌ Ошибка подключения: {e}")
            return False
    
    def run(self):
        """Запуск бота"""
        print("🤖 Запуск Telegram бота My Space...")
        
        # Тест подключения
        if not self.test_connection():
            print("❌ Не удалось подключиться к Telegram API")
            print("💡 Проверьте токен и интернет-соединение")
            return
        
        print("🚀 Бот запущен! Ожидаю сообщений...")
        print("💡 Отправьте /start боту в Telegram для начала работы")
        
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
                time.sleep(5)

if __name__ == "__main__":
    bot = SimpleBot()
    bot.run()
