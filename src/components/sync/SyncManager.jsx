import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Context для синхронизации
const SyncContext = createContext();

// API endpoints для localhost
const API_BASE = 'http://localhost:8080';

/**
 * SyncProvider - компонент для управления синхронизацией
 * 
 * Обеспечивает:
 * - Подключение к Go sync engine
 * - Отслеживание статуса синхронизации
 * - CRUD операции с записями
 * - Автоматическое обновление данных
 */
export function SyncProvider({ children }) {
  const [status, setStatus] = useState({
    isRunning: false,
    deviceName: '',
    accountID: '',
    connections: [],
    lastSyncTime: null,
    error: null
  });
  
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Проверка доступности sync engine
  const checkEngineAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      if (response.ok) {
        const engineStatus = await response.json();
        setStatus(prev => ({
          ...prev,
          isRunning: true,
          deviceName: engineStatus.device_name,
          accountID: engineStatus.account_id,
          connections: engineStatus.connections || [],
          lastSyncTime: Date.now(),
          error: null
        }));
        setIsOnline(true);
        return true;
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        error: 'Sync engine недоступен'
      }));
      setIsOnline(false);
      return false;
    }
  }, []);

  // Загрузка всех записей
  const loadEntries = useCallback(async () => {
    if (!isOnline) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/records/diary_entries`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.records || []);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

  // Создание новой записи
  const createEntry = useCallback(async (entryData) => {
    if (!isOnline) throw new Error('Sync engine недоступен');
    
    try {
      const response = await fetch(`${API_BASE}/api/records/diary_entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `entry_${Date.now()}`,
          data: entryData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create entry');
      }
      
      const result = await response.json();
      
      // Обновляем локальный список
      await loadEntries();
      
      return result;
    } catch (error) {
      console.error('Failed to create entry:', error);
      throw error;
    }
  }, [isOnline, loadEntries]);

  // Обновление записи
  const updateEntry = useCallback(async (id, entryData) => {
    if (!isOnline) throw new Error('Sync engine недоступен');
    
    try {
      const response = await fetch(`${API_BASE}/api/records/diary_entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: entryData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update entry');
      }
      
      const result = await response.json();
      
      // Обновляем локальный список
      await loadEntries();
      
      return result;
    } catch (error) {
      console.error('Failed to update entry:', error);
      throw error;
    }
  }, [isOnline, loadEntries]);

  // Удаление записи
  const deleteEntry = useCallback(async (id) => {
    if (!isOnline) throw new Error('Sync engine недоступен');
    
    try {
      const response = await fetch(`${API_BASE}/api/records/diary_entries/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }
      
      // Обновляем локальный список
      await loadEntries();
      
      return true;
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  }, [isOnline, loadEntries]);

  // Получение статуса синхронизации
  const refreshStatus = useCallback(async () => {
    await checkEngineAvailability();
  }, [checkEngineAvailability]);

  // Инициализация при монтировании
  useEffect(() => {
    let statusInterval;
    
    const initialize = async () => {
      const isAvailable = await checkEngineAvailability();
      if (isAvailable) {
        await loadEntries();
        
        // Периодическое обновление статуса
        statusInterval = setInterval(() => {
          checkEngineAvailability();
        }, 10000); // Каждые 10 секунд
      }
    };
    
    initialize();
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [checkEngineAvailability, loadEntries]);

  // WebSocket для real-time обновлений
  useEffect(() => {
    if (!isOnline) return;
    
    let ws;
    let reconnectTimeout;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8080/ws');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'sync_data') {
              // Обновляем данные при синхронизации
              loadEntries();
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          
          // Попытка переподключения через 5 секунд
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [isOnline, loadEntries]);

  const value = {
    // Статус
    status,
    isOnline,
    isLoading,
    
    // Данные
    entries,
    
    // Методы
    refreshStatus,
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

// Hook для использования синхронизации
export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}

// Компонент для отображения статуса синхронизации
export function SyncStatus() {
  const { status, isOnline, refreshStatus } = useSync();
  
  if (!isOnline) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center justify-between">
          <div>
            <strong className="font-bold">Синхронизация недоступна</strong>
            <span className="block sm:inline"> Sync engine не запущен</span>
          </div>
          <button
            onClick={refreshStatus}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      <div className="flex items-center justify-between">
        <div>
          <strong className="font-bold">Синхронизация активна</strong>
          <span className="block sm:inline">
            {' '}Устройство: {status.deviceName} | 
            Подключено: {status.connections.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Online</span>
        </div>
      </div>
    </div>
  );
}
