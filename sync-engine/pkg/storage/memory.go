package storage

import (
	"fmt"
	"log"
	"sync"
	"time"
)

// MemoryStorageManager управляет in-memory хранилищем (для тестирования)
type MemoryStorageManager struct {
	records    map[string]*Record
	recordsMux sync.RWMutex
	callbacks  []func(*Record)
}

// NewMemoryStorageManager создает новый менеджер in-memory хранилища
func NewMemoryStorageManager() (*MemoryStorageManager, error) {
	return &MemoryStorageManager{
		records:   make(map[string]*Record),
		callbacks: make([]func(*Record), 0),
	}, nil
}

// CreateRecord создает новую запись
func (sm *MemoryStorageManager) CreateRecord(table, id string, data map[string]interface{}) (*Record, error) {
	sm.recordsMux.Lock()
	defer sm.recordsMux.Unlock()

	now := time.Now()
	version := now.UnixNano()
	key := fmt.Sprintf("%s:%s", table, id)

	// Проверяем что запись не существует
	if _, exists := sm.records[key]; exists {
		return nil, fmt.Errorf("record already exists: %s/%s", table, id)
	}

	record := &Record{
		ID:        id,
		Table:     table,
		Data:      data,
		Version:   version,
		CreatedAt: now,
		UpdatedAt: now,
	}

	sm.records[key] = record

	// Вызываем callbacks
	for _, callback := range sm.callbacks {
		callback(record)
	}

	log.Printf("Created record: %s/%s", table, id)
	return record, nil
}

// UpdateRecord обновляет существующую запись
func (sm *MemoryStorageManager) UpdateRecord(table, id string, data map[string]interface{}) (*Record, error) {
	sm.recordsMux.Lock()
	defer sm.recordsMux.Unlock()

	key := fmt.Sprintf("%s:%s", table, id)

	existing, exists := sm.records[key]
	if !exists || existing.DeletedAt != nil {
		return nil, fmt.Errorf("record not found: %s/%s", table, id)
	}

	now := time.Now()
	version := now.UnixNano()

	record := &Record{
		ID:        id,
		Table:     table,
		Data:      data,
		Version:   version,
		CreatedAt: existing.CreatedAt,
		UpdatedAt: now,
	}

	sm.records[key] = record

	// Вызываем callbacks
	for _, callback := range sm.callbacks {
		callback(record)
	}

	log.Printf("Updated record: %s/%s", table, id)
	return record, nil
}

// DeleteRecord удаляет запись (soft delete)
func (sm *MemoryStorageManager) DeleteRecord(table, id string) error {
	sm.recordsMux.Lock()
	defer sm.recordsMux.Unlock()

	key := fmt.Sprintf("%s:%s", table, id)

	existing, exists := sm.records[key]
	if !exists || existing.DeletedAt != nil {
		return fmt.Errorf("record not found: %s/%s", table, id)
	}

	now := time.Now()

	record := &Record{
		ID:        id,
		Table:     table,
		Data:      make(map[string]interface{}),
		Version:   now.UnixNano(),
		CreatedAt: existing.CreatedAt,
		UpdatedAt: now,
		DeletedAt: &now,
	}

	sm.records[key] = record

	// Вызываем callbacks
	for _, callback := range sm.callbacks {
		callback(record)
	}

	log.Printf("Deleted record: %s/%s", table, id)
	return nil
}

// GetRecord получает запись по ID
func (sm *MemoryStorageManager) GetRecord(table, id string) (*Record, error) {
	sm.recordsMux.RLock()
	defer sm.recordsMux.RUnlock()

	key := fmt.Sprintf("%s:%s", table, id)

	record, exists := sm.records[key]
	if !exists {
		return nil, fmt.Errorf("record not found: %s/%s", table, id)
	}

	// Копируем запись чтобы избежать мутаций
	recordCopy := *record
	recordCopy.Data = make(map[string]interface{})
	for k, v := range record.Data {
		recordCopy.Data[k] = v
	}

	return &recordCopy, nil
}

// GetAllRecords получает все записи из таблицы
func (sm *MemoryStorageManager) GetAllRecords(table string) ([]*Record, error) {
	sm.recordsMux.RLock()
	defer sm.recordsMux.RUnlock()

	var records []*Record

	for key, record := range sm.records {
		if record.Table == table && record.DeletedAt == nil {
			// Копируем запись
			recordCopy := *record
			recordCopy.Data = make(map[string]interface{})
			for k, v := range record.Data {
				recordCopy.Data[k] = v
			}
			records = append(records, &recordCopy)
		}
		_ = key // Используем переменную
	}

	return records, nil
}

// GetRecordsSinceVersion получает записи, измененные с указанной версии
func (sm *MemoryStorageManager) GetRecordsSinceVersion(table string, sinceVersion int64) ([]*Record, error) {
	sm.recordsMux.RLock()
	defer sm.recordsMux.RUnlock()

	var records []*Record

	for key, record := range sm.records {
		if record.Table == table && record.Version > sinceVersion {
			// Копируем запись
			recordCopy := *record
			recordCopy.Data = make(map[string]interface{})
			for k, v := range record.Data {
				recordCopy.Data[k] = v
			}
			records = append(records, &recordCopy)
		}
		_ = key // Используем переменную
	}

	return records, nil
}

// AddCallback добавляет callback для изменений записей
func (sm *MemoryStorageManager) AddCallback(callback func(*Record)) {
	sm.callbacks = append(sm.callbacks, callback)
}

// Close закрывает соединение с базой данных
func (sm *MemoryStorageManager) Close() error {
	// Ничего не делаем для in-memory storage
	return nil
}
