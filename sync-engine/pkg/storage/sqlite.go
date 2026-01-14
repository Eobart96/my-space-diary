package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"sync"
	"time"
)

// Record представляет запись в базе данных
type Record struct {
	ID        string                 `json:"id"`
	Table     string                 `json:"table"`
	Data      map[string]interface{} `json:"data"`
	Version   int64                  `json:"version"`
	CreatedAt time.Time              `json:"created_at"`
	UpdatedAt time.Time              `json:"updated_at"`
	DeletedAt *time.Time             `json:"deleted_at,omitempty"`
}

// StorageManager управляет локальным хранилищем
type StorageManager struct {
	db        *sql.DB
	dbPath    string
	mu        sync.RWMutex
	callbacks []func(*Record)
}

// NewStorageManager создает новый менеджер хранилища
func NewStorageManager(dataDir string) (*StorageManager, error) {
	dbPath := filepath.Join(dataDir, "sync.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	storage := &StorageManager{
		db:        db,
		dbPath:    dbPath,
		callbacks: make([]func(*Record), 0),
	}

	// Инициализируем схему
	if err := storage.initSchema(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return storage, nil
}

// initSchema инициализирует схему базы данных
func (sm *StorageManager) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS records (
		id TEXT PRIMARY KEY,
		table_name TEXT NOT NULL,
		data TEXT NOT NULL,
		version INTEGER NOT NULL,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL,
		deleted_at DATETIME
	);
	
	CREATE INDEX IF NOT EXISTS idx_records_table ON records(table_name);
	CREATE INDEX IF NOT EXISTS idx_records_version ON records(version);
	CREATE INDEX IF NOT EXISTS idx_records_deleted ON records(deleted_at);
	`

	_, err := sm.db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to create schema: %w", err)
	}

	return nil
}

// CreateRecord создает новую запись
func (sm *StorageManager) CreateRecord(table, id string, data map[string]interface{}) (*Record, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	now := time.Now()
	version := now.UnixNano()

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}

	record := &Record{
		ID:        id,
		Table:     table,
		Data:      data,
		Version:   version,
		CreatedAt: now,
		UpdatedAt: now,
	}

	query := `
	INSERT INTO records (id, table_name, data, version, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?)
	`

	_, err = sm.db.Exec(query, id, table, string(dataJSON), version, now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to insert record: %w", err)
	}

	// Вызываем callbacks
	for _, callback := range sm.callbacks {
		callback(record)
	}

	log.Printf("Created record: %s/%s", table, id)
	return record, nil
}

// UpdateRecord обновляет существующую запись
func (sm *StorageManager) UpdateRecord(table, id string, data map[string]interface{}) (*Record, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	now := time.Now()
	version := now.UnixNano()

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}

	query := `
	UPDATE records 
	SET data = ?, version = ?, updated_at = ?
	WHERE id = ? AND table_name = ? AND deleted_at IS NULL
	`

	result, err := sm.db.Exec(query, string(dataJSON), version, now, id, table)
	if err != nil {
		return nil, fmt.Errorf("failed to update record: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("record not found: %s/%s", table, id)
	}

	record := &Record{
		ID:        id,
		Table:     table,
		Data:      data,
		Version:   version,
		CreatedAt: now, // В реальном приложении загружаем из БД
		UpdatedAt: now,
	}

	// Вызываем callbacks
	for _, callback := range sm.callbacks {
		callback(record)
	}

	log.Printf("Updated record: %s/%s", table, id)
	return record, nil
}

// DeleteRecord удаляет запись (soft delete)
func (sm *StorageManager) DeleteRecord(table, id string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	now := time.Now()

	query := `
	UPDATE records 
	SET deleted_at = ?, updated_at = ?
	WHERE id = ? AND table_name = ? AND deleted_at IS NULL
	`

	result, err := sm.db.Exec(query, now, now, id, table)
	if err != nil {
		return fmt.Errorf("failed to delete record: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("record not found: %s/%s", table, id)
	}

	record := &Record{
		ID:        id,
		Table:     table,
		Data:      make(map[string]interface{}),
		Version:   now.UnixNano(),
		CreatedAt: now,
		UpdatedAt: now,
		DeletedAt: &now,
	}

	// Вызываем callbacks
	for _, callback := range sm.callbacks {
		callback(record)
	}

	log.Printf("Deleted record: %s/%s", table, id)
	return nil
}

// GetRecord получает запись по ID
func (sm *StorageManager) GetRecord(table, id string) (*Record, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	query := `
	SELECT id, table_name, data, version, created_at, updated_at, deleted_at
	FROM records
	WHERE id = ? AND table_name = ?
	`

	row := sm.db.QueryRow(query, id, table)

	var record Record
	var dataJSON string
	var deletedAt sql.NullTime

	err := row.Scan(
		&record.ID,
		&record.Table,
		&dataJSON,
		&record.Version,
		&record.CreatedAt,
		&record.UpdatedAt,
		&deletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("record not found: %s/%s", table, id)
		}
		return nil, fmt.Errorf("failed to scan record: %w", err)
	}

	if err := json.Unmarshal([]byte(dataJSON), &record.Data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal data: %w", err)
	}

	if deletedAt.Valid {
		record.DeletedAt = &deletedAt.Time
	}

	return &record, nil
}

// GetAllRecords получает все записи из таблицы
func (sm *StorageManager) GetAllRecords(table string) ([]*Record, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	query := `
	SELECT id, table_name, data, version, created_at, updated_at, deleted_at
	FROM records
	WHERE table_name = ? AND deleted_at IS NULL
	ORDER BY updated_at DESC
	`

	rows, err := sm.db.Query(query, table)
	if err != nil {
		return nil, fmt.Errorf("failed to query records: %w", err)
	}
	defer rows.Close()

	var records []*Record

	for rows.Next() {
		var record Record
		var dataJSON string
		var deletedAt sql.NullTime

		err := rows.Scan(
			&record.ID,
			&record.Table,
			&dataJSON,
			&record.Version,
			&record.CreatedAt,
			&record.UpdatedAt,
			&deletedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan record: %w", err)
		}

		if err := json.Unmarshal([]byte(dataJSON), &record.Data); err != nil {
			return nil, fmt.Errorf("failed to unmarshal data: %w", err)
		}

		if deletedAt.Valid {
			record.DeletedAt = &deletedAt.Time
		}

		records = append(records, &record)
	}

	return records, nil
}

// GetRecordsSinceVersion получает записи, измененные с указанной версии
func (sm *StorageManager) GetRecordsSinceVersion(table string, sinceVersion int64) ([]*Record, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	query := `
	SELECT id, table_name, data, version, created_at, updated_at, deleted_at
	FROM records
	WHERE table_name = ? AND version > ?
	ORDER BY version ASC
	`

	rows, err := sm.db.Query(query, table, sinceVersion)
	if err != nil {
		return nil, fmt.Errorf("failed to query records: %w", err)
	}
	defer rows.Close()

	var records []*Record

	for rows.Next() {
		var record Record
		var dataJSON string
		var deletedAt sql.NullTime

		err := rows.Scan(
			&record.ID,
			&record.Table,
			&dataJSON,
			&record.Version,
			&record.CreatedAt,
			&record.UpdatedAt,
			&deletedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan record: %w", err)
		}

		if err := json.Unmarshal([]byte(dataJSON), &record.Data); err != nil {
			return nil, fmt.Errorf("failed to unmarshal data: %w", err)
		}

		if deletedAt.Valid {
			record.DeletedAt = &deletedAt.Time
		}

		records = append(records, &record)
	}

	return records, nil
}

// AddCallback добавляет callback для изменений записей
func (sm *StorageManager) AddCallback(callback func(*Record)) {
	sm.callbacks = append(sm.callbacks, callback)
}

// Close закрывает соединение с базой данных
func (sm *StorageManager) Close() error {
	return sm.db.Close()
}
