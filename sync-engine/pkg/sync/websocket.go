package sync

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// SyncMessage представляет сообщение синхронизации
type SyncMessage struct {
	Type      string      `json:"type"`
	AccountID string      `json:"account_id"`
	Data      interface{} `json:"data"`
	Timestamp int64       `json:"timestamp"`
	Signature string      `json:"signature"`
}

// SyncData представляет данные для синхронизации
type SyncData struct {
	Operation string                 `json:"operation"` // create, update, delete
	Table     string                 `json:"table"`
	RecordID  string                 `json:"record_id"`
	Data      map[string]interface{} `json:"data"`
	Version   int64                  `json:"version"`
}

// SyncConnection представляет соединение с другим устройством
type SyncConnection struct {
	conn       *websocket.Conn
	accountID  string
	deviceName string
	lastSeen   time.Time
	mu         sync.Mutex
}

// SyncManager управляет синхронизацией
type SyncManager struct {
	connections    map[string]*SyncConnection
	connectionsMux sync.RWMutex
	accountID      string
	privateKey     string
	server         *http.Server
	upgrader       websocket.Upgrader
	callbacks      []func(*SyncData)
}

// NewSyncManager создает новый менеджер синхронизации
func NewSyncManager(accountID, privateKey string) *SyncManager {
	return &SyncManager{
		connections: make(map[string]*SyncConnection),
		accountID:   accountID,
		privateKey:  privateKey,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // В локальной сети разрешаем все источники
			},
		},
		callbacks: make([]func(*SyncData), 0),
	}
}

// StartServer запускает WebSocket сервер
func (sm *SyncManager) StartServer(port int) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", sm.handleWebSocket)

	sm.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}

	log.Printf("Sync server starting on port %d", port)
	return sm.server.ListenAndServe()
}

// ConnectToDevice подключается к другому устройству
func (sm *SyncManager) ConnectToDevice(host, accountID string) error {
	wsURL := fmt.Sprintf("ws://%s/ws", host)

	// Используем TLS для шифрования
	dialer := websocket.Dialer{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // Для локальной сети
		},
	}

	conn, _, err := dialer.Dial(wsURL, nil)
	if err != nil {
		return fmt.Errorf("failed to connect to %s: %w", host, err)
	}

	syncConn := &SyncConnection{
		conn:      conn,
		accountID: accountID,
		lastSeen:  time.Now(),
	}

	sm.connectionsMux.Lock()
	sm.connections[accountID] = syncConn
	sm.connectionsMux.Unlock()

	// Запускаем обработчик сообщений
	go sm.handleConnection(syncConn)

	log.Printf("Connected to device: %s", accountID)
	return nil
}

// handleWebSocket обрабатывает входящие WebSocket соединения
func (sm *SyncManager) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := sm.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Выполняем handshake
	accountID, err := sm.performHandshake(conn)
	if err != nil {
		log.Printf("Handshake failed: %v", err)
		conn.Close()
		return
	}

	syncConn := &SyncConnection{
		conn:      conn,
		accountID: accountID,
		lastSeen:  time.Now(),
	}

	sm.connectionsMux.Lock()
	sm.connections[accountID] = syncConn
	sm.connectionsMux.Unlock()

	// Запускаем обработчик сообщений
	go sm.handleConnection(syncConn)

	log.Printf("Device connected: %s", accountID)
}

// performHandshake выполняет аутентификацию устройства
func (sm *SyncManager) performHandshake(conn *websocket.Conn) (string, error) {
	// Ожидаем handshake сообщение
	_, message, err := conn.ReadMessage()
	if err != nil {
		return "", fmt.Errorf("failed to read handshake message: %w", err)
	}

	var handshakeMsg SyncMessage
	if err := json.Unmarshal(message, &handshakeMsg); err != nil {
		return "", fmt.Errorf("failed to unmarshal handshake: %w", err)
	}

	if handshakeMsg.Type != "handshake" {
		return "", fmt.Errorf("expected handshake message, got: %s", handshakeMsg.Type)
	}

	// Проверяем подпись (в реальном коде здесь будет криптографическая проверка)
	if !sm.verifyHandshakeSignature(&handshakeMsg) {
		return "", fmt.Errorf("invalid handshake signature")
	}

	// Отправляем ответ
	response := SyncMessage{
		Type:      "handshake_response",
		AccountID: sm.accountID,
		Timestamp: time.Now().Unix(),
	}

	responseData, _ := json.Marshal(response)
	if err := conn.WriteMessage(websocket.TextMessage, responseData); err != nil {
		return "", fmt.Errorf("failed to send handshake response: %w", err)
	}

	return handshakeMsg.AccountID, nil
}

// handleConnection обрабатывает сообщения от соединения
func (sm *SyncManager) handleConnection(syncConn *SyncConnection) {
	defer func() {
		syncConn.conn.Close()
		sm.connectionsMux.Lock()
		delete(sm.connections, syncConn.accountID)
		sm.connectionsMux.Unlock()
		log.Printf("Device disconnected: %s", syncConn.accountID)
	}()

	for {
		_, message, err := syncConn.conn.ReadMessage()
		if err != nil {
			log.Printf("Read error from %s: %v", syncConn.accountID, err)
			break
		}

		var syncMsg SyncMessage
		if err := json.Unmarshal(message, &syncMsg); err != nil {
			log.Printf("Failed to unmarshal message from %s: %v", syncConn.accountID, err)
			continue
		}

		// Обрабатываем только сообщения от того же аккаунта
		if syncMsg.AccountID != sm.accountID {
			log.Printf("Ignoring message from different account: %s", syncMsg.AccountID)
			continue
		}

		// Обрабатываем синхронизацию данных
		if syncMsg.Type == "sync_data" {
			sm.handleSyncData(&syncMsg)
		}

		syncConn.mu.Lock()
		syncConn.lastSeen = time.Now()
		syncConn.mu.Unlock()
	}
}

// handleSyncData обрабатывает данные синхронизации
func (sm *SyncManager) handleSyncData(msg *SyncMessage) {
	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		log.Printf("Failed to marshal sync data: %v", err)
		return
	}

	var syncData SyncData
	if err := json.Unmarshal(dataBytes, &syncData); err != nil {
		log.Printf("Failed to unmarshal sync data: %v", err)
		return
	}

	// Вызываем callbacks
	for _, callback := range sm.callbacks {
		callback(&syncData)
	}

	log.Printf("Received sync data: %s %s %s", syncData.Operation, syncData.Table, syncData.RecordID)
}

// BroadcastSync рассылает данные синхронизации всем подключенным устройствам
func (sm *SyncManager) BroadcastSync(data *SyncData) error {
	message := SyncMessage{
		Type:      "sync_data",
		AccountID: sm.accountID,
		Data:      data,
		Timestamp: time.Now().Unix(),
		// Signature: sm.signMessage(data), // В реальном коде добавляем подпись
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast message: %w", err)
	}

	sm.connectionsMux.RLock()
	defer sm.connectionsMux.RUnlock()

	for _, syncConn := range sm.connections {
		if err := syncConn.conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
			log.Printf("Failed to send to %s: %v", syncConn.accountID, err)
		}
	}

	return nil
}

// AddCallback добавляет callback для обработки данных синхронизации
func (sm *SyncManager) AddCallback(callback func(*SyncData)) {
	sm.callbacks = append(sm.callbacks, callback)
}

// GetConnections возвращает список активных соединений
func (sm *SyncManager) GetConnections() []string {
	sm.connectionsMux.RLock()
	defer sm.connectionsMux.RUnlock()

	connections := make([]string, 0, len(sm.connections))
	for accountID := range sm.connections {
		connections = append(connections, accountID)
	}

	return connections
}

// verifyHandshakeSignature проверяет подпись handshake (заглушка)
func (sm *SyncManager) verifyHandshakeSignature(msg *SyncMessage) bool {
	// В реальном коде здесь будет проверка Ed25519 подписи
	return true
}

// Stop останавливает сервер синхронизации
func (sm *SyncManager) Stop() error {
	if sm.server != nil {
		return sm.server.Close()
	}
	return nil
}
