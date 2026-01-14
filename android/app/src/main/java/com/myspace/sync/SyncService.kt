package com.myspace.sync

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

/**
 * Foreground Service для поддержания Go sync engine в фоновом режиме
 * 
 * Этот сервис обеспечивает:
 * - Постоянную работу синхронизации в фоне
 * - Защиту от убийства системой Android
 * - Уведомления о статусе синхронизации
 */
class SyncService : Service() {
    
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var syncEngine: SyncEngine? = null
    private var isEngineStarted = false
    
    companion object {
        const val NOTIFICATION_CHANNEL_ID = "sync_service_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_SYNC = "com.myspace.sync.START_SYNC"
        const val ACTION_STOP_SYNC = "com.myspace.sync.STOP_SYNC"
        const val ACTION_GET_STATUS = "com.myspace.sync.GET_STATUS"
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        syncEngine = SyncEngine.getInstance(this)
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_SYNC -> {
                startSyncEngine()
            }
            ACTION_STOP_SYNC -> {
                stopSyncEngine()
            }
            ACTION_GET_STATUS -> {
                broadcastStatus()
            }
        }
        
        return START_STICKY // Перезапуск сервиса если система его убьет
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null // Не поддерживаем привязку
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopSyncEngine()
        serviceScope.cancel()
    }
    
    /**
     * Запускает синхронизацию и показывает уведомление
     */
    private fun startSyncEngine() {
        if (isEngineStarted) return
        
        serviceScope.launch {
            try {
                // Запускаем Go engine
                val success = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    syncEngine?.startEngine() ?: false
                } else {
                    false
                }
                
                if (success) {
                    isEngineStarted = true
                    startForeground(NOTIFICATION_ID, createNotification("Синхронизация активна"))
                    
                    // Запускаем периодическое обновление статуса
                    startStatusUpdates()
                } else {
                    stopSelf()
                }
            } catch (e: Exception) {
                android.util.Log.e("SyncService", "Failed to start sync engine", e)
                stopSelf()
            }
        }
    }
    
    /**
     * Останавливает синхронизацию
     */
    private fun stopSyncEngine() {
        if (!isEngineStarted) return
        
        serviceScope.launch {
            try {
                syncEngine?.stopEngine()
                isEngineStarted = false
                stopForeground(true)
                stopSelf()
            } catch (e: Exception) {
                android.util.Log.e("SyncService", "Failed to stop sync engine", e)
            }
        }
    }
    
    /**
     * Создает канал уведомлений (для Android 8+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Синхронизация MySpace",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Уведомления о статусе синхронизации"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    /**
     * Создает уведомление о статусе синхронизации
     */
    private fun createNotification(statusText: String): Notification {
        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("MySpace Синхронизация")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
    
    /**
     * Запускает периодическое обновление статуса
     */
    private fun startStatusUpdates() {
        serviceScope.launch {
            while (isEngineStarted) {
                try {
                    val status = syncEngine?.getSyncStatus()
                    if (status != null && status.isRunning) {
                        val statusText = if (status.connections.isNotEmpty()) {
                            "Подключено устройств: ${status.connections.size}"
                        } else {
                            "Поиск устройств..."
                        }
                        
                        // Обновляем уведомление
                        val notification = createNotification(statusText)
                        val notificationManager = getSystemService(NotificationManager::class.java)
                        notificationManager.notify(NOTIFICATION_ID, notification)
                    }
                    
                    delay(30000) // Обновляем каждые 30 секунд
                } catch (e: Exception) {
                    android.util.Log.e("SyncService", "Failed to update status", e)
                    delay(60000) // При ошибке ждем дольше
                }
            }
        }
    }
    
    /**
     * Рассылает статус синхронизации через broadcast
     */
    private fun broadcastStatus() {
        serviceScope.launch {
            try {
                val status = syncEngine?.getSyncStatus()
                if (status != null) {
                    val intent = Intent("com.myspace.sync.STATUS_UPDATE").apply {
                        putExtra("device_name", status.deviceName)
                        putExtra("is_running", status.isRunning)
                        putExtra("connections", status.connections.toTypedArray())
                        putExtra("last_sync_time", status.lastSyncTime)
                    }
                    sendBroadcast(intent)
                }
            } catch (e: Exception) {
                android.util.Log.e("SyncService", "Failed to broadcast status", e)
            }
        }
    }
}
