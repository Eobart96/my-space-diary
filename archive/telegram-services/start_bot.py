import subprocess
import sys
import os
from pathlib import Path

def main():
    """Запуск Telegram бота"""
    print("🤖 Запуск Telegram бота My Space...")
    
    # Путь к папке с ботом
    bot_dir = Path(__file__).parent / "telegram-bot"
    
    # Проверяем наличие .env файла
    env_file = bot_dir / ".env"
    if not env_file.exists():
        print("⚠️ Файл .env не найден!")
        print("Пожалуйста, создайте его на основе .env.example:")
        print(f"1. Скопируйте {bot_dir / '.env.example'} в {env_file}")
        print("2. Добавьте ваш TELEGRAM_BOT_TOKEN от @BotFather")
        return
    
    # Устанавливаем зависимости
    print("📦 Проверка зависимостей...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "requests", "python-dotenv"], 
                      cwd=Path(__file__).parent, check=True)
    except subprocess.CalledProcessError:
        print("❌ Ошибка установки зависимостей")
        return
    
    # Запускаем автономного бота
    print("🚀 Запуск автономного бота...")
    try:
        subprocess.run([sys.executable, "bot_standalone.py"], cwd=bot_dir, check=True)
    except subprocess.CalledProcessError:
        print("❌ Ошибка запуска бота")
    except KeyboardInterrupt:
        print("\n👋 Бот остановлен")

if __name__ == "__main__":
    main()
