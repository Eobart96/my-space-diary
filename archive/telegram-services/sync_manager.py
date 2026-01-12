import sqlite3
import requests
import os
from datetime import datetime
from user_database import UserDatabase

class SyncManager:
    def __init__(self, api_url="http://localhost:3001"):
        self.api_url = api_url
        self.user_db = UserDatabase()
        self.web_db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'Backend', 'diary.db')
    
    def sync_user_to_web(self, telegram_id):
        """Синхронизировать записи пользователя в веб-приложение"""
        try:
            # Получаем все записи пользователя из Telegram БД
            entries = self.user_db.get_user_entries(telegram_id, limit=100)
            
            # Подключаемся к веб-БД
            conn = sqlite3.connect(self.web_db_path)
            cursor = conn.cursor()
            
            # Создаем таблицу для связи пользователей, если нет
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_links (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id INTEGER UNIQUE NOT NULL,
                    web_user_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Регистрируем связь пользователя
            cursor.execute('''
                INSERT OR IGNORE INTO user_links (telegram_id, web_user_id)
                VALUES (?, ?)
            ''', (telegram_id, f"telegram_{telegram_id}"))
            
            synced_count = 0
            for entry in entries:
                entry_id, title, content, date, created_at, updated_at = entry
                
                # Проверяем, существует ли уже такая запись
                cursor.execute('''
                    SELECT id FROM entries 
                    WHERE title = ? AND content = ? AND date = ?
                ''', (title, content, date))
                
                if not cursor.fetchone():
                    # Добавляем запись в веб-БД
                    cursor.execute('''
                        INSERT INTO entries (title, content, date, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (title, content, date, created_at, updated_at))
                    synced_count += 1
            
            conn.commit()
            conn.close()
            
            return synced_count
            
        except Exception as e:
            print(f"Error syncing user to web: {e}")
            return 0
    
    def sync_web_to_telegram(self, telegram_id):
        """Синхронизировать записи из веб-приложения в Telegram"""
        try:
            # Получаем web_user_id
            conn = sqlite3.connect(self.web_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT web_user_id FROM user_links 
                WHERE telegram_id = ?
            ''', (telegram_id,))
            
            result = cursor.fetchone()
            if not result:
                conn.close()
                return 0
            
            web_user_id = result[0]
            
            # Получаем все записи из веб-БД
            cursor.execute('''
                SELECT title, content, date, created_at, updated_at
                FROM entries
                ORDER BY date DESC
            ''')
            
            web_entries = cursor.fetchall()
            conn.close()
            
            synced_count = 0
            for entry in web_entries:
                title, content, date, created_at, updated_at = entry
                
                # Добавляем запись в Telegram БД
                entry_id = self.user_db.add_entry(telegram_id, title, content, date)
                if entry_id:
                    synced_count += 1
            
            return synced_count
            
        except Exception as e:
            print(f"Error syncing web to telegram: {e}")
            return 0
    
    def get_user_sync_status(self, telegram_id):
        """Получить статус синхронизации пользователя"""
        try:
            # Количество записей в Telegram
            telegram_entries = len(self.user_db.get_user_entries(telegram_id, limit=1000))
            
            # Количество записей в веб-приложении
            conn = sqlite3.connect(self.web_db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM entries')
            web_entries = cursor.fetchone()[0]
            
            # Проверяем наличие связи
            cursor.execute('''
                SELECT COUNT(*) FROM user_links 
                WHERE telegram_id = ?
            ''', (telegram_id,))
            
            is_linked = cursor.fetchone()[0] > 0
            conn.close()
            
            return {
                'telegram_entries': telegram_entries,
                'web_entries': web_entries,
                'is_linked': is_linked,
                'last_sync': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            print(f"Error getting sync status: {e}")
            return {
                'telegram_entries': 0,
                'web_entries': 0,
                'is_linked': False,
                'last_sync': None
            }
    
    def enable_sync(self, telegram_id):
        """Включить синхронизацию для пользователя"""
        try:
            conn = sqlite3.connect(self.web_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO user_links (telegram_id, web_user_id)
                VALUES (?, ?)
            ''', (telegram_id, f"telegram_{telegram_id}"))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error enabling sync: {e}")
            return False
    
    def disable_sync(self, telegram_id):
        """Отключить синхронизацию для пользователя"""
        try:
            conn = sqlite3.connect(self.web_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                DELETE FROM user_links 
                WHERE telegram_id = ?
            ''', (telegram_id))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error disabling sync: {e}")
            return False
