package crypto

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Identity представляет криптографическую идентичность устройства
type Identity struct {
	PrivateKey ed25519.PrivateKey `json:"private_key"`
	PublicKey  ed25519.PublicKey  `json:"public_key"`
	AccountID  string             `json:"account_id"`
}

// DeviceInfo содержит информацию об устройстве для handshake
type DeviceInfo struct {
	AccountID   string `json:"account_id"`
	PublicKey   string `json:"public_key"`
	DeviceName  string `json:"device_name"`
	Timestamp   int64  `json:"timestamp"`
	Signature   string `json:"signature"`
}

// NewIdentity создает новую криптографическую идентичность
func NewIdentity(deviceName string) (*Identity, error) {
	publicKey, privateKey, err := ed25519.GenerateKey(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	accountID := sha256.Sum256(publicKey)
	
	return &Identity{
		PrivateKey: privateKey,
		PublicKey:  publicKey,
		AccountID:  hex.EncodeToString(accountID[:]),
	}, nil
}

// LoadOrCreateIdentity загружает существующую идентичность или создает новую
func LoadOrCreateIdentity(dataDir, deviceName string) (*Identity, error) {
	keyPath := filepath.Join(dataDir, "identity.json")
	
	// Проверяем существует ли файл с идентичностью
	if _, err := os.Stat(keyPath); err == nil {
		// Загружаем существующую идентичность
		data, err := os.ReadFile(keyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read identity file: %w", err)
		}
		
		var identity Identity
		if err := json.Unmarshal(data, &identity); err != nil {
			return nil, fmt.Errorf("failed to unmarshal identity: %w", err)
		}
		
		return &identity, nil
	}
	
	// Создаем новую идентичность
	identity, err := NewIdentity(deviceName)
	if err != nil {
		return nil, err
	}
	
	// Сохраняем идентичность
	if err := identity.Save(keyPath); err != nil {
		return nil, fmt.Errorf("failed to save identity: %w", err)
	}
	
	return identity, nil
}

// Save сохраняет идентичность в файл
func (i *Identity) Save(path string) error {
	data, err := json.Marshal(i)
	if err != nil {
		return fmt.Errorf("failed to marshal identity: %w", err)
	}
	
	// Создаем директорию если не существует
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	
	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("failed to write identity file: %w", err)
	}
	
	return nil
}

// CreateDeviceInfo создает информацию об устройстве для handshake
func (i *Identity) CreateDeviceInfo(deviceName string) (*DeviceInfo, error) {
	timestamp := getCurrentTimestamp()
	
	// Создаем данные для подписи
	dataToSign := fmt.Sprintf("%s|%s|%d", i.AccountID, deviceName, timestamp)
	signature := ed25519.Sign(i.PrivateKey, []byte(dataToSign))
	
	return &DeviceInfo{
		AccountID:  i.AccountID,
		PublicKey:  hex.EncodeToString(i.PublicKey),
		DeviceName: deviceName,
		Timestamp:  timestamp,
		Signature:  hex.EncodeToString(signature),
	}, nil
}

// VerifyDeviceInfo проверяет подпись информации об устройстве
func VerifyDeviceInfo(info *DeviceInfo) error {
	// Декодируем публичный ключ
	publicKey, err := hex.DecodeString(info.PublicKey)
	if err != nil {
		return fmt.Errorf("failed to decode public key: %w", err)
	}
	
	if len(publicKey) != ed25519.PublicKeySize {
		return fmt.Errorf("invalid public key size")
	}
	
	// Декодируем подпись
	signature, err := hex.DecodeString(info.Signature)
	if err != nil {
		return fmt.Errorf("failed to decode signature: %w", err)
	}
	
	// Создаем данные для проверки
	dataToVerify := fmt.Sprintf("%s|%s|%d", info.AccountID, info.DeviceName, info.Timestamp)
	
	// Проверяем подпись
	if !ed25519.Verify(publicKey, []byte(dataToVerify), signature) {
		return fmt.Errorf("invalid signature")
	}
	
	// Проверяем совпадение AccountID с публичным ключом
	accountID := sha256.Sum256(publicKey)
	expectedAccountID := hex.EncodeToString(accountID[:])
	
	if info.AccountID != expectedAccountID {
		return fmt.Errorf("account ID mismatch")
	}
	
	return nil
}

// IsSameAccount проверяет, принадлежит ли устройство тому же аккаунту
func (i *Identity) IsSameAccount(otherAccountID string) bool {
	return i.AccountID == otherAccountID
}

func getCurrentTimestamp() int64 {
	// В реальном приложении использовать time.Now().Unix()
	return 1642123456 // Mock timestamp
}
