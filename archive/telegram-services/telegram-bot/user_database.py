import sqlite3
import os
from datetime import datetime

class UserDatabase:
    def __init__(self, db_path="users.db"):
        self.db_path = os.path.join(os.path.dirname(__file__), db_path)
        self.init_database()
    
    def init_database(self):
        """Инициализация базы данных"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Создаем таблицу пользователей
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
        
        # Создаем таблицу записей пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (telegram_id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def register_user(self, telegram_id, username=None, first_name=None, last_name=None):
        """Регистрация нового пользователя"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO users (telegram_id, username, first_name, last_name)
                VALUES (?, ?, ?, ?)
            ''', (telegram_id, username, first_name, last_name))
            
            # Обновляем время последней активности
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
            # Сначала убеждаемся, что пользователь существует
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
    
    def update_entry(self, telegram_id, entry_id, title=None, content=None):
        """Обновить запись пользователя"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            if title and content:
                cursor.execute('''
                    UPDATE user_entries 
                    SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND user_id = ?
                ''', (title, content, entry_id, telegram_id))
            elif title:
                cursor.execute('''
                    UPDATE user_entries 
                    SET title = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND user_id = ?
                ''', (title, entry_id, telegram_id))
            elif content:
                cursor.execute('''
                    UPDATE user_entries 
                    SET content = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND user_id = ?
                ''', (content, entry_id, telegram_id))
            
            conn.commit()
            return cursor.rowcount > 0
        except sqlite3.Error as e:
            print(f"Error updating entry: {e}")
            return False
        finally:
            conn.close()
    
    def delete_entry(self, telegram_id, entry_id):
        """Удалить запись пользователя"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                DELETE FROM user_entries 
                WHERE id = ? AND user_id = ?
            ''', (entry_id, telegram_id))
            
            conn.commit()
            return cursor.rowcount > 0
        except sqlite3.Error as e:
            print(f"Error deleting entry: {e}")
            return False
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
    
    def search_entries(self, telegram_id, query):
        """Поиск записей пользователя"""
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
