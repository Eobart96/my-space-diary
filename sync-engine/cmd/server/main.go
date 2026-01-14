package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"myspace-sync/pkg/crypto"
	"myspace-sync/pkg/discovery"
	"myspace-sync/pkg/storage"
	"myspace-sync/pkg/sync"
)

// SyncEngine объединяет все компоненты синхронизации
type SyncEngine struct {
	identity    *crypto.Identity
	discovery   *discovery.DiscoveryManager
	syncManager *sync.SyncManager
	storage     storage.Interface // Используем интерфейс
	dataDir     string
	deviceName  string
}

// NewSyncEngine создает новый движок синхронизации
func NewSyncEngine(dataDir, deviceName string) (*SyncEngine, error) {
	// Создаем директорию для данных
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	// Загружаем или создаем идентичность
	identity, err := crypto.LoadOrCreateIdentity(dataDir, deviceName)
	if err != nil {
		return nil, fmt.Errorf("failed to load/create identity: %w", err)
	}

	// Создаем менеджер хранилища (используем memory storage для тестирования)
	storageManager, err := storage.NewMemoryStorageManager()
	if err != nil {
		return nil, fmt.Errorf("failed to create storage manager: %w", err)
	}

	// Создаем менеджер синхронизации
	syncManager := sync.NewSyncManager(identity.AccountID, string(identity.PrivateKey))

	// Создаем менеджер обнаружения
	discoveryManager := discovery.NewDiscoveryManager(identity.AccountID, deviceName)

	engine := &SyncEngine{
		identity:    identity,
		discovery:   discoveryManager,
		syncManager: syncManager,
		storage:     storageManager,
		dataDir:     dataDir,
		deviceName:  deviceName,
	}

	// Настраиваем callbacks
	engine.setupCallbacks()

	return engine, nil
}

// setupCallbacks настраивает обработчики событий
func (se *SyncEngine) setupCallbacks() {
	// Callback для обнаруженных устройств
	se.discovery.AddCallback(func(device *discovery.Device) {
		if se.identity.IsSameAccount(device.AccountID) {
			log.Printf("Found same account device: %s (%s:%d)", device.Name, device.IP, device.Port)

			// Подключаемся к устройству
			go func() {
				address := fmt.Sprintf("%s:%d", device.IP.String(), device.Port)
				if err := se.syncManager.ConnectToDevice(address, device.AccountID); err != nil {
					log.Printf("Failed to connect to %s: %v", device.AccountID, err)
				}
			}()
		} else {
			log.Printf("Ignoring different account device: %s", device.AccountID)
		}
	})

	// Callback для данных синхронизации
	se.syncManager.AddCallback(func(syncData *sync.SyncData) {
		se.handleSyncData(syncData)
	})

	// Callback для изменений в хранилище
	se.storage.AddCallback(func(record *storage.Record) {
		se.handleStorageChange(record)
	})
}

// Start запускает движок синхронизации
func (se *SyncEngine) Start() error {
	log.Printf("Starting sync engine for device: %s", se.deviceName)
	log.Printf("Account ID: %s", se.identity.AccountID)

	// Запускаем обнаружение устройств
	if err := se.discovery.Start(); err != nil {
		return fmt.Errorf("failed to start discovery: %w", err)
	}

	// Запускаем WebSocket сервер в отдельной goroutine
	go func() {
		if err := se.syncManager.StartServer(8080); err != nil {
			log.Printf("Sync server error: %v", err)
		}
	}()

	// Создаем демо-данные
	se.createDemoData()

	log.Println("Sync engine started successfully")
	return nil
}

// Stop останавливает движок синхронизации
func (se *SyncEngine) Stop() {
	log.Println("Stopping sync engine...")

	if se.discovery != nil {
		se.discovery.Stop()
	}

	if se.syncManager != nil {
		se.syncManager.Stop()
	}

	if se.storage != nil {
		se.storage.Close()
	}

	log.Println("Sync engine stopped")
}

// handleSyncData обрабатывает входящие данные синхронизации
func (se *SyncEngine) handleSyncData(syncData *sync.SyncData) {
	log.Printf("Processing sync data: %s %s %s", syncData.Operation, syncData.Table, syncData.RecordID)

	switch syncData.Operation {
	case "create":
		_, err := se.storage.CreateRecord(syncData.Table, syncData.RecordID, syncData.Data)
		if err != nil {
			log.Printf("Failed to create record from sync: %v", err)
		}

	case "update":
		_, err := se.storage.UpdateRecord(syncData.Table, syncData.RecordID, syncData.Data)
		if err != nil {
			log.Printf("Failed to update record from sync: %v", err)
		}

	case "delete":
		err := se.storage.DeleteRecord(syncData.Table, syncData.RecordID)
		if err != nil {
			log.Printf("Failed to delete record from sync: %v", err)
		}
	}
}

// handleStorageChange обрабатывает изменения в локальном хранилище
func (se *SyncEngine) handleStorageChange(record *storage.Record) {
	var operation string

	if record.DeletedAt != nil {
		operation = "delete"
	} else {
		// Проверяем, это новая запись или обновление
		existing, err := se.storage.GetRecord(record.Table, record.ID)
		if err != nil {
			operation = "create"
		} else if existing.Version < record.Version {
			operation = "update"
		} else {
			return // Пропускаем старые версии
		}
	}

	syncData := &sync.SyncData{
		Operation: operation,
		Table:     record.Table,
		RecordID:  record.ID,
		Data:      record.Data,
		Version:   record.Version,
	}

	// Рассылаем изменения другим устройствам
	if err := se.syncManager.BroadcastSync(syncData); err != nil {
		log.Printf("Failed to broadcast sync: %v", err)
	}
}

// createDemoData создает демо-данные для тестирования
func (se *SyncEngine) createDemoData() {
	// Создаем демо-запись в таблице diary_entries
	demoData := map[string]interface{}{
		"title":   "Моя первая запись",
		"content": "Это демо-запись для тестирования синхронизации",
		"date":    time.Now().Format("2006-01-02"),
		"mood":    "хорошо",
		"tags":    []string{"демо", "тест"},
	}

	record, err := se.storage.CreateRecord("diary_entries", "demo-1", demoData)
	if err != nil {
		log.Printf("Failed to create demo data: %v", err)
		return
	}

	log.Printf("Created demo record: %s/%s (version: %d)", record.Table, record.ID, record.Version)
}

// GetStatus возвращает статус синхронизации
func (se *SyncEngine) GetStatus() map[string]interface{} {
	connections := se.syncManager.GetConnections()
	devices := se.discovery.GetDevices()

	return map[string]interface{}{
		"device_name": se.deviceName,
		"account_id":  se.identity.AccountID,
		"connections": len(connections),
		"devices":     len(devices),
		"data_dir":    se.dataDir,
		"status":      "running",
	}
}

func main() {
	var (
		dataDir    = flag.String("data-dir", "./data", "Data directory path")
		deviceName = flag.String("device-name", "unknown", "Device name")
	)
	flag.Parse()

	// Если имя устройства не указано, используем hostname
	if *deviceName == "unknown" {
		if hostname, err := os.Hostname(); err == nil {
			*deviceName = hostname
		}
	}

	// Создаем движок синхронизации
	engine, err := NewSyncEngine(*dataDir, *deviceName)
	if err != nil {
		log.Fatalf("Failed to create sync engine: %v", err)
	}

	// Запускаем движок
	if err := engine.Start(); err != nil {
		log.Fatalf("Failed to start sync engine: %v", err)
	}

	// Настраиваем graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Периодически выводим статус
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-sigChan:
			engine.Stop()
			os.Exit(0)

		case <-ticker.C:
			status := engine.GetStatus()
			log.Printf("Status: %+v", status)
		}
	}
}
