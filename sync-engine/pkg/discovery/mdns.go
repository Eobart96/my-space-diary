package discovery

import (
	"context"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/grandcat/zeroconf"
)

const (
	ServiceName = "_myspace-sync._tcp"
	ServicePort = 8080
)

// Device представляет обнаруженное устройство
type Device struct {
	Name      string
	IP        net.IP
	Port      int
	AccountID string
	Text      []string
}

// DiscoveryManager управляет обнаружением устройств
type DiscoveryManager struct {
	server     *zeroconf.Server
	client     *zeroconf.Resolver
	devices    map[string]*Device
	devicesMux sync.RWMutex
	accountID  string
	deviceName string
	callbacks  []func(*Device)
	ctx        context.Context
	cancel     context.CancelFunc
}

// NewDiscoveryManager создает новый менеджер обнаружения
func NewDiscoveryManager(accountID, deviceName string) *DiscoveryManager {
	ctx, cancel := context.WithCancel(context.Background())

	return &DiscoveryManager{
		devices:    make(map[string]*Device),
		accountID:  accountID,
		deviceName: deviceName,
		callbacks:  make([]func(*Device), 0),
		ctx:        ctx,
		cancel:     cancel,
	}
}

// Start запускает обнаружение устройств
func (dm *DiscoveryManager) Start() error {
	var err error

	// Регистрируем себя в сети
	txtRecords := []string{
		fmt.Sprintf("account_id=%s", dm.accountID),
		fmt.Sprintf("device_name=%s", dm.deviceName),
		fmt.Sprintf("version=1.0"),
	}

	dm.server, err = zeroconf.Register(
		dm.deviceName,
		ServiceName,
		"local.",
		ServicePort,
		txtRecords,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to register service: %w", err)
	}

	// Начинаем поиск других устройств
	dm.client, err = zeroconf.NewResolver(nil)
	if err != nil {
		dm.server.Shutdown()
		return fmt.Errorf("failed to create resolver: %w", err)
	}

	// Запускаем поиск в отдельной goroutine
	go dm.browse()

	log.Printf("Discovery started for device: %s (account: %s)", dm.deviceName, dm.accountID)
	return nil
}

// Stop останавливает обнаружение
func (dm *DiscoveryManager) Stop() {
	dm.cancel()

	if dm.server != nil {
		dm.server.Shutdown()
	}

	if dm.client != nil {
		// zeroconf не имеет явного метода Stop для resolver
	}

	log.Println("Discovery stopped")
}

// AddCallback добавляет callback для обнаруженных устройств
func (dm *DiscoveryManager) AddCallback(callback func(*Device)) {
	dm.callbacks = append(dm.callbacks, callback)
}

// GetDevices возвращает список обнаруженных устройств
func (dm *DiscoveryManager) GetDevices() []*Device {
	dm.devicesMux.RLock()
	defer dm.devicesMux.RUnlock()

	devices := make([]*Device, 0, len(dm.devices))
	for _, device := range dm.devices {
		devices = append(devices, device)
	}

	return devices
}

// browse выполняет поиск устройств в сети
func (dm *DiscoveryManager) browse() {
	entries := make(chan *zeroconf.ServiceEntry)
	defer close(entries)

	go func() {
		for {
			select {
			case entry, ok := <-entries:
				if !ok {
					return
				}
				dm.handleServiceEntry(entry)
			case <-dm.ctx.Done():
				return
			}
		}
	}()

	// Выполняем поиск с периодическим обновлением
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			err := dm.client.Browse(dm.ctx, ServiceName, "local.", entries)
			if err != nil {
				log.Printf("Browse error: %v", err)
			}
		case <-dm.ctx.Done():
			return
		}
	}
}

// handleServiceEntry обрабатывает обнаруженную службу
func (dm *DiscoveryManager) handleServiceEntry(entry *zeroconf.ServiceEntry) {
	if len(entry.AddrIPv4) == 0 && len(entry.AddrIPv6) == 0 {
		return
	}

	// Получаем первый доступный IP
	var ip net.IP
	if len(entry.AddrIPv4) > 0 {
		ip = entry.AddrIPv4[0]
	} else if len(entry.AddrIPv6) > 0 {
		ip = entry.AddrIPv6[0]
	} else {
		return
	}

	// Извлекаем AccountID из TXT записей
	var accountID string
	var deviceName string

	for _, txt := range entry.Text {
		if len(txt) > 10 && txt[:10] == "account_id" {
			accountID = txt[11:] // Пропускаем "account_id="
		}
		if len(txt) > 11 && txt[:11] == "device_name" {
			deviceName = txt[12:] // Пропускаем "device_name="
		}
	}

	if accountID == "" {
		log.Printf("Device %s has no account_id", entry.Service)
		return
	}

	// Игнорируем себя
	if accountID == dm.accountID && deviceName == dm.deviceName {
		return
	}

	device := &Device{
		Name:      entry.Service,
		IP:        ip,
		Port:      entry.Port,
		AccountID: accountID,
		Text:      entry.Text,
	}

	// Обновляем список устройств
	dm.devicesMux.Lock()
	dm.devices[accountID] = device
	dm.devicesMux.Unlock()

	// Вызываем callbacks
	for _, callback := range dm.callbacks {
		callback(device)
	}

	log.Printf("Discovered device: %s (%s:%d, account: %s)",
		deviceName, ip, entry.Port, accountID)
}

// RemoveDevice удаляет устройство из списка
func (dm *DiscoveryManager) RemoveDevice(accountID string) {
	dm.devicesMux.Lock()
	delete(dm.devices, accountID)
	dm.devicesMux.Unlock()

	log.Printf("Removed device: %s", accountID)
}
