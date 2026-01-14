package storage

// Interface определяет контракт для хранилищ
type Interface interface {
	// CreateRecord создает новую запись
	CreateRecord(table, id string, data map[string]interface{}) (*Record, error)

	// UpdateRecord обновляет существующую запись
	UpdateRecord(table, id string, data map[string]interface{}) (*Record, error)

	// DeleteRecord удаляет запись
	DeleteRecord(table, id string) error

	// GetRecord получает запись по ID
	GetRecord(table, id string) (*Record, error)

	// GetAllRecords получает все записи из таблицы
	GetAllRecords(table string) ([]*Record, error)

	// GetRecordsSinceVersion получает записи, измененные с указанной версии
	GetRecordsSinceVersion(table string, sinceVersion int64) ([]*Record, error)

	// AddCallback добавляет callback для изменений записей
	AddCallback(callback func(*Record))

	// Close закрывает соединение
	Close() error
}
